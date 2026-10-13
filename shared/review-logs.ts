import type { ReviewAction } from './reviews.js';
import type { Status } from './submissions.js';

export interface ReviewLog {
  id: number;
  submission_id: number;
  title: string;
  operator_name: string;
  action: ReviewAction;
  from_status: Status;
  to_status: Status;
  reason: string | null;
  created_at: string;
  batch_id: string;
}

export interface ReviewLogQuery {
  submissionId?: number;
  operatorId?: number;
}
