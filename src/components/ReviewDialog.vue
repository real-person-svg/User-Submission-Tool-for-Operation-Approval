<script setup lang="ts">
import { computed } from 'vue';
import type { Operator, ReviewInput, SubmissionListItem } from '../../shared/types';

const props = defineProps<{
  items: SubmissionListItem[];
  operators: Operator[];
  operatorId?: number;
  action: ReviewInput['action'];
  error: string;
  reviewing: boolean;
}>();

const visible = defineModel<boolean>({
  required: true,
});
const reason = defineModel<string>('reason', {
  required: true,
});

const emit = defineEmits<{
  submit: [];
}>();

const actionLabel = computed(() => props.action === 'approve' ? '通过' : '驳回');
const title = computed(() => '确认' + actionLabel.value + ' ' + props.items.length + ' 条投稿');
const confirmType = computed(() => props.action === 'approve' ? 'success' : 'danger');

const operatorName = computed(() => {
  const operator = props.operators.find(item => item.id === props.operatorId);

  return operator?.name;
});
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="min(560px, 94vw)"
    :close-on-click-modal="false"
    :close-on-press-escape="!reviewing"
    :show-close="!reviewing"
  >
    <p class="mb-3">
      审稿人：{{ operatorName }}
    </p>
    <p class="mb-2">
      将{{ actionLabel }}以下投稿：
    </p>
    <ul class="mb-5 max-h-[200px] list-disc overflow-y-auto pl-5 leading-7 break-words">
      <li
        v-for="item in items"
        :key="item.id"
      >
        #{{ item.id }} {{ item.title }}
      </li>
    </ul>
    <el-form
      v-if="action === 'reject'"
      label-position="top"
      :disabled="reviewing"
    >
      <el-form-item
        label="驳回原因（本批次统一使用）"
        required
      >
        <el-input
          v-model="reason"
          type="textarea"
          :rows="4"
          maxlength="1000"
          show-word-limit
          aria-label="驳回原因"
        />
      </el-form-item>
      <p class="text-xs text-desk-muted">
        需要不同原因的投稿，请分批或单独驳回。
      </p>
    </el-form>
    <el-alert
      v-if="error"
      class="mt-4"
      :title="error"
      type="error"
      :closable="false"
      show-icon
      role="alert"
    />
    <template #footer>
      <el-button
        :disabled="reviewing"
        @click="visible = false"
      >
        取消
      </el-button>
      <el-button
        :type="confirmType"
        :loading="reviewing"
        @click="emit('submit')"
      >
        确认{{ actionLabel }}
      </el-button>
    </template>
  </el-dialog>
</template>
