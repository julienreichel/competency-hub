<template>
  <q-page padding>
    <breadcrumb-header
      :breadcrumbs="[
        { label: domainName, to: { name: 'domain', params: { domainId } } },
        {
          label: competencyName,
          to: { name: 'competency', params: { competencyId } },
        },
        { label: sub && sub.name ? sub.name : t('subCompetencies.loading') },
      ]"
      :title="sub && sub.name ? sub.name : t('subCompetencies.loading')"
      :loading="loading"
      :back-target="{ name: 'competency', params: { competencyId } }"
    />

    <template v-if="sub">
      <sub-competency-card
        v-if="!editing"
        :sub="sub"
        :show-edit="hasRole('Admin') || hasRole('Educator')"
        :show-student-progress="hasRole('Student')"
        @edit="editing = true"
      />
      <sub-competency-form v-else :model-value="sub" @save="onSaveSub" @cancel="editing = false" />
    </template>

    <div
      v-if="isStudent && studentProgress && studentProgress.lockOverride !== 'Locked'"
      class="q-mt-md"
    >
      <div class="row q-col-gutter-sm">
        <div
          v-for="step in visibleProgressSteps"
          :key="step.percent"
          class="col-12 col-sm-6 col-md-3"
        >
          <q-btn
            :label="step.label"
            :color="step.color"
            class="full-width"
            :disable="studentProgressUpdating || !step.enabled"
            :loading="studentProgressUpdating && pendingPercent === step.percent"
            @click="handleProgressStep(step)"
          />
        </div>
      </div>
    </div>

    <sub-competency-student-manager v-model:sub="sub" />

    <sub-competency-resource-manager
      :sub-competency-id="subId"
      :initial-resources="sub?.resources ?? []"
    />

    <sub-competency-evaluation-manager
      v-if="!isStudent || canShowStudentEvaluations"
      :sub-competency-id="subId"
      :initial-evaluations="sub?.evaluations ?? []"
      :student-id="isStudent ? currentStudentId : undefined"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import BreadcrumbHeader from 'src/components/common/BreadcrumbHeader.vue';
import { useUsers } from 'src/composables/useUsers';
import {
  type StudentSubCompetencyProgress,
  type StudentSubCompetencyProgressUpdate,
} from 'src/models/StudentSubCompetencyProgress';
import { type SubCompetency, type UpdateSubCompetencyInput } from 'src/models/SubCompetency';
import type { User } from 'src/models/User';
import { UserRole } from 'src/models/User';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import { StudentProgressRepository } from 'src/models/repositories/StudentProgressRepository';
import { subCompetencyRepository } from 'src/models/repositories/SubCompetencyRepository';

import SubCompetencyCard from 'src/components/competency/SubCompetencyCard.vue';
import SubCompetencyForm from 'src/components/competency/SubCompetencyForm.vue';
import SubCompetencyStudentManager from 'src/components/subCompetency/SubCompetencyStudentManager.vue';
import SubCompetencyResourceManager from 'src/components/subCompetency/SubCompetencyResourceManager.vue';
import SubCompetencyEvaluationManager from 'src/components/subCompetency/SubCompetencyEvaluationManager.vue';
import { useAuth } from 'src/composables/useAuth';

const $q = useQuasar();
const { t } = useI18n();
const route = useRoute();
const { hasRole } = useAuth();
const { getCurrentUser } = useUsers();

let domainId = route.params.domainId as string | undefined;
const competencyId = route.params.competencyId as string;
const subId = route.params.subId as string;

const loading = ref(false);
const sub = ref<SubCompetency | null>(null);
const editing = ref(false);
const domainName = ref<string>(t('domains.title'));
const competencyName = ref<string>(t('competencies.title'));
const currentUser = ref<User | null>(null);
const studentProgressUpdating = ref(false);
const pendingPercent = ref<number | null>(null);
const REMEMBER_PROGRESS_PERCENT = 25;
const EXPLAIN_PROGRESS_PERCENT = 50;
const APPLY_PROGRESS_PERCENT = 75;
const FINAL_PROGRESS_PERCENT = 100;

const isStudent = computed(() => currentUser.value?.role === UserRole.STUDENT);
const currentStudentId = computed(() => currentUser.value?.id ?? '');
const canShowStudentEvaluations = computed(
  () => isStudent.value && studentProgress.value?.status === 'PendingValidation',
);
const studentProgress = computed<StudentSubCompetencyProgress | null>(() => {
  if (!isStudent.value || !currentUser.value?.studentProgress) return null;
  return (
    currentUser.value?.studentProgress.find(
      (progress) => progress.subCompetencyId === sub.value?.id,
    ) ?? null
  );
});

interface ProgressStep {
  percent: number;
  label: string;
  color: string;
}

type ProgressButton = ProgressStep & { enabled: boolean };

