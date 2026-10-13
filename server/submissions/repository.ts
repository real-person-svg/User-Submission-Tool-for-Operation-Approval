import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import type {
  Submission,
  SubmissionInput,
  SubmissionListItem,
  SubmissionListResult,
  SubmissionQuery,
} from '../../shared/submissions.js';

const detailSelect = `SELECT s.*, o.name AS reviewer_name
  FROM submissions s LEFT JOIN operators o ON o.id = s.reviewed_by`;

function buildSubmissionFilter(query: SubmissionQuery) {
  const conditions: string[] = [];
  const params: SQLInputValue[] = [];

  const {
    status,
    startDate,
    endDate,
  } = query;
  const keyword = query.keyword.trim();

  if (status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }

  if (keyword) {
    conditions.push('(instr(title, ?) > 0 OR instr(author_name, ?) > 0 OR instr(content, ?) > 0)');
    params.push(keyword, keyword, keyword);
  }

  if (startDate) {
    const startTimestamp = new Date(`${startDate}T00:00:00+08:00`).toISOString();

    conditions.push('submitted_at >= ?');
    params.push(startTimestamp);
  }

  if (endDate) {
    const endTimestamp = new Date(`${endDate}T23:59:59.999+08:00`).toISOString();

    conditions.push('submitted_at <= ?');
    params.push(endTimestamp);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  return {
    where,
    params,
  };
}

export function listSubmissions(db: DatabaseSync, query: SubmissionQuery): SubmissionListResult {
  const { where, params } = buildSubmissionFilter(query);

  const countSql = `SELECT count(*) AS total FROM submissions ${where}`;
  const countStatement = db.prepare(countSql);
  const countRow = countStatement.get(...params)!;
  const total = Number(countRow.total);

  const pageSize = query.pageSize;
  const pageCount = Math.ceil(total / pageSize);
  const lastPage = Math.max(1, pageCount);

  const page = Math.min(query.page, lastPage);
  const offset = (page - 1) * pageSize;

  const listSql = `SELECT id, title, author_name, category, status, submitted_at, version,
    substr(content, 1, 240) || CASE WHEN length(content) > 240 THEN '…' ELSE '' END AS summary
    FROM submissions ${where} ORDER BY submitted_at DESC, id DESC LIMIT ? OFFSET ?`;
  const listStatement = db.prepare(listSql);
  const rows = listStatement.all(...params, pageSize, offset) as unknown as SubmissionListItem[];

  const items = rows.map((row) => {
    const summary = row.summary.replace(/\s+/g, ' ').trim();

    return {
      ...row,
      summary,
    };
  });

  const existenceStatement = db.prepare('SELECT 1 FROM submissions LIMIT 1');
  const hasSubmissions = Boolean(existenceStatement.get());

  const result = {
    items,
    total,
    hasSubmissions,
    page,
    pageSize,
  };

  return result;
}

export function createSubmission(db: DatabaseSync, input: SubmissionInput) {
  const title = input.title.trim();
  const authorName = input.author_name.trim();
  const category = input.category.trim();

  const content = input.content.trim();
  const submittedAt = new Date(input.submitted_at).toISOString();

  const sql = `INSERT INTO submissions(title, author_name, category, content, submitted_at)
    VALUES (?, ?, ?, ?, ?)`;
  const statement = db.prepare(sql);
  const result = statement.run(title, authorName, category, content, submittedAt);
  const id = Number(result.lastInsertRowid);

  return id;
}

export function findSubmission(db: DatabaseSync, id: number) {
  const sql = `${detailSelect} WHERE s.id = ?`;
  const statement = db.prepare(sql);
  const submission = statement.get(id) as unknown as Submission | undefined;

  return submission;
}
