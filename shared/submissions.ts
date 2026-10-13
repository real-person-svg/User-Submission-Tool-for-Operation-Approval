import type { ReviewLog } from './review-logs.js';

export type Status = 'pending' | 'approved' | 'rejected';

export interface Submission {
  // 投稿唯一标识。
  id: number;
  // 投稿标题。
  title: string;
  // 投稿正文内容。
  content: string;
  // 投稿人姓名。
  author_name: string;
  // 投稿所属分类。
  category: string;
  // 当前审核状态。
  status: Status;
  // 驳回原因，未驳回时为空。
  reject_reason: string | null;
  // 投稿提交时间。
  submitted_at: string;
  // 审核完成时间，未审核时为空。
  reviewed_at: string | null;
  // 审核人标识，未审核时为空。
  reviewed_by: number | null;
  // 审核人姓名，未审核时为空。
  reviewer_name: string | null;
  // 投稿数据版本，用于并发控制。
  version: number;
}

export interface SubmissionQuery {
  // 审核状态筛选条件，all 表示全部。
  status: Status | 'all';
  // 标题或内容搜索关键词。
  keyword: string;
  // 提交时间范围的开始日期。
  startDate: string;
  // 提交时间范围的结束日期。
  endDate: string;
  // 当前页码。
  page: number;
  // 每页记录数。
  pageSize: number;
}

// 列表使用摘要，完整正文和审核信息通过详情接口获取。
export type SubmissionListItem = Pick<
  Submission,
  // 投稿唯一标识。
  | 'id'
  // 投稿标题。
  | 'title'
  // 投稿人姓名。
  | 'author_name'
  // 投稿所属分类。
  | 'category'
  // 当前审核状态。
  | 'status'
  // 投稿提交时间。
  | 'submitted_at'
  // 投稿数据版本。
  | 'version'
> & {
  // 投稿正文摘要。
  summary: string;
};

export interface SubmissionListResult {
  // 当前页的投稿列表。
  items: SubmissionListItem[];
  // 符合筛选条件的投稿总数。
  total: number;
  // 表示全库是否有投稿，不受当前筛选条件影响。
  hasSubmissions: boolean;
  // 当前页码。
  page: number;
  // 每页记录数。
  pageSize: number;
}

export interface SubmissionInput {
  // 投稿标题。
  title: string;
  // 投稿人姓名。
  author_name: string;
  // 投稿所属分类。
  category: string;
  // 投稿正文内容。
  content: string;
  // 投稿提交时间。
  submitted_at: string;
}

export interface SubmissionDetail {
  // 投稿完整信息。
  submission: Submission;
  // 投稿相关的审核日志。
  logs: ReviewLog[];
}
