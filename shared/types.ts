export type Status = 'pending' | 'approved' | 'rejected';
export interface Operator {
  id: number;
  name: string;
}
export interface Submission {
  id: number;
  title: string;
  content: string;
  author_name: string;
  category: string;
  status: Status;
  reject_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  reviewer_name: string | null;
  version: number;
}
export interface ReviewLog {
  id: number;
  submission_id: number;
  title: string;
  operator_name: string;
  action: 'approve' | 'reject';
  from_status: Status;
  to_status: Status;
  reason: string | null;
  created_at: string;
  batch_id: string;
}
export interface ReviewInput {
  items: { id: number; version: number }[];
  action: 'approve' | 'reject';
  reason?: string;
}
export interface ReviewResult {
  batchId: string;
  successIds: number[];
  failures: { id: number; code: string; message: string }[];
}
