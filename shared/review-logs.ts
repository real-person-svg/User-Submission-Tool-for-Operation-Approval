import type { ReviewAction } from './reviews.js';
import type { Status } from './submissions.js';

export interface ReviewLog {
  // 日志唯一标识。
  id: number;
  // 关联的投稿标识。
  submission_id: number;
  // 投稿标题。
  title: string;
  // 执行审核的操作员姓名。
  operator_name: string;
  // 审核操作类型。
  action: ReviewAction;
  // 审核前的投稿状态。
  from_status: Status;
  // 审核后的投稿状态。
  to_status: Status;
  // 审核原因，无原因时为空。
  reason: string | null;
  // 日志创建时间。
  created_at: string;
  // 所属审核批次标识。
  batch_id: string;
}

export interface ReviewLogQuery {
  // 按投稿标识筛选。
  submissionId?: number;
  // 按操作员标识筛选。
  operatorId?: number;
}
