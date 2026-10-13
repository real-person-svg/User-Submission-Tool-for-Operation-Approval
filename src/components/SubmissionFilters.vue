<script setup lang="ts">
import type { SubmissionQuery } from '../../shared/types';
import { statusLabels } from '../lib/submissions';

defineProps<{
  busy: boolean;
  loading: boolean;
  formError: string;
}>();

// 这里只编辑筛选草稿，提交查询由父级响应 search 事件处理。
const filters = defineModel<SubmissionQuery>({
  required: true,
});

const emit = defineEmits<{
  search: [];
  reset: [];
}>();
</script>

<template>
  <el-form
    data-tour="filters"
    label-position="top"
    :disabled="busy"
    class="flex flex-wrap items-start gap-x-4"
    @submit.prevent="emit('search')"
  >
    <el-form-item label="审核状态">
      <el-select
        v-model="filters.status"
        class="w-[140px]"
        aria-label="审核状态"
      >
        <el-option
          label="全部"
          value="all"
        />
        <el-option
          v-for="(label, status) in statusLabels"
          :key="status"
          :label="label"
          :value="status"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="关键词">
      <el-input
        v-model="filters.keyword"
        class="w-[240px] max-w-full"
        placeholder="标题、作者或正文"
        clearable
        maxlength="200"
        aria-label="关键词"
      />
    </el-form-item>
    <el-form-item label="开始日期（北京时间）">
      <el-date-picker
        v-model="filters.startDate"
        class="date-filter"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="开始日期"
        aria-label="开始日期"
      />
    </el-form-item>
    <el-form-item label="结束日期（北京时间）">
      <el-date-picker
        v-model="filters.endDate"
        class="date-filter"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="结束日期"
        aria-label="结束日期"
      />
    </el-form-item>
    <el-form-item label="操作">
      <el-button
        type="primary"
        native-type="submit"
        :loading="loading"
      >
        查询
      </el-button>
      <el-button @click="emit('reset')">
        重置
      </el-button>
    </el-form-item>
    <slot name="actions" />
  </el-form>
  <el-alert
    v-if="formError"
    class="mb-4"
    :title="formError"
    type="warning"
    :closable="false"
    show-icon
    role="alert"
  />
</template>

<style scoped>
.date-filter {
  --el-date-editor-width: 165px;
}
</style>
