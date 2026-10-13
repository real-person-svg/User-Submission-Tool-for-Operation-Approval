<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { SubmissionInput } from '../../shared/types';
import { api, beijingTime, errorMessage } from '../lib/api';

const emit = defineEmits<{
  created: [id: number];
  cancel: [];
  saving: [value: boolean];
}>();

function createEmptyForm() {
  const now = new Date().toISOString();
  const time = beijingTime(now, true);

  return {
    title: '',
    author_name: '',
    category: '',
    content: '',
    time,
  };
}

const form = reactive(createEmptyForm());

const saving = ref(false);
const error = ref('');

async function submit() {
  if (saving.value) return;

  error.value = '';

  const requiredValues = [
    form.title,
    form.author_name,
    form.category,
    form.content,
    form.time,
  ];
  const hasAllRequiredValues = requiredValues.every(value => value?.trim());

  if (!hasAllRequiredValues) {
    error.value = '请填写标题、作者、分类、正文和提交时间，内容不能只有空格。';

    return;
  }

  // 表单时间不带时区，先按北京时间解析，再转为 UTC 提交。
  const beijingDateTime = `${form.time.replace(' ', 'T')}+08:00`;
  const date = new Date(beijingDateTime);
  const isValidDate = Number.isFinite(date.getTime());

  if (!isValidDate) {
    error.value = '请选择有效的提交时间。';

    return;
  }

  const input: SubmissionInput = {
    title: form.title,
    author_name: form.author_name,
    category: form.category,
    content: form.content,
    submitted_at: date.toISOString(),
  };

  const request = {
    method: 'POST',
    body: JSON.stringify(input),
  };

  saving.value = true;

  try {
    const result = await api<{
      id: number;
    }>('/submissions', request);
    const message = `投稿 #${result.id} 已录入，状态为待审核。`;
    const emptyForm = createEmptyForm();

    ElMessage.success(message);
    Object.assign(form, emptyForm);
    emit('created', result.id);
  } catch (cause) {
    error.value = `${errorMessage(cause)} 若网络中断，请先返回列表检查是否已录入，避免重复添加。`;
  } finally {
    saving.value = false;
  }
}

// 保存状态同步给根组件，保存期间阻止切页导致表单卸载。
watch(saving, value => emit('saving', value), {
  flush: 'sync',
});
</script>

<template>
  <section class="mx-auto max-w-[860px] rounded-2xl border border-desk-border bg-white p-5 sm:p-8">
    <h2 class="text-xl font-bold">
      录入投稿
    </h2>
    <p class="mt-2 mb-6 text-sm leading-6 text-desk-muted">
      每次录入一条待审核投稿。提交时间按北京时间填写，审核结果由审核流程产生。
    </p>
    <el-alert
      v-if="error"
      class="mb-5"
      :title="error"
      type="error"
      :closable="false"
      show-icon
      role="alert"
    />
    <el-form
      label-position="top"
      :disabled="saving"
      @submit.prevent="submit"
    >
      <el-form-item
        label="标题"
        required
      >
        <el-input
          v-model="form.title"
          maxlength="200"
          show-word-limit
          aria-label="标题"
        />
      </el-form-item>
      <div class="grid gap-x-5 md:grid-cols-3">
        <el-form-item
          label="作者"
          required
        >
          <el-input
            v-model="form.author_name"
            maxlength="80"
            aria-label="作者"
          />
        </el-form-item>
        <el-form-item
          label="分类"
          required
        >
          <el-input
            v-model="form.category"
            maxlength="80"
            placeholder="例如：科技、文化、生活"
            aria-label="分类"
          />
        </el-form-item>
        <el-form-item
          label="提交时间（北京时间）"
          required
        >
          <el-date-picker
            v-model="form.time"
            class="w-full min-w-0"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            :clearable="false"
            aria-label="提交时间"
          />
        </el-form-item>
      </div>
      <el-form-item
        label="正文"
        required
      >
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="10"
          maxlength="50000"
          show-word-limit
          aria-label="正文"
        />
      </el-form-item>
      <div class="flex flex-wrap gap-3">
        <el-button
          type="primary"
          native-type="submit"
          :loading="saving"
        >
          保存为待审核
        </el-button>
        <el-button
          :disabled="saving"
          @click="emit('cancel')"
        >
          返回列表
        </el-button>
      </div>
    </el-form>
  </section>
</template>
