import type { SubmissionInput, SubmissionQuery } from '../../shared/submissions.js';

function validDate(date: string) {
  const matchesFormat = /^\d{4}-\d{2}-\d{2}$/.test(date);

  if (!matchesFormat) return false;

  const parsed = new Date(`${date}T00:00:00Z`);
  const isValidTime = Number.isFinite(parsed.getTime());

  if (!isValidTime) return false;

  const normalizedDate = parsed.toISOString().slice(0, 10);

  return normalizedDate === date;
}

export function submissionQueryError(query: SubmissionQuery) {
  const { startDate, endDate } = query;

  const invalidStartDate = startDate && !validDate(startDate);
  const invalidEndDate = endDate && !validDate(endDate);

  const reversedRange = startDate && endDate && startDate > endDate;
  const invalidRange = invalidStartDate || invalidEndDate || reversedRange;

  if (invalidRange) return '提交时间范围无效，请检查起止日期。';

  return null;
}

export function submissionInputError(input: SubmissionInput) {
  const requiredFields = [
    input.title,
    input.author_name,
    input.category,
    input.content,
  ];
  const hasBlankField = requiredFields.some(value => !value.trim());

  if (hasBlankField) return '标题、作者、分类和正文不能为空或只有空格。';

  const date = input.submitted_at.slice(0, 10);
  const timestamp = Date.parse(input.submitted_at);

  const isValidTimestamp = Number.isFinite(timestamp);
  const isValidDate = validDate(date);

  if (!isValidDate || !isValidTimestamp) return '提交时间无效。';

  return null;
}
