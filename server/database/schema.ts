import type { DatabaseSync } from 'node:sqlite';

const databaseSchema = `
  CREATE TABLE IF NOT EXISTS operators (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    reject_reason TEXT,
    submitted_at TEXT NOT NULL,
    reviewed_at TEXT,
    reviewed_by INTEGER REFERENCES operators(id),
    version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0)
  );
  CREATE TABLE IF NOT EXISTS review_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL REFERENCES submissions(id),
    operator_id INTEGER NOT NULL REFERENCES operators(id),
    action TEXT NOT NULL CHECK(action IN ('approve', 'reject')),
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL,
    batch_id TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_submissions_status_time
    ON submissions(status, submitted_at DESC, id DESC);
  CREATE INDEX IF NOT EXISTS idx_submissions_time ON submissions(submitted_at DESC, id DESC);
  CREATE INDEX IF NOT EXISTS idx_logs_submission ON review_logs(submission_id, id DESC);
  CREATE INDEX IF NOT EXISTS idx_logs_operator ON review_logs(operator_id, id DESC);
  CREATE INDEX IF NOT EXISTS idx_logs_batch ON review_logs(batch_id);
`;

export function initializeDatabase(db: DatabaseSync) {
  const existingTable = db.prepare(
    'SELECT name FROM sqlite_master WHERE type = \'table\' AND name = \'operators\'',
  ).get();

  db.exec(databaseSchema);

  const columns = db.prepare('PRAGMA table_info(operators)').all();

  if (!columns.some(column => column.name === 'deleted_at')) {
    db.exec('ALTER TABLE operators ADD COLUMN deleted_at TEXT');
  }

  if (!existingTable) {
    db.exec(`INSERT INTO operators(id, name)
      VALUES (1, '审核员一'), (2, '审核员二'), (3, '审核员三')`);
  }
}
