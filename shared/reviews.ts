export type ReviewAction = 'approve' | 'reject';

export interface ReviewItem {
  id: number;
  version: number;
}

export interface ReviewInput {
  operatorId: number;
  items: ReviewItem[];
  action: ReviewAction;
  reason?: string;
}

export interface ReviewFailure {
  id: number;
  code: string;
  message: string;
}

export interface ReviewResult {
  batchId: string;
  successIds: number[];
  failures: ReviewFailure[];
}
