<script setup lang="ts">
import type { Operator } from '../../shared/types';

defineProps<{
  operators: Operator[];
  loading: boolean;
  error: string;
  reviewing: boolean;
}>();

// 所选编号由根组件共享给审核流程，用于记录操作归属。
const operatorId = defineModel<number>('operatorId');

const emit = defineEmits<{
  retry: [];
}>();
</script>

<template>
  <header class="mb-8 flex flex-wrap items-center justify-between gap-5">
    <h1 class="text-3xl font-bold tracking-tight">
      投稿审核工作台
    </h1>
    <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
      <slot />
      <div
        data-tour="operator"
        class="flex items-center gap-3"
      >
        <label
          for="operator"
          class="shrink-0 text-sm font-medium"
        >当前审稿人</label>
        <el-select
          id="operator"
          v-model="operatorId"
          class="w-[180px]"
          placeholder="请选择审稿人"
          clearable
          :loading="loading"
          :disabled="reviewing || loading || !!error"
          aria-label="当前审稿人"
        >
          <el-option
            v-for="operator in operators"
            :key="operator.id"
            :label="`${operator.name} (#${operator.id})`"
            :value="operator.id"
          />
        </el-select>
      </div>
    </div>
  </header>
  <el-alert
    v-if="error"
    class="mb-4"
    type="error"
    :closable="false"
    show-icon
  >
    审稿人加载失败：{{ error }}
    <el-button
      link
      :disabled="loading"
      @click="emit('retry')"
    >
      重试
    </el-button>
  </el-alert>
</template>
