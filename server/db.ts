import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export { initializeDatabase } from './database/schema.js';

const connectionPragmas = `
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
`;

export function openDatabase(filePath?: string) {
  const databasePath = filePath ?? resolve('data/review-desk.sqlite');
  const isMemoryDatabase = databasePath === ':memory:';

  if (!isMemoryDatabase) {
    const directory = dirname(databasePath);
    const directoryOptions = {
      recursive: true,
    };

    mkdirSync(directory, directoryOptions);
  }

  const db = new DatabaseSync(databasePath);

  db.exec(connectionPragmas);

  return db;
}
