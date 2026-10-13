import type { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import type { ReviewFailure, ReviewInput, ReviewResult } from '../../shared/reviews.js';

// 状态和版本同时匹配才更新，并递增版本，防止重复审核或并发覆盖。
const updateSubmissionSql = `UPDATE submissions
  SET status = ?, reject_reason = ?, reviewed_at = ?, reviewed_by = ?, version = version + 1
  WHERE id = ? AND status = 'pending' AND version = ?`;

const insertLogSql = `INSERT INTO review_logs(
    submission_id, operator_id, action, from_status, to_status, reason, created_at, batch_id
  )
  VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`;

// 查找指定投稿的审核失败原因
function reviewFailure(db: DatabaseSync, id: number): ReviewFailure {
  const statement = db.prepare('SELECT id FROM submissions WHERE id = ?');
  const exists = Boolean(statement.get(id));

  const code = exists ? 'STATUS_CONFLICT' : 'NOT_FOUND';
  const message = exists ? '投稿状态或版本已变化，请刷新后查看。' : '投稿不存在。';

  const failure = {
    id,
    code,
    message,
  };

  return failure;
}

export function reviewSubmissions(db: DatabaseSync, input: ReviewInput): ReviewResult {
  const {
    items,
    action,
    operatorId,
  } = input;

  const isRejection = action === 'reject';
  const trimmedReason = input.reason?.trim() ?? null;

  const reason = isRejection ? trimmedReason : null;
  const status = isRejection ? 'rejected' : 'approved';

  const now = new Date().toISOString();
  // 同一批次共用时间和批次编号，便于关联每条成功审核的日志。
  const batchId = randomUUID();

  const result: ReviewResult = {
    batchId,
    successIds: [],
    failures: [],
  };

  // 提前取得写锁，将本批次的状态更新和日志写入纳入同一事务。
  db.exec('BEGIN IMMEDIATE');

  try {
    const updateStatement = db.prepare(updateSubmissionSql);
    const logStatement = db.prepare(insertLogSql);

    for (const item of items) {
      const { id, version } = item;
      const updated = updateStatement.run(status, reason, now, operatorId, id, version);

      // 不存在或状态、版本冲突属于逐条失败，其余投稿仍继续处理。
      if (!updated.changes) {
        const failure = reviewFailure(db, id);

        result.failures.push(failure);
        continue;
      }

      // 仅为成功更新的投稿写日志，状态与日志一起提交。
      logStatement.run(id, operatorId, action, status, reason, now, batchId);
      result.successIds.push(id);
    }

    db.exec('COMMIT');
  } catch (error) {
    // 数据库异常回滚整批，包括此前已成功更新的投稿和日志。
    db.exec('ROLLBACK');

    throw error;
  }

  return result;
}
