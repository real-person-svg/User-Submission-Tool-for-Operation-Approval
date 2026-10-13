import type { ReviewLog } from './review-logs.js';

export type Status = 'pending' | 'approved' | 'rejected';

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

export interface SubmissionQuery {
  status: Status | 'all';
  keyword: string;
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
}

export type SubmissionListItem = Pick<
  Submission,
  | 'id'
  | 'title'
  | 'author_name'
  | 'category'
  | 'status'
  | 'submitted_at'
  | 'version'
> & {
  summary: string;
};

export interface SubmissionListResult {
  items: SubmissionListItem[];
  total: number;
  hasSubmissions: boolean;
  page: number;
  pageSize: number;
}

export interface SubmissionInput {
  title: string;
  author_name: string;
  category: string;
  content: string;
  submitted_at: string;
}

export interface SubmissionDetail {
  submission: Submission;
  logs: ReviewLog[];
}
