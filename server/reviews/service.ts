import type { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import type { ReviewFailure, ReviewInput, ReviewResult } from '../../shared/reviews.js';

const updateSubmissionSql = `UPDATE submissions
  SET status = ?, reject_reason = ?, reviewed_at = ?, reviewed_by = ?, version = version + 1
  WHERE id = ? AND status = 'pending' AND version = ?`;

const insertLogSql = `INSERT INTO review_logs(
    submission_id, operator_id, action, from_status, to_status, reason, created_at, batch_id
  )
  VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`;

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
  const batchId = randomUUID();

  const result: ReviewResult = {
    batchId,
    successIds: [],
    failures: [],
  };

  db.exec('BEGIN IMMEDIATE');

  try {
    const updateStatement = db.prepare(updateSubmissionSql);
    const logStatement = db.prepare(insertLogSql);

    for (const item of items) {
      const { id, version } = item;
      const updated = updateStatement.run(status, reason, now, operatorId, id, version);

      if (!updated.changes) {
        const failure = reviewFailure(db, id);

        result.failures.push(failure);
        continue;
      }

      logStatement.run(id, operatorId, action, status, reason, now, batchId);
      result.successIds.push(id);
    }

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');

    throw error;
  }

  return result;
}
