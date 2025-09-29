<template>
  <div class="position-relative" style="min-height: 48px">
    <div v-if="evaluations.length" class="row q-col-gutter-md">
      <div v-for="evaluation in evaluations" :key="evaluation.id" class="col-12" :class="cardClass">
        <evaluation-card
          :evaluation="evaluation"
          :variant="variant"
          :attempt="attemptFor(evaluation)"
          :busy="busyState(evaluation.id).busy"
          :pending-action="busyState(evaluation.id).pending"
          :show-actions="variant === 'manager' && showActions"
          :sub-competency="subCompetencyFor(evaluation)"
          :student-actions-allowed="studentActionsAllowed"
          class="full-height"
          @open="emit('open', evaluation)"
          @edit="emit('edit', evaluation)"
          @delete="emit('delete', evaluation.id)"
          @start="emit('start', evaluation)"
          @complete="emit('complete', evaluation)"
        />
      </div>
    </div>
    <div v-else class="text-grey-6 text-center">
      {{ $t('evaluations.emptyState') }}
    </div>
    <q-inner-loading :showing="loading">
      <q-spinner color="primary" size="40px" />
    </q-inner-loading>
  </div>
</template>

<script setup lang="ts">
import type { Evaluation } from 'src/models/Evaluation';
import type { EvaluationAttempt } from 'src/models/EvaluationAttempt';
import type { SubCompetency } from 'src/models/SubCompetency';
import { computed } from 'vue';
import EvaluationCard from './EvaluationCard.vue';

const props = defineProps<{
  evaluations: Evaluation[];
  showActions?: boolean;
  loading?: boolean;
  variant?: 'manager' | 'student';
  studentId?: string | undefined;
  busyMap?: Record<string, { busy: boolean; pending: 'start' | 'open' | 'complete' | null }>;
  subCompetencyMap?: Record<string, SubCompetency | null | undefined>;
  studentActionsAllowed?: boolean;
  cardClass?: string;
}>();

const emit = defineEmits<{
  (e: 'open', evaluation: Evaluation): void;
  (e: 'edit', evaluation: Evaluation): void;
  (e: 'delete', id: string): void;
  (e: 'start', evaluation: Evaluation): void;
  (e: 'complete', evaluation: Evaluation): void;
}>();

const variant = computed(() => props.variant ?? 'manager');
const showActions = computed(() => props.showActions !== false);
const loading = computed(() => props.loading === true);
const subCompetencyMap = computed(() => props.subCompetencyMap ?? {});

function attemptFor(evaluation: Evaluation): EvaluationAttempt | null {
  if (variant.value !== 'student' || !props.studentId) return null;
  const attempts = Array.isArray(evaluation.attempts) ? evaluation.attempts : [];
  const match = attempts.find((attempt) => attempt.studentId === props.studentId);
  return match ?? null;
}

function busyState(id: string): { busy: boolean; pending: 'start' | 'open' | 'complete' | null } {
  if (!props.busyMap) return { busy: false, pending: null };
  return props.busyMap[id] ?? { busy: false, pending: null };
}

function subCompetencyFor(evaluation: Evaluation): SubCompetency | null | undefined {
  return subCompetencyMap.value[evaluation.id];
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'EvaluationTable',
});
</script>
