import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import type { ReviewLog, ReviewLogQuery } from '../../shared/review-logs.js';

const logSelect = `SELECT l.id, l.submission_id, s.title, o.name AS operator_name,
  l.action, l.from_status, l.to_status, l.reason, l.created_at, l.batch_id
  FROM review_logs l
  JOIN submissions s ON s.id = l.submission_id
  JOIN operators o ON o.id = l.operator_id`;

export function listReviewLogs(db: DatabaseSync, query: ReviewLogQuery) {
  const conditions: string[] = [];
  const values: SQLInputValue[] = [];

  const { submissionId, operatorId } = query;

  if (submissionId) {
    conditions.push('l.submission_id = ?');
    values.push(submissionId);
  }

  if (operatorId) {
    conditions.push('l.operator_id = ?');
    values.push(operatorId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `${logSelect} ${where} ORDER BY l.id DESC`;
  const statement = db.prepare(sql);
  const logs = statement.all(...values) as unknown as ReviewLog[];

  return logs;
}
