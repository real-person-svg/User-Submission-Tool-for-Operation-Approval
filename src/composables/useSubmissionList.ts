import {
  computed,
  reactive,
  ref,
  watch,
} from 'vue';
import type { Ref } from 'vue';
import type { TableInstance } from 'element-plus';
import type { SubmissionListItem, SubmissionListResult, SubmissionQuery } from '../../shared/types';
import { api, errorMessage } from '../lib/api';
import { createDefaultQuery } from '../lib/submissions';

export function useSubmissionList(reviewing: Ref<boolean>) {
  // filters 是表单草稿；requested 保存已提交条件，供翻页和重试沿用。
  const filters = reactive(createDefaultQuery());
  const requested = ref(createDefaultQuery());

  const rows = ref<SubmissionListItem[]>([]);
  const total = ref(0);

  const hasSubmissions = ref(false);
  const hasLoaded = ref(false);
  const currentPage = ref(1);

  const loading = ref(false);
  const error = ref('');
  const formError = ref('');

  const table = ref<TableInstance>();
  const selected = ref<SubmissionListItem[]>([]);

  const busy = computed(() => loading.value || reviewing.value);

  const pageSummary = computed(() => {
    const summary = hasLoaded.value ? `共 ${total.value} 条，当前第 ${currentPage.value} 页` : '等待查询结果';
    const staleHint = error.value && hasLoaded.value ? '（上次成功结果）' : '';

    return summary + staleHint;
  });

  function clearSelection() {
    table.value?.clearSelection();
    selected.value = [];
  }

  function selectRows(items: SubmissionListItem[]) {
    selected.value = items;
  }

  // 加载审批投稿列表
  async function load(query: SubmissionQuery = requested.value) {
    if (loading.value) return;

    // 复制本次查询，避免用户后续修改表单影响正在执行的请求。
    const currentQuery = {
      ...query,
    };

    const entries = Object.entries(currentQuery).map(([key, value]) => [key, String(value)]);
    const searchParams = new URLSearchParams(entries);
    const path = `/submissions?${searchParams}`;

    clearSelection();
    requested.value = currentQuery;
    loading.value = true;
    error.value = '';

    try {
      const result = await api<SubmissionListResult>(path);

      rows.value = result.items;
      total.value = result.total;
      hasSubmissions.value = result.hasSubmissions;
      currentPage.value = result.page;
      // 后端可能将越界页回退，后续查询应使用修正后的页码。
      requested.value.page = result.page;
      hasLoaded.value = true;
    } catch (cause) {
      // 保留上次成功的数据，由界面提示未更新并禁用审核。
      error.value = errorMessage(cause);
    } finally {
      loading.value = false;
    }
  }

  // 搜索审批投稿列表
  function search() {
    if (busy.value) return;

    const invalidDateRange = filters.startDate
      && filters.endDate
      && filters.startDate > filters.endDate;

    if (invalidDateRange) {
      formError.value = '开始日期不能晚于结束日期。';

      return;
    }

    const query: SubmissionQuery = {
      ...filters,
      keyword: filters.keyword.trim(),
      startDate: filters.startDate || '',
      endDate: filters.endDate || '',
      page: 1,
    };

    formError.value = '';
    void load(query);
  }

  function reset() {
    const query = createDefaultQuery();

    Object.assign(filters, query);
    formError.value = '';
    void load(query);
  }

  function changePage(page: number) {
    // 翻页沿用已提交条件，不应用尚未点击查询的表单修改。
    const query = {
      ...requested.value,
      page,
    };

    void load(query);
  }

  // 条件一变就清空选择，防止批量审核沿用旧筛选下的投稿。
  watch(() => [
    filters.status,
    filters.keyword,
    filters.startDate,
    filters.endDate,
  ], () => {
    clearSelection();
    formError.value = '';
  }, {
    flush: 'sync',
  });

  return reactive({
    filters,
    rows,
    total,
    hasSubmissions,
    hasLoaded,
    currentPage,
    loading,
    error,
    formError,
    table,
    selected,
    busy,
    pageSummary,
    clearSelection,
    selectRows,
    load,
    search,
    reset,
    changePage,
  });
}
