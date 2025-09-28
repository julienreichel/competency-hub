<template>
  <div class="position-relative" style="min-height: 48px">
    <div v-if="evaluations.length" class="column q-gutter-md">
      <evaluation-card
        v-for="evaluation in evaluations"
        :key="evaluation.id"
        :evaluation="evaluation"
        :show-actions="showActions"
        @open="emit('open', evaluation)"
        @edit="emit('edit', evaluation)"
        @delete="emit('delete', evaluation.id)"
      />
    </div>
    <q-inner-loading :showing="loading">
      <q-spinner color="primary" size="40px" />
    </q-inner-loading>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import EvaluationCard from './EvaluationCard.vue';
import type { Evaluation } from 'src/models/Evaluation';

const props = defineProps<{
  evaluations: Evaluation[];
  showActions?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'open', evaluation: Evaluation): void;
  (e: 'edit', evaluation: Evaluation): void;
  (e: 'delete', id: string): void;
}>();

const showActions = computed(() => props.showActions === true);
const loading = computed(() => props.loading === true);
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'EvaluationTable',
});
</script>
