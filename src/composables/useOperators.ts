import { reactive, ref } from 'vue';
import type { Operator } from '../../shared/types';
import { api, errorMessage } from '../lib/api';

export function useOperators() {
  const items = ref<Operator[]>([]);
  const selectedId = ref<number>();

  const loading = ref(false);
  const error = ref('');

  async function load() {
    loading.value = true;
    error.value = '';

    try {
      const result = await api<Operator[]>('/operators');

      items.value = result;

      if (selectedId.value && !result.some(item => item.id === selectedId.value)) {
        selectedId.value = undefined;
      }
    } catch (cause) {
      error.value = errorMessage(cause);
    } finally {
      loading.value = false;
    }
  }

  return reactive({
    items,
    selectedId,
    loading,
    error,
    load,
  });
}
