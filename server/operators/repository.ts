import type { DatabaseSync } from 'node:sqlite';
import type { Operator } from '../../shared/operators.js';

export function listOperators(db: DatabaseSync): Operator[] {
  return db.prepare(
    'SELECT id, name FROM operators WHERE deleted_at IS NULL ORDER BY id',
  ).all() as unknown as Operator[];
}
