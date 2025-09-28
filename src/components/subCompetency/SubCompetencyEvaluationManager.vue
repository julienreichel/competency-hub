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
        dense
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
        :show-actions="canManage"
        :loading="mutating"
        @open="handleOpenEvaluation"
        @edit="openEditDialog"
        @delete="handleDeleteEvaluation"
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
import {
  evaluationRepository,
  type CreateEvaluationInput,
  type UpdateEvaluationInput,
} from 'src/models/repositories/EvaluationRepository';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  subCompetencyId: string;
  initialEvaluations?: Evaluation[];
}>();

const { hasRole } = useAuth();
const { t } = useI18n();
const $q = useQuasar();

const canManage = computed(() => hasRole('Admin') || hasRole('Educator'));
const evaluations = ref<Evaluation[]>([]);
const mutating = ref(false);
const dialogOpen = ref(false);
const dialogInitial = ref<Evaluation | null>(null);

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
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SubCompetencyEvaluationManager',
});
</script>
