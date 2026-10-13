<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionDetail } from '../../shared/types';
import { beijingTime } from '../lib/api';
import { statusLabels, statusTypes } from '../lib/submissions';

const props = defineProps<{
  detail?: SubmissionDetail;
  loading: boolean;
  error: string;
  reviewing: boolean;
}>();

const visible = defineModel<boolean>({
  required: true,
});

const emit = defineEmits<{
  retry: [];
}>();

const reviewedTime = computed(() => {
  const reviewedAt = props.detail?.submission.reviewed_at;

  return reviewedAt ? beijingTime(reviewedAt) : '尚未审核';
});
</script>

<template>
  <el-drawer
    v-model="visible"
    title="投稿详情"
    size="min(680px, 100vw)"
    :close-on-click-modal="!reviewing"
    :close-on-press-escape="!reviewing"
    :show-close="!reviewing"
  >
    <p
      v-if="loading"
      role="status"
    >
      正在加载详情…
    </p>
    <el-alert
      v-if="error"
      type="error"
      :closable="false"
      show-icon
    >
      {{ error }} <el-button
        link
        @click="emit('retry')"
      >
        重试
      </el-button>
    </el-alert>
    <article
      v-if="detail"
      class="space-y-6"
    >
      <div>
        <el-tag :type="statusTypes[detail.submission.status]">
          {{ statusLabels[detail.submission.status] }}
        </el-tag>
        <h2 class="mt-4 text-2xl font-bold break-words">
          {{ detail.submission.title }}
        </h2>
        <p class="mt-3 text-sm leading-7 text-desk-muted">
          作者：{{ detail.submission.author_name }} · 分类：{{ detail.submission.category }}<br>
          提交时间：{{ beijingTime(detail.submission.submitted_at) }}
        </p>
      </div>
      <p class="rounded-xl bg-desk-background p-5 leading-8 whitespace-pre-wrap break-words">
        {{ detail.submission.content }}
      </p>
      <section aria-label="审核信息">
        <h3 class="mb-3 font-bold">
          审核信息
        </h3>
        <p>审核人：{{ detail.submission.reviewer_name ?? '尚未审核' }}</p>
        <p class="mt-2">
          审核时间：{{ reviewedTime }}
        </p>
        <p
          v-if="detail.submission.reject_reason"
          class="mt-2 whitespace-pre-wrap break-words"
        >
          驳回原因：{{ detail.submission.reject_reason }}
        </p>
      </section>
      <section aria-label="历史审核日志">
        <h3 class="mb-3 font-bold">
          历史审核日志
        </h3>
        <p
          v-if="!detail.logs.length"
          class="text-desk-muted"
        >
          暂无审核记录
        </p>
        <div
          v-for="log in detail.logs"
          :key="log.id"
          class="mb-3 rounded-lg border border-desk-border p-4 text-sm leading-7 break-words"
        >
          <p>
            {{ log.operator_name }} · {{ log.action === 'approve' ? '通过' : '驳回' }} ·
            {{ beijingTime(log.created_at) }}
          </p>
          <p>{{ statusLabels[log.from_status] }} → {{ statusLabels[log.to_status] }}</p>
          <p
            v-if="log.reason"
            class="whitespace-pre-wrap"
          >
            原因：{{ log.reason }}
          </p>
          <p class="mt-1 text-xs text-desk-muted">
            批次：{{ log.batch_id }}
          </p>
        </div>
      </section>
    </article>
  </el-drawer>
</template>
