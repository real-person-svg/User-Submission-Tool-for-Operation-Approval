<script setup lang="ts">
import type { TableInstance } from 'element-plus';
import type { ReviewInput, SubmissionListItem } from '../../shared/types';
import type { useSubmissionList } from '../composables/useSubmissionList';
import SubmissionFilters from './SubmissionFilters.vue';
import SubmissionTable from './SubmissionTable.vue';

defineProps<{
  state: ReturnType<typeof useSubmissionList>;
  canReview: boolean;
}>();

const emit = defineEmits<{
  tableReady: [table: TableInstance];
  detail: [id: number];
  review: [items: SubmissionListItem[], action: ReviewInput['action']];
  create: [];
}>();

function handleReview(items: SubmissionListItem[], action: ReviewInput['action']) {
  emit('review', items, action);
}
</script>

<template>
  <section
    aria-label="投稿列表"
    class="rounded-2xl border border-desk-border bg-white p-4 sm:p-6"
  >
    <h2 class="mb-5 text-xl font-bold">
      投稿列表
    </h2>
    <SubmissionFilters
      :model-value="state.filters"
      :busy="state.busy"
      :loading="state.loading"
      :form-error="state.formError"
      @search="state.search"
      @reset="state.reset"
    >
      <template #actions>
        <el-form-item>
          <template #label>
            <span aria-live="polite">已选 {{ state.selected.length }} 条</span>
          </template>
          <div
            data-tour="batch"
            class="flex flex-wrap items-center gap-2 [&>.el-button]:ml-0"
          >
            <el-button
              :disabled="!state.selected.length || state.busy"
              @click="state.clearSelection"
            >
              清空选择
            </el-button>
            <el-button
              type="success"
              plain
              :disabled="!state.selected.length || !canReview"
              @click="handleReview(state.selected, 'approve')"
            >
              批量通过
            </el-button>
            <el-button
              type="danger"
              plain
              :disabled="!state.selected.length || !canReview"
              @click="handleReview(state.selected, 'reject')"
            >
              批量驳回
            </el-button>
          </div>
        </el-form-item>
      </template>
    </SubmissionFilters>
    <div class="mb-4 border-b border-desk-border" />
    <slot name="result" />
    <el-alert
      v-if="state.error"
      class="mb-4"
      type="error"
      :closable="false"
      show-icon
      role="alert"
    >
      <p>{{ state.hasLoaded ? '数据未更新。' : '查询失败。' }}{{ state.error }}</p>
      <el-button
        link
        :disabled="state.busy"
        @click="state.load()"
      >
        重试当前查询
      </el-button>
    </el-alert>
    <SubmissionTable
      :rows="state.rows"
      :loading="state.loading"
      :busy="state.busy"
      :list-error="state.error"
      :has-submissions="state.hasSubmissions"
      :can-review="canReview"
      @ready="emit('tableReady', $event)"
      @select="state.selectRows"
      @detail="emit('detail', $event)"
      @review="handleReview"
      @reset="state.reset"
      @create="emit('create')"
    />
    <footer class="mt-5 flex flex-wrap items-center justify-between gap-4">
      <p
        class="text-sm text-desk-muted"
        aria-live="polite"
      >
        {{ state.pageSummary }}
      </p>
      <div class="max-w-full overflow-x-auto">
        <el-pagination
          :current-page="state.currentPage"
          :page-size="20"
          :total="state.total"
          :disabled="state.busy || !!state.error"
          layout="prev, pager, next"
          @current-change="state.changePage"
        />
      </div>
    </footer>
  </section>
</template>
