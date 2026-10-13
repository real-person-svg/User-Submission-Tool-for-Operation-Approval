export type ReviewAction = 'approve' | 'reject';

export interface ReviewItem {
  // 待审核投稿的唯一标识。
  id: number;
  // 客户端读取投稿时的版本，服务端据此检测并发修改。
  version: number;
}

export interface ReviewInput {
  // 执行审核的操作员标识。
  operatorId: number;
  // 本次批量审核的投稿项。
  items: ReviewItem[];
  // 审核操作类型。
  action: ReviewAction;
  // 审核原因或补充说明。
  reason?: string;
}

export interface ReviewFailure {
  // 审核失败的投稿标识。
  id: number;
  // 失败错误码。
  code: string;
  // 失败原因说明。
  message: string;
}

// 一个正常返回的批次可同时包含成功投稿和逐条业务失败。
export interface ReviewResult {
  // 本次审核批次标识。
  batchId: string;
  // 审核成功的投稿标识列表。
  successIds: number[];
  // 逐条审核失败信息。
  failures: ReviewFailure[];
}
