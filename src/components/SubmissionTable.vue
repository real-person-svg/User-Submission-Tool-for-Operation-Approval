<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { TableInstance } from 'element-plus';
import type { ReviewInput, SubmissionListItem } from '../../shared/types';
import { beijingTime } from '../lib/api';
import { statusLabels, statusTypes } from '../lib/submissions';

const props = defineProps<{
  rows: SubmissionListItem[];
  loading: boolean;
  busy: boolean;
  listError: string;
  hasSubmissions: boolean;
  canReview: boolean;
}>();

const emit = defineEmits<{
  ready: [table: TableInstance];
  select: [items: SubmissionListItem[]];
  detail: [id: number];
  review: [items: SubmissionListItem[], action: ReviewInput['action']];
  reset: [];
  create: [];
}>();

const table = ref<TableInstance>();

const emptyDescription = computed(() => {
  if (props.loading) return '正在加载…';

  if (props.listError) return '查询未成功，请重试';

  if (props.hasSubmissions) return '没有符合筛选条件的投稿';

  return '暂无投稿';
});

const emptyActionLabel = computed(() => props.hasSubmissions ? '重置筛选' : '录入第一条投稿');

function isSelectable(row: SubmissionListItem) {
  const isPending = row.status === 'pending';

  return isPending && !props.busy && !props.listError;
}

function handleEmptyAction() {
  if (props.hasSubmissions) emit('reset');
  else emit('create');
}

onMounted(() => {
  const instance = table.value;

  if (instance) emit('ready', instance);
});
</script>

<template>
  <p
    v-if="loading"
    role="status"
    aria-live="polite"
    class="mb-3 text-sm text-desk-muted"
  >
    正在加载投稿…
  </p>
  <div
    v-loading="loading"
    data-tour="submissions"
    class="overflow-x-auto"
    :aria-busy="loading"
  >
    <el-table
      ref="table"
      :data="rows"
      row-key="id"
      min-height="260"
      @selection-change="emit('select', $event)"
    >
      <el-table-column
        type="selection"
        width="48"
        :selectable="isSelectable"
      />
      <el-table-column
        label="标题"
        min-width="190"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span class="font-medium">{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column
        prop="author_name"
        label="作者"
        width="110"
        show-overflow-tooltip
      />
      <el-table-column
        prop="summary"
        label="内容摘要"
        min-width="240"
        show-overflow-tooltip
      />
      <el-table-column
        prop="category"
        label="分类"
        width="110"
        show-overflow-tooltip
      />
      <el-table-column
        label="提交时间（北京）"
        width="170"
      >
        <template #default="{ row }">
          {{ beijingTime(row.submitted_at) }}
        </template>
      </el-table-column>
      <el-table-column
        label="审核状态"
        width="100"
      >
        <template #default="{ row }: { row: SubmissionListItem }">
          <el-tag :type="statusTypes[row.status]">
            {{ statusLabels[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="190"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            :disabled="busy"
            @click="emit('detail', row.id)"
          >
            详情
          </el-button>
          <el-button
            v-if="row.status === 'pending'"
            link
            type="success"
            :disabled="!canReview"
            @click="emit('review', [row], 'approve')"
          >
            通过
          </el-button>
          <el-button
            v-if="row.status === 'pending'"
            link
            type="danger"
            :disabled="!canReview"
            @click="emit('review', [row], 'reject')"
          >
            驳回
          </el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty :description="emptyDescription">
          <el-button
            v-if="!loading && !listError"
            @click="handleEmptyAction"
          >
            {{ emptyActionLabel }}
          </el-button>
        </el-empty>
      </template>
    </el-table>
  </div>
</template>
