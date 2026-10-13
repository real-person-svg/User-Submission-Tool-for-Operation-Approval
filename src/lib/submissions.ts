import type { Status, SubmissionQuery } from '../../shared/types';

export const statusLabels: Record<Status, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
};

export const statusTypes = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
} as const;

export function createDefaultQuery(): SubmissionQuery {
  // 每次生成独立对象，供首次加载、表单初始化和重置共用。
  return {
    status: 'pending',
    keyword: '',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 20,
  };
}
