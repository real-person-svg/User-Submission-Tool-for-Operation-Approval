import type { DatabaseSync } from 'node:sqlite';
import type { Operator } from '../../shared/operators.js';

export function listOperators(db: DatabaseSync): Operator[] {
  // 新审核仅可选择未软删除的人员，历史关联仍保留在数据库中。
  return db.prepare(
    'SELECT id, name FROM operators WHERE deleted_at IS NULL ORDER BY id',
  ).all() as unknown as Operator[];
}