const progressStepDefinitions = computed<ProgressStep[]>(() => [
  {
    percent: REMEMBER_PROGRESS_PERCENT,
    label: t('subCompetencies.progressSteps.remember'),
    color: 'info',
  },
  {
    percent: EXPLAIN_PROGRESS_PERCENT,
    label: t('subCompetencies.progressSteps.explain'),
    color: 'primary',
  },
  {
    percent: APPLY_PROGRESS_PERCENT,
    label: t('subCompetencies.progressSteps.apply'),
    color: 'accent',
  },
  {
    percent: FINAL_PROGRESS_PERCENT,
    label: t('subCompetencies.progressSteps.master'),
    color: 'positive',
  },
]);

const visibleProgressSteps = computed<ProgressButton[]>(() => {
  const progress = studentProgress.value;
  if (!progress) return [];
  const currentPercent = typeof progress.percent === 'number' ? progress.percent : 0;
  const steps = progressStepDefinitions.value;
  const nextIndex = steps.findIndex((step) => step.percent > currentPercent);
  if (nextIndex === -1 || progress.status === 'PendingValidation') {
    return [];
  }
  const nextStep = steps[nextIndex];
  return [{ ...nextStep, enabled: true }] as ProgressButton[];
});

onMounted(async () => {
  await load();
  await loadCurrentUser();
  syncSubToCurrentUser();
  await autoAdvanceStudentProgress();
});

async function load(): Promise<void> {
  loading.value = true;
  try {
    const fetched = await subCompetencyRepository.findById(subId, true);
    sub.value = fetched;
    if (fetched?.competency?.name) {
      competencyName.value = fetched.competency.name;
    }
    if (fetched?.competency?.domain?.name) {
      domainName.value = fetched.competency.domain.name;
      domainId = fetched.competency.domainId;
    }
  } finally {
    loading.value = false;
  }
}

async function loadCurrentUser(): Promise<void> {
  const user = await getCurrentUser();
  currentUser.value = user ?? null;
}

function syncSubToCurrentUser(): void {
  if (!sub.value || !currentUser.value) return;
  if (currentUser.value.role === UserRole.STUDENT) {
    sub.value.attachUserProgress(currentUser.value);
  }
}

function updateCurrentUserProgress(progress: StudentSubCompetencyProgress): void {
  if (!sub.value) return;
  let progressIndex = sub.value.studentProgress.findIndex((entry) => entry.id === progress.id);
  if (progressIndex === -1) {
    sub.value.studentProgress.push(progress);
  } else {
    sub.value.studentProgress.splice(progressIndex, 1, progress);
  }

  if (!currentUser.value) return;
  if (!currentUser.value.studentProgress) {
    currentUser.value.studentProgress = [];
  }
  progressIndex = currentUser.value.studentProgress.findIndex((entry) => entry.id === progress.id);
  if (progressIndex === -1) {
    currentUser.value.studentProgress.push(progress);
  } else {
    currentUser.value.studentProgress.splice(progressIndex, 1, progress);
  }
}

async function autoAdvanceStudentProgress(): Promise<void> {
  if (!isStudent.value || studentProgressUpdating.value) return;
  const user = currentUser.value;
  if (!user) return;
  const progress = studentProgress.value;
  if (!progress) return;
  if (progress.status !== 'NotStarted') {
    return;
  }

  studentProgressUpdating.value = true;
  try {
    const updated = await StudentProgressRepository.updateProgress(progress.id, {
      status: 'InProgress',
    });
    updateCurrentUserProgress(updated);
  } catch (error) {
    console.error('Failed to auto-start student progress', error);
  } finally {
    studentProgressUpdating.value = false;
  }
}

async function handleProgressStep(step: ProgressButton): Promise<void> {
  if (
    !isStudent.value ||
    studentProgressUpdating.value ||
    !currentUser.value ||
    !studentProgress.value
  ) {
    return;
  }

  const progress = studentProgress.value;
  if (progress.lockOverride === 'Locked') return;

  pendingPercent.value = step.percent;
  studentProgressUpdating.value = true;
  try {
    const updates: StudentSubCompetencyProgressUpdate = {
      percent: step.percent,
    };
    if (step.percent === FINAL_PROGRESS_PERCENT) {
      updates.status = 'PendingValidation';
    } else if (progress.status !== 'InProgress') {
      updates.status = 'InProgress';
    }

    const updated = await StudentProgressRepository.updateProgress(progress.id, updates);
    updateCurrentUserProgress(updated);

    if (step.percent === FINAL_PROGRESS_PERCENT) {
      $q.notify({ type: 'positive', message: t('subCompetencies.pendingValidationSuccess') });
    } else {
      $q.notify({ type: 'positive', message: t('subCompetencies.progressStepSuccess') });
    }
  } catch (error) {
    console.error('Failed to update student progress step', error);
    $q.notify({ type: 'negative', message: t('subCompetencies.progressUpdateError') });
  } finally {
    pendingPercent.value = null;
    studentProgressUpdating.value = false;
  }
}

async function onSaveSub(updated: UpdateSubCompetencyInput): Promise<void> {
  await subCompetencyRepository.update(subId, updated);
  $q.notify({ type: 'positive', message: 'Sub-competency saved' });
  await load();
  editing.value = false;
}
</script>

<script lang="ts">
export default { name: 'SubCompetencyEditorPage' };
</script>
