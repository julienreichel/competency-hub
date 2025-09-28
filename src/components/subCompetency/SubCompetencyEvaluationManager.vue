<template>
  <div>
    <q-separator class="q-my-lg" />

    <div class="row items-center q-gutter-sm">
      <div class="text-h6">{{ t('evaluations.title') }}</div>
      <q-space />
      <q-btn
        v-if="canManage"
        color="primary"
        icon="add"
        :label="t('evaluations.addEvaluation')"
        @click="openCreateDialog"
      />
    </div>

    <div class="q-mt-md">
      <div v-if="!evaluations.length" class="text-grey-6 text-center">
        {{ t('evaluations.emptyState') }}
      </div>
      <evaluation-table
        v-else-if="evaluations.length"
        :evaluations="evaluations"
        :variant="tableVariant"
        :show-actions="canManage"
        :loading="mutating"
        :student-id="studentId"
        :busy-map="studentActionBusy"
        @open="handleOpenEvaluation"
        @edit="openEditDialog"
        @delete="handleDeleteEvaluation"
        @start="handleStudentStart"
        @complete="handleStudentComplete"
      />
    </div>

    <evaluation-form-dialog
      v-if="canManage"
      v-model="dialogOpen"
      :sub-competency-id="subCompetencyId"
      :initial="dialogInitial"
      @create="handleCreateEvaluation"
      @update="handleUpdateEvaluation"
    />
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import EvaluationFormDialog from 'src/components/evaluation/EvaluationFormDialog.vue';
import EvaluationTable from 'src/components/evaluation/EvaluationTable.vue';
import { useAuth } from 'src/composables/useAuth';
import { Evaluation } from 'src/models/Evaluation';
import type { EvaluationAttempt } from 'src/models/EvaluationAttempt';
import {
  evaluationAttemptRepository,
  type CreateEvaluationAttemptInput,
  type UpdateEvaluationAttemptInput,
} from 'src/models/repositories/EvaluationAttemptRepository';
import {
  evaluationRepository,
  type CreateEvaluationInput,
  type UpdateEvaluationInput,
} from 'src/models/repositories/EvaluationRepository';
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  subCompetencyId: string;
  initialEvaluations?: Evaluation[];
  studentId?: string | undefined;
}>();

const { hasRole } = useAuth();
const { t } = useI18n();
const $q = useQuasar();

const canManage = computed(() => hasRole('Admin') || hasRole('Educator'));
const evaluations = ref<Evaluation[]>([]);
const mutating = ref(false);
const dialogOpen = ref(false);
const dialogInitial = ref<Evaluation | null>(null);
const studentActionBusy = reactive<
  Record<string, { busy: boolean; pending: 'start' | 'open' | 'complete' | null }>
>({});
const attemptsByEvaluation = reactive<Record<string, EvaluationAttempt | null>>({});

const tableVariant = computed<'manager' | 'student'>(() =>
  canManage.value ? 'manager' : 'student',
);
const studentId = computed(() => (props.studentId ? String(props.studentId) : ''));
const isStudentView = computed(() => tableVariant.value === 'student' && Boolean(studentId.value));

watch(
  () => props.initialEvaluations,
  (value) => {
    if (Array.isArray(value)) {
      syncEvaluations(value);
    } else {
      evaluations.value = [];
    }
  },
  { immediate: true },
);

function syncEvaluations(list: Evaluation[]): void {
  evaluations.value = list.map((item) =>
    item instanceof Evaluation ? item : new Evaluation(item),
  );
  if (isStudentView.value) {
    evaluations.value.forEach((evaluation) => {
      attemptsByEvaluation[evaluation.id] = findStudentAttempt(evaluation);
      if (!studentActionBusy[evaluation.id]) {
        studentActionBusy[evaluation.id] = { busy: false, pending: null };
      }
    });
  }
}

function openCreateDialog(): void {
  dialogInitial.value = null;
  dialogOpen.value = true;
}

function openEditDialog(evaluation: Evaluation): void {
  dialogInitial.value = evaluation;
  dialogOpen.value = true;
}

async function handleCreateEvaluation(payload: CreateEvaluationInput): Promise<void> {
  mutating.value = true;
  try {
    const created = await evaluationRepository.create(payload);
    evaluations.value = [created, ...evaluations.value];
    $q.notify({ type: 'positive', message: t('evaluations.createSuccess') });
  } catch (error) {
    console.error('Failed to create evaluation', error);
    $q.notify({ type: 'negative', message: t('evaluations.createError') });
  } finally {
    mutating.value = false;
  }
}

async function handleUpdateEvaluation({
  id,
  data,
}: {
  id: string;
  data: UpdateEvaluationInput;
}): Promise<void> {
  const index = evaluations.value.findIndex((evaluation) => evaluation.id === id);
  if (index === -1) return;

  mutating.value = true;
  try {
    const updated = await evaluationRepository.update(id, data);
    const finalList = [...evaluations.value];
    const replaceIndex = finalList.findIndex((entry) => entry.id === id);
    if (replaceIndex !== -1) {
      finalList.splice(replaceIndex, 1, updated);
      evaluations.value = finalList;
    }
    $q.notify({ type: 'positive', message: t('evaluations.updateSuccess') });
  } catch (error) {
    console.error(`Failed to update evaluation ${id}`, error);
    $q.notify({ type: 'negative', message: t('evaluations.updateError') });
  } finally {
    mutating.value = false;
  }
}

