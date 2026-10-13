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

  async function load(query: SubmissionQuery = requested.value) {
    if (loading.value) return;

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
      requested.value.page = result.page;
      hasLoaded.value = true;
    } catch (cause) {
      error.value = errorMessage(cause);
    } finally {
      loading.value = false;
    }
  }

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
    const query = {
      ...requested.value,
      page,
    };

    void load(query);
  }

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
