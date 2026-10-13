<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  enabled: boolean;
}>();

const visible = ref(false);
const current = ref(0);

// 通过各组件上的 data-tour 属性定位需要高亮的操作区域。
const steps = [
  {
    target: '[data-tour="operator"]',
    title: '1. 选择当前审稿人',
    description: '开始审核前，先选择自己的姓名。每次审核都会记录该审稿人及操作时间。',
  },
  {
    target: '[data-tour="filters"]',
    title: '2. 筛选待审投稿',
    description: '列表默认显示待审核投稿。填写状态、关键词或日期后点击查询；重置可恢复默认条件。',
  },
  {
    target: '[data-tour="submissions"]',
    title: '3. 查看详情并审核',
    description: '点击行内详情阅读完整正文和审核记录，再选择通过或驳回。驳回时必须填写原因。',
  },
  {
    target: '[data-tour="batch"]',
    title: '4. 批量处理投稿',
    description: '勾选当前页的待审投稿后，可批量通过或驳回。同一批次的驳回原因相同。',
  },
  {
    target: '[data-tour="help"]',
    title: '5. 随时查看新手指引',
    description: '没有投稿时可先录入投稿。需要帮助时，点击“新手指引”即可查看这些介绍。',
  },
];

function start() {
  if (!props.enabled) return;

  // 仅由父组件手动调用，每次都从第一步开始。
  current.value = 0;
  visible.value = true;
}

function finish() {
  visible.value = false;
}

// 切页、加载或打开其他弹层后，立即结束当前指引。
watch(() => props.enabled, (enabled) => {
  if (!enabled) finish();
});

defineExpose({
  start,
});
</script>

<template>
  <el-tour
    v-model="visible"
    v-model:current="current"
    :mask="{ color: 'rgba(15, 35, 30, 0.65)' }"
    :gap="{ offset: 8, radius: 8 }"
    :target-area-clickable="false"
    :content-style="{ width: 'min(360px, calc(100vw - 32px))' }"
    placement="bottom"
    @close="finish"
  >
    <el-tour-step
      v-for="(step, index) in steps"
      :key="step.target"
      :target="step.target"
      :title="step.title"
      :prev-button-props="{ children: '上一步' }"
      :next-button-props="{ children: index === steps.length - 1 ? '开始使用' : '下一步' }"
    >
      <p class="leading-6">
        {{ step.description }}
      </p>
      <el-button
        class="mt-3"
        link
        @click="finish"
      >
        跳过引导
      </el-button>
    </el-tour-step>
    <template #indicators="{ current: step, total }">
      <span class="text-xs text-desk-muted">{{ step + 1 }} / {{ total }}</span>
    </template>
  </el-tour>
</template>
