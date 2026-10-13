import { reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { ReviewInput, ReviewResult, SubmissionListItem } from '../../shared/types';
import { api, errorMessage } from '../lib/api';

interface ReviewOptions {
  operatorId: Ref<number | undefined>;
  canReview: Ref<boolean>;
  reviewing: Ref<boolean>;
  refresh: () => Promise<void>;
}

export function useReview(options: ReviewOptions) {
  const {
    operatorId,
    canReview,
    reviewing,
    refresh,
  } = options;

  const visible = ref(false);
  const items = ref<SubmissionListItem[]>([]);

  const action = ref<ReviewInput['action']>('approve');
  const reason = ref('');

  const confirmedOperatorId = ref<number>();

  const error = ref('');
  const requestError = ref('');

  const result = ref<ReviewResult>();
  const resultTitles = ref<Record<number, string>>({});

  function start(submissions: SubmissionListItem[], reviewAction: ReviewInput['action']) {
    const currentOperatorId = operatorId.value;

    if (!currentOperatorId) {
      ElMessage.warning('请先选择当前审稿人。');

      return;
    }

    const hasInvalidItems = !submissions.length
      || submissions.some(item => item.status !== 'pending');

    if (!canReview.value || hasInvalidItems) return;

    const reviewItems = submissions.map(item => ({
      ...item,
    }));

    items.value = reviewItems;
    confirmedOperatorId.value = currentOperatorId;
    action.value = reviewAction;
    reason.value = '';
    error.value = '';
    visible.value = true;
  }

  async function submit() {
    if (reviewing.value) return;

    const trimmedReason = reason.value.trim();
    const isRejection = action.value === 'reject';
    const currentOperatorId = confirmedOperatorId.value;

    if (isRejection && !trimmedReason) {
      error.value = '请填写驳回原因，不能只有空格。';

      return;
    }

    if (!currentOperatorId) {
      error.value = '请选择当前审稿人。';

      return;
    }

    const reviewItems = items.value.map(item => ({
      id: item.id,
      version: item.version,
    }));
    const titles = Object.fromEntries(items.value.map(item => [item.id, item.title]));

    const input: ReviewInput = {
      operatorId: currentOperatorId,
      action: action.value,
      items: reviewItems,
      reason: isRejection ? trimmedReason : undefined,
    };

    const request: RequestInit = {
      method: 'POST',
      body: JSON.stringify(input),
    };

    reviewing.value = true;
    error.value = '';
    requestError.value = '';
    result.value = undefined;

    try {
      const response = await api<ReviewResult>('/reviews', request);

      result.value = response;
      resultTitles.value = titles;
      visible.value = false;

      const successCount = response.successIds.length;
      const failureCount = response.failures.length;

      if (successCount) {
        const message = `审核完成：成功 ${successCount} 条，失败 ${failureCount} 条。`;

        ElMessage.success(message);
      } else {
        ElMessage.warning('没有投稿审核成功，请查看失败原因。');
      }
    } catch (cause) {
      const message = `${errorMessage(cause)} 请刷新后核对结果，避免重复审核。`;

      visible.value = false;
      requestError.value = message;
      ElMessage.error(message);
    } finally {
      try {
        await refresh();
      } finally {
        reviewing.value = false;
      }
    }
  }

  return reactive({
    visible,
    items,
    action,
    reason,
    confirmedOperatorId,
    error,
    requestError,
    result,
    resultTitles,
    start,
    submit,
  });
}
