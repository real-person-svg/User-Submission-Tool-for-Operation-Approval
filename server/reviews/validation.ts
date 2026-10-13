import type { DatabaseSync } from 'node:sqlite';
import type { ReviewInput } from '../../shared/reviews.js';

export function reviewInputError(db: DatabaseSync, input: ReviewInput) {
  const {
    action,
    operatorId,
    items,
  } = input;
  const reason = input.reason?.trim();

  if (action === 'reject' && !reason) return '请填写驳回原因，不能只有空格。';

  const operatorStatement = db.prepare(
    'SELECT id FROM operators WHERE id = ? AND deleted_at IS NULL',
  );
  const operator = operatorStatement.get(operatorId);

  if (!operator) return '请选择有效的操作人。';

  // 整批拒绝重复编号，避免同一投稿在一个批次内被处理多次。
  const ids = items.map(item => item.id);
  const uniqueIds = new Set(ids);
  const hasDuplicate = uniqueIds.size !== items.length;

  if (hasDuplicate) return '同一批次不能包含重复投稿。';

  return null;
}
