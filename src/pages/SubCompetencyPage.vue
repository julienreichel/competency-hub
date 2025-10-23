<template>
  <q-page padding>
    <breadcrumb-header
      :breadcrumbs="breadcrumbs"
      :title="sub?.name ?? t('subCompetencies.loading')"
      :loading="loading"
      :back-target="{ name: 'competency', params: { competencyId } }"
    >
      <template #default>
        <q-btn
          v-if="canDeleteSub"
          color="negative"
          icon="delete"
          :label="t('common.delete')"
          @click="confirmDeleteSub"
        />
      </template>
    </breadcrumb-header>

    <template v-if="sub">
      <sub-competency-card
        v-if="!editing"
        :sub="sub"
        :show-edit="canManage"
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

    <new-message-dialog
      v-if="systemComposerContext"
      v-model="systemComposerOpen"
      :initial-targets="systemComposerContext.participantIds"
      :initial-title="systemComposerContext.title"
      :kind="systemComposerContext.kind"
      mode="body-only"
      @create="handleSystemMessageCreate"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import BreadcrumbHeader from 'src/components/common/BreadcrumbHeader.vue';
import NewMessageDialog from 'src/components/messaging/NewMessageDialog.vue';
import { useMessaging } from 'src/composables/useMessaging';
import { useUsers } from 'src/composables/useUsers';
import type { MessageKind } from 'src/models/Message';
import {
  type StudentSubCompetencyProgress,
  type StudentSubCompetencyProgressUpdate,
} from 'src/models/StudentSubCompetencyProgress';
import { type SubCompetency, type UpdateSubCompetencyInput } from 'src/models/SubCompetency';
import type { User } from 'src/models/User';
import { UserRole } from 'src/models/User';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { StudentProgressRepository } from 'src/models/repositories/StudentProgressRepository';
import { subCompetencyRepository } from 'src/models/repositories/SubCompetencyRepository';

import SubCompetencyCard from 'src/components/competency/SubCompetencyCard.vue';
import SubCompetencyForm from 'src/components/competency/SubCompetencyForm.vue';
import SubCompetencyEvaluationManager from 'src/components/subCompetency/SubCompetencyEvaluationManager.vue';
import SubCompetencyResourceManager from 'src/components/subCompetency/SubCompetencyResourceManager.vue';
import SubCompetencyStudentManager from 'src/components/subCompetency/SubCompetencyStudentManager.vue';
import { useAuth } from 'src/composables/useAuth';

const $q = useQuasar();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { hasRole } = useAuth();
const { getCurrentUser } = useUsers();
const { sendSystemMessage } = useMessaging();

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

interface SystemMessageComposerContext {
  senderId: string;
  title: string;
  participantIds: string[];
  kind: MessageKind;
}

const systemComposerOpen = ref(false);
const systemComposerContext = ref<SystemMessageComposerContext | null>(null);

const isStudent = computed(() => currentUser.value?.role === UserRole.STUDENT);
const canManage = computed(() => hasRole('Admin') || hasRole('Educator'));
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

const resourcesCount = computed(() => sub.value?.resources?.length ?? 0);
const evaluationsCount = computed(() => sub.value?.evaluations?.length ?? 0);

const canDeleteSub = computed(
  () =>
    canManage.value &&
    !loading.value &&
    !editing.value &&
    resourcesCount.value === 0 &&
    evaluationsCount.value === 0,
);

const breadcrumbs = computed(() => [
  {
    label: domainName.value,
    to: { name: 'domain', params: { domainId } },
  },
  {
    label: competencyName.value,
    to: { name: 'competency', params: { competencyId } },
  },
  {
    label: sub.value?.name ?? t('subCompetencies.loading'),
  },
]);

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

function confirmDeleteSub(): void {
  if (!sub.value || !canDeleteSub.value) return;
  $q.dialog({
    title: t('subCompetencies.title'),
    message: t('subCompetencies.deleteConfirm', { name: sub.value.name }),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void deleteSub();
  });
}

async function deleteSub(): Promise<void> {
  if (!sub.value) return;
  try {
    await subCompetencyRepository.delete(sub.value.id);
    $q.notify({ type: 'positive', message: t('subCompetencies.deleted') });
    await router.push({ name: 'competency', params: { competencyId } });
  } catch (error) {
    console.error('Failed to delete sub-competency', error);
    $q.notify({ type: 'negative', message: t('subCompetencies.deleteError') });
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
      openValidationRequestComposer();
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

function openValidationRequestComposer(): void {
  if (!currentUser.value) return;
  const educatorIds = Array.from(
    new Set(
      (currentUser.value.educators ?? [])
        .map((educator) => educator.id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  if (!educatorIds.length) {
    return;
  }

  systemComposerContext.value = {
    senderId: currentUser.value.id,
    title: t('messaging.notifications.validationSubmittedTitle'),
    participantIds: educatorIds,
    kind: 'ValidationSubmitted',
  };
  systemComposerOpen.value = true;
}

async function handleSystemMessageCreate(payload: {
  title: string;
  body: string;
  participantIds: string[];
  kind?: MessageKind;
}): Promise<void> {
  const context = systemComposerContext.value;
  if (!context) {
    return;
  }
  try {
    await sendSystemMessage({
      senderId: context.senderId,
      title: context.title,
      body: payload.body.trim(),
      participantIds: payload.participantIds,
      kind: payload.kind ?? context.kind,
      subCompetencyId: sub.value?.id,
    });
    $q.notify({ type: 'positive', message: t('messaging.notifications.sentSuccess') });
    systemComposerContext.value = null;
  } catch (error) {
    console.error('Failed to send validation notification', error);
    $q.notify({ type: 'negative', message: t('messaging.notifications.sentError') });
  }
}

async function onSaveSub(updated: UpdateSubCompetencyInput): Promise<void> {
  await subCompetencyRepository.update(subId, updated);
  $q.notify({ type: 'positive', message: t('subCompetencies.saveSuccess') });
  await load();
  editing.value = false;
}

const TITLE_PART_MAX_LENGTH = 20;
function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

watch(systemComposerOpen, (isOpen) => {
  if (!isOpen) {
    systemComposerContext.value = null;
  }
});

watch(
  [domainName, competencyName, sub],
  ([domain, competency, subObj]) => {
    const parts = [
      'Competency Hub',
      truncate(domain || '', TITLE_PART_MAX_LENGTH),
      truncate(competency || '', TITLE_PART_MAX_LENGTH),
      truncate(subObj?.name || '', TITLE_PART_MAX_LENGTH),
    ].filter(Boolean);
    document.title = parts.join(' | ');
  },
  { immediate: true },
);
</script>

<script lang="ts">
export default { name: 'SubCompetencyEditorPage' };
</script>
