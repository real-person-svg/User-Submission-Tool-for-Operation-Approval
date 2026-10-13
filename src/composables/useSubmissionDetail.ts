import { reactive, ref } from 'vue';
import type { SubmissionDetail } from '../../shared/types';
import { api, errorMessage } from '../lib/api';

export function useSubmissionDetail() {
  const visible = ref(false);
  const detail = ref<SubmissionDetail>();
  const id = ref<number>();

  const loading = ref(false);
  const error = ref('');

  // 只接受最后一次请求的结果，避免快速切换投稿时被旧响应覆盖。
  let requestVersion = 0;

  // 加载投稿详情
  async function load(submissionId: number) {
    const request = ++requestVersion;
    const path = `/submissions/${submissionId}`;

    id.value = submissionId;
    detail.value = undefined;
    error.value = '';
    loading.value = true;

    try {
      const result = await api<SubmissionDetail>(path);

      if (request === requestVersion) detail.value = result;
    } catch (cause) {
      if (request === requestVersion) error.value = errorMessage(cause);
    } finally {
      if (request === requestVersion) loading.value = false;
    }
  }

  function open(submissionId: number) {
    visible.value = true;
    void load(submissionId);
  }

  async function reload() {
    const submissionId = id.value;

    // 审核后仅刷新仍然打开的详情抽屉。
    if (visible.value && submissionId) await load(submissionId);
  }

  return reactive({
    visible,
    detail,
    loading,
    error,
    open,
    reload,
  });
}
