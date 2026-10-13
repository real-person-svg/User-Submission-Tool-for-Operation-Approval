<script setup lang="ts">
import {
  computed,
  onMounted,
  ref,
  toRef,
} from 'vue';
import WorkbenchHeader from './components/WorkbenchHeader.vue';
import SubmissionEntry from './components/SubmissionEntry.vue';
import SubmissionList from './components/SubmissionList.vue';
import SubmissionDetail from './components/SubmissionDetail.vue';
import ReviewDialog from './components/ReviewDialog.vue';
import ReviewResult from './components/ReviewResult.vue';
import ReviewerTour from './components/ReviewerTour.vue';
import { useOperators } from './composables/useOperators';
import { useSubmissionList } from './composables/useSubmissionList';
import { useSubmissionDetail } from './composables/useSubmissionDetail';
import { useReview } from './composables/useReview';

const pageView = ref<'list' | 'entry'>('list');
const entrySaving = ref(false);
const reviewing = ref(false);
const tour = ref<InstanceType<typeof ReviewerTour>>();

const operators = useOperators();
const list = useSubmissionList(reviewing);
const detail = useSubmissionDetail();

const operatorId = toRef(operators, 'selectedId');

const canReview = computed(() =>
  !list.busy
  && !list.error
  && list.hasLoaded
  && !operators.loading
  && !operators.error
  && operators.items.some(operator => operator.id === operatorId.value),
);

const listButtonType = computed(() => pageView.value === 'list' ? 'primary' : 'default');
const entryButtonType = computed(() => pageView.value === 'entry' ? 'primary' : 'default');
const tourEnabled = computed(() =>
  pageView.value === 'list' && list.hasLoaded && !list.busy && !list.error
  && !operators.loading && !operators.error && !detail.visible && !review.visible,
);

async function refreshAfterReview() {
  list.clearSelection();
  await list.load();
  await detail.reload();
}

const review = useReview({
  operatorId,
  canReview,
  reviewing,
  refresh: refreshAfterReview,
});

function showList() {
  pageView.value = 'list';
}

function showEntry() {
  pageView.value = 'entry';
  list.clearSelection();
}

function afterCreated() {
  showList();
  list.reset();
}

onMounted(() => {
  void operators.load();
  void list.load();
});
</script>

<template>
  <main class="mx-auto max-w-[1500px] px-4 py-6 sm:px-8 sm:py-10">
    <WorkbenchHeader
      v-model:operator-id="operators.selectedId"
      :operators="operators.items"
      :loading="operators.loading"
      :error="operators.error"
      :reviewing="reviewing"
      @retry="operators.load"
    >
      <nav
        aria-label="工作台页面"
        class="flex flex-wrap gap-3 [&>.el-button]:ml-0"
      >
        <el-button
          data-tour="help"
          :class="{ invisible: pageView !== 'list' }"
          :aria-hidden="pageView !== 'list'"
          :disabled="!tourEnabled"
          @click="tour?.start()"
        >
          新手指引
        </el-button>
        <el-button
          :type="listButtonType"
          :disabled="reviewing || entrySaving"
          @click="showList"
        >
          投稿列表
        </el-button>
        <el-button
          :type="entryButtonType"
          :disabled="list.busy || entrySaving"
          @click="showEntry"
        >
          录入投稿
        </el-button>
      </nav>
    </WorkbenchHeader>
    <SubmissionEntry
      v-if="pageView === 'entry'"
      @created="afterCreated"
      @cancel="showList"
      @saving="entrySaving = $event"
    />
    <SubmissionList
      v-show="pageView === 'list'"
      :state="list"
      :can-review="canReview"
      @table-ready="list.table = $event"
      @detail="detail.open"
      @review="review.start"
      @create="showEntry"
    >
      <template #result>
        <ReviewResult
          :request-error="review.requestError"
          :result="review.result"
          :result-titles="review.resultTitles"
          @clear-error="review.requestError = ''"
          @clear-result="review.result = undefined"
        />
      </template>
    </SubmissionList>
    <SubmissionDetail
      v-model="detail.visible"
      :detail="detail.detail"
      :loading="detail.loading"
      :error="detail.error"
      :reviewing="reviewing"
      @retry="detail.reload"
    />
    <ReviewDialog
      v-model="review.visible"
      v-model:reason="review.reason"
      :items="review.items"
      :operators="operators.items"
      :operator-id="review.confirmedOperatorId"
      :action="review.action"
      :error="review.error"
      :reviewing="reviewing"
      @submit="review.submit"
    />
    <ReviewerTour
      ref="tour"
      :enabled="tourEnabled"
    />
  </main>
</template>
