<script setup lang="ts">
import { computed } from 'vue';
import type { ReviewResult } from '../../shared/types';

const props = defineProps<{
  requestError: string;
  result?: ReviewResult;
  resultTitles: Record<number, string>;
}>();

const emit = defineEmits<{
  clearError: [];
  clearResult: [];
}>();

const resultType = computed(() => props.result?.failures.length ? 'warning' : 'success');

const successTitles = computed(() => {
  const ids = props.result?.successIds ?? [];
  const titles = ids.map(id => '#' + id + ' ' + props.resultTitles[id]);

  return titles.join('、');
});
</script>

<template>
  <el-alert
    v-if="requestError"
    class="mb-4"
    :title="requestError"
    type="error"
    show-icon
    role="alert"
    @close="emit('clearError')"
  />
  <el-alert
    v-if="result"
    class="mb-4"
    :type="resultType"
    closable
    @close="emit('clearResult')"
  >
    <p class="font-medium">
      最近审核：成功 {{ result.successIds.length }} 条，失败 {{ result.failures.length }} 条
    </p>
    <p
      v-if="result.successIds.length"
      class="mt-1"
    >
      成功投稿：{{ successTitles }}
    </p>
    <ul
      v-if="result.failures.length"
      class="mt-2 list-disc pl-5"
    >
      <li
        v-for="failure in result.failures"
        :key="failure.id"
      >
        #{{ failure.id }} {{ resultTitles[failure.id] }}：{{ failure.message }}
      </li>
    </ul>
  </el-alert>
</template>