async function handleDeleteEvaluation(id: string): Promise<void> {
  const index = evaluations.value.findIndex((evaluation) => evaluation.id === id);
  if (index === -1) return;

  const previous = [...evaluations.value];
  const filtered = previous.filter((evaluation) => evaluation.id !== id);
  mutating.value = true;
  evaluations.value = filtered;
  try {
    await evaluationRepository.delete(id);
    $q.notify({ type: 'positive', message: t('evaluations.deleteSuccess') });
  } catch (error) {
    console.error(`Failed to delete evaluation ${id}`, error);
    evaluations.value = previous;
    $q.notify({ type: 'negative', message: t('evaluations.deleteError') });
  } finally {
    mutating.value = false;
  }
}

async function handleOpenEvaluation(evaluation: Evaluation): Promise<void> {
  if (evaluation.url) {
    window.open(evaluation.url, '_blank', 'noopener');
    return;
  }
  if (!evaluation.fileKey) return;
  try {
    const resolved = await evaluation.resolveFileUrl();
    if (!resolved) {
      throw new Error('Failed to resolve evaluation file URL');
    }
    window.open(resolved, '_blank', 'noopener');
  } catch (error) {
    console.error('Failed to open evaluation', error);
    $q.notify({ type: 'negative', message: t('evaluations.openError') });
  }
}

function findStudentAttempt(evaluation: Evaluation): EvaluationAttempt | null {
  if (!studentId.value) return null;
  const attempts = Array.isArray(evaluation.attempts) ? evaluation.attempts : [];
  const match = attempts.find((attempt) => attempt.studentId === studentId.value);
  return match ?? null;
}

function setBusy(
  evaluationId: string,
  pending: 'start' | 'open' | 'complete' | null,
  value: boolean,
): void {
  studentActionBusy[evaluationId] = {
    busy: value,
    pending: value ? pending : null,
  };
}

async function handleStudentStart(evaluation: Evaluation): Promise<void> {
  if (!isStudentView.value || !studentId.value) return;
  const currentAttempt = attemptsByEvaluation[evaluation.id];
  setBusy(evaluation.id, 'start', true);
  try {
    const timestamp = new Date().toISOString();
    let attempt: EvaluationAttempt;
    if (!currentAttempt) {
      const payload: CreateEvaluationAttemptInput = {
        studentId: studentId.value,
        evaluationId: evaluation.id,
        status: 'InProgress',
        startedAt: timestamp,
      };
      attempt = await evaluationAttemptRepository.create(payload);
    } else {
      const updates: UpdateEvaluationAttemptInput = { status: 'InProgress', startedAt: timestamp };
      attempt = await evaluationAttemptRepository.update(currentAttempt.id, updates);
    }
    attemptsByEvaluation[evaluation.id] = attempt;
    ensureEvaluationAttempt(evaluation, attempt);
    refreshEvaluations();
    await evaluation.resolveFileUrl();
    $q.notify({ type: 'positive', message: t('evaluations.actions.startSuccess') });
  } catch (error) {
    console.error('Failed to start evaluation', error);
    $q.notify({ type: 'negative', message: t('evaluations.actions.startError') });
  } finally {
    setBusy(evaluation.id, null, false);
  }
}

async function handleStudentComplete(evaluation: Evaluation): Promise<void> {
  if (!isStudentView.value || !studentId.value) return;
  const attempt = attemptsByEvaluation[evaluation.id];
  if (!attempt || attempt.status !== 'InProgress') return;
  setBusy(evaluation.id, 'complete', true);
  try {
    const timestamp = new Date().toISOString();
    const updated = await evaluationAttemptRepository.update(attempt.id, {
      status: 'Completed',
      completedAt: timestamp,
    });
    attemptsByEvaluation[evaluation.id] = updated;
    ensureEvaluationAttempt(evaluation, updated);
    refreshEvaluations();
    $q.notify({ type: 'positive', message: t('evaluations.actions.completeSuccess') });
  } catch (error) {
    console.error('Failed to mark evaluation completed', error);
    $q.notify({ type: 'negative', message: t('evaluations.actions.completeError') });
  } finally {
    setBusy(evaluation.id, null, false);
  }
}

function ensureEvaluationAttempt(evaluation: Evaluation, attempt: EvaluationAttempt): void {
  if (!Array.isArray(evaluation.attempts)) {
    evaluation.attempts = [attempt];
    return;
  }
  const index = evaluation.attempts.findIndex((entry) => entry.id === attempt.id);
  if (index === -1) {
    evaluation.attempts.push(attempt);
  } else {
    evaluation.attempts.splice(index, 1, attempt);
  }
}

function refreshEvaluations(): void {
  evaluations.value = [...evaluations.value];
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SubCompetencyEvaluationManager',
});
</script>
