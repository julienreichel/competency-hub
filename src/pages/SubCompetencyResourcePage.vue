<template>
  <q-page padding>
    <breadcrumb-header
      :breadcrumbs="[
        { label: domainName, to: { name: 'domain-competencies', params: { domainId } } },
        {
          label: competencyName,
          to: { name: 'competency-sub-competency', params: { competencyId } },
        },
        { label: sub && sub.name ? sub.name : t('subCompetencies.loading') },
      ]"
      :title="sub && sub.name ? sub.name : t('subCompetencies.loading')"
      :loading="loading"
      :back-target="{ name: 'competency-sub-competency', params: { competencyId } }"
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
      v-if="
        isStudent &&
        studentProgress &&
        studentProgress.status === 'InProgress' &&
        studentProgress.lockOverride !== 'Locked'
      "
      class="q-mt-md"
    >
      <q-btn
        color="primary"
        :loading="studentProgressUpdating"
        :disable="studentProgressUpdating"
        :label="t('subCompetencies.pendingValidationAction')"
        @click="submitPendingValidation"
      />
    </div>

    <template v-if="hasRole('Educator')">
      <q-separator class="q-my-lg" />
      <sub-competency-student-table
        :students="students"
        :loading="studentsLoading"
        @unlock="handleUnlock"
        @recommend="handleRecommend"
        @lock="handleLock"
        @validate="handleValidate"
      />
    </template>

    <q-separator class="q-my-lg" />

    <div class="row items-center q-gutter-sm">
      <div class="text-h6">{{ t('resources.title') }}</div>
      <q-space />
      <resource-form-dialog
        v-if="hasRole('Admin') || hasRole('Educator')"
        :label="t('resources.addResource')"
        :sub-competency-id="subId"
        @create="createResource"
      />
    </div>

    <resource-table
      class="q-mt-md"
      :items="resources"
      :show-actions="hasRole('Admin') || hasRole('Educator')"
      @edit="updateResource"
      @delete="deleteResource"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import BreadcrumbHeader from 'src/components/common/BreadcrumbHeader.vue';
import { useUsers } from 'src/composables/useUsers';
import {
  type CompetencyResource,
  type CreateResourceInput,
  type UpdateResourceInput,
} from 'src/models/CompetencyResource';
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

import { resourceRepository } from 'src/models/repositories/ResourceRepository';
import { StudentProgressRepository } from 'src/models/repositories/StudentProgressRepository';
import { subCompetencyRepository } from 'src/models/repositories/SubCompetencyRepository';

import SubCompetencyCard from 'src/components/competency/SubCompetencyCard.vue';
import SubCompetencyForm from 'src/components/competency/SubCompetencyForm.vue';
import SubCompetencyStudentTable, {
  type SubCompetencyStudentRow,
} from 'src/components/competency/SubCompetencyStudentTable.vue';
import ResourceFormDialog from 'src/components/resource/ResourceFormDialog.vue';
import ResourceTable from 'src/components/resource/ResourceTable.vue';
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
const students = ref<User[]>([]);
const studentActionsLoading = ref(false);
const studentProgressUpdating = ref(false);
const resources = ref<CompetencyResource[]>([]);

const studentsLoading = computed(() => loading.value || studentActionsLoading.value);
const isStudent = computed(() => currentUser.value?.role === UserRole.STUDENT);
const studentProgress = computed<StudentSubCompetencyProgress | null>(() => {
  if (!isStudent.value || !currentUser.value?.studentProgress) return null;
  return (
    currentUser.value?.studentProgress.find(
      (progress) => progress.subCompetencyId === sub.value?.id,
    ) ?? null
  );
});

onMounted(async () => {
  await load();
  await loadCurrentUser();
  syncSubToCurrentUser();
  attachProgressToStudents();
  await autoAdvanceStudentProgress();
});

async function load(): Promise<void> {
  loading.value = true;
  try {
    const fetched = await subCompetencyRepository.findById(subId);
    sub.value = fetched;
    resources.value = fetched?.resources ?? [];
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
  if (!user) {
    students.value = [];
    return;
  }
}

function syncSubToCurrentUser(): void {
  if (!sub.value || !currentUser.value) return;
  if (currentUser.value.role === UserRole.STUDENT) {
    sub.value.attachUserProgress(currentUser.value);
  }
}

function attachProgressToStudents(): void {
  if (!sub.value || !currentUser.value || currentUser.value.role !== UserRole.EDUCATOR) {
    return;
  }
  const list = Array.isArray(currentUser.value.students) ? currentUser.value.students : [];
  list.forEach((student) => student.attachProgress(sub.value as SubCompetency));
  students.value = [...list];
}

function updateLocalProgressCache(student: User, progress: StudentSubCompetencyProgress): void {
  if (!sub.value) return;

  let progressIndex = sub.value.studentProgress.findIndex((entry) => entry.id === progress.id);
  if (progressIndex === -1) {
    sub.value.studentProgress.push(progress);
  } else {
    sub.value.studentProgress.splice(progressIndex, 1, progress);
  }

  progressIndex = student.studentProgress.findIndex((entry) => entry.id === progress.id);
  if (progressIndex === -1) {
    student.studentProgress.push(progress);
  } else {
    student.studentProgress.splice(progressIndex, 1, progress);
  }

  if (currentUser.value?.role === UserRole.EDUCATOR) {
    const educatorStudentIndex = currentUser.value.students.findIndex(
      (entry) => entry.id === student.id,
    );
    if (educatorStudentIndex !== -1) {
      currentUser.value.students.splice(educatorStudentIndex, 1, student);
    }
    const localIndex = students.value.findIndex((entry) => entry.id === student.id);
    if (localIndex !== -1) {
      students.value.splice(localIndex, 1, student);
    }
    students.value = [...students.value];
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
    updateLocalProgressCache(user, updated);
  } catch (error) {
    console.error('Failed to auto-start student progress', error);
  } finally {
    studentProgressUpdating.value = false;
  }
}

async function submitPendingValidation(): Promise<void> {
  if (!isStudent.value || studentProgressUpdating.value || !currentUser.value) return;
  const progress = studentProgress.value;
  if (!progress || progress.lockOverride === 'Locked' || progress.status !== 'InProgress') {
    return;
  }

  studentProgressUpdating.value = true;
  try {
    const updated = await StudentProgressRepository.updateProgress(progress.id, {
      status: 'PendingValidation',
    });
    updateLocalProgressCache(currentUser.value, updated);
    $q.notify({ type: 'positive', message: t('subCompetencies.pendingValidationSuccess') });
  } catch (error) {
    console.error('Failed to request validation', error);
    $q.notify({ type: 'negative', message: t('subCompetencies.progressUpdateError') });
  } finally {
    studentProgressUpdating.value = false;
  }
}

async function applyProgressUpdate(
  rows: SubCompetencyStudentRow[],
  builder: (progress: StudentSubCompetencyProgress) => StudentSubCompetencyProgressUpdate,
  successMessage: string,
): Promise<void> {
  if (!rows.length) return;

  studentActionsLoading.value = true;
  try {
    let updatedCount = 0;
    for (const row of rows) {
      const progress = row.progress;
      if (!progress) continue;

      const updates = builder(progress);
      if (!updates || Object.keys(updates).length === 0) {
        continue;
      }
      let updated;
      if (progress.local) {
        updated = await StudentProgressRepository.createProgress({ ...progress, ...updates });
      } else {
        updated = await StudentProgressRepository.updateProgress(progress.id, updates);
      }

      updateLocalProgressCache(row.student, updated);
      updatedCount += 1;
    }

    if (updatedCount > 0) {
      $q.notify({ type: 'positive', message: successMessage });
    }
  } catch (error) {
    console.error('Failed to update student progress', error);
    $q.notify({ type: 'negative', message: t('subCompetencies.progressUpdateError') });
  } finally {
    studentActionsLoading.value = false;
  }
}

async function handleUnlock(rows: SubCompetencyStudentRow[]): Promise<void> {
  await applyProgressUpdate(
    rows,
    (progress) => {
      const updates: StudentSubCompetencyProgressUpdate = {};
      if (progress.lockOverride !== 'Unlocked') {
        updates.lockOverride = 'Unlocked';
      }
      return updates;
    },
    t('subCompetencies.unlockSuccess'),
  );
}

async function handleRecommend(rows: SubCompetencyStudentRow[]): Promise<void> {
  await applyProgressUpdate(
    rows,
    (progress) => {
      const updates: StudentSubCompetencyProgressUpdate = {};
      if (!progress.recommended) {
        updates.recommended = true;
      }
      if (progress.lockOverride === 'Locked') {
        updates.lockOverride = 'Unlocked';
      }
      return updates;
    },
    t('subCompetencies.recommendSuccess'),
  );
}

async function handleLock(rows: SubCompetencyStudentRow[]): Promise<void> {
  await applyProgressUpdate(
    rows,
    (progress) => {
      const updates: StudentSubCompetencyProgressUpdate = {};
      if (progress.lockOverride !== 'Locked') {
        updates.lockOverride = 'Locked';
      }
      if (progress.recommended) {
        updates.recommended = false;
      }
      return updates;
    },
    t('subCompetencies.lockSuccess'),
  );
}

async function handleValidate(rows: SubCompetencyStudentRow[]): Promise<void> {
  await applyProgressUpdate(
    rows,
    (progress) => {
      const updates: StudentSubCompetencyProgressUpdate = {};
      if (progress.status !== 'Validated') {
        updates.status = 'Validated';
      }
      if (progress.lockOverride === 'Locked') {
        updates.lockOverride = 'Unlocked';
      }
      return updates;
    },
    t('subCompetencies.validateSuccess'),
  );
}

async function onSaveSub(updated: UpdateSubCompetencyInput): Promise<void> {
  await subCompetencyRepository.update(subId, updated);
  $q.notify({ type: 'positive', message: 'Sub-competency saved' });
  await load();
  editing.value = false;
}

async function createResource(payload: CreateResourceInput): Promise<void> {
  const created = await resourceRepository.create(payload);
  resources.value.push(created);
  $q.notify({ type: 'positive', message: 'CompetencyResource added' });
}

async function updateResource(payload: UpdateResourceInput): Promise<void> {
  if (!payload.id) return;
  const updatedResource = await resourceRepository.update(payload.id, payload);
  const idx = resources.value.findIndex((r) => r.id === payload.id);
  if (idx !== -1) resources.value[idx] = updatedResource;
  $q.notify({ type: 'positive', message: 'CompetencyResource updated' });
}

async function deleteResource(id: string): Promise<void> {
  await resourceRepository.delete(id);
  resources.value = resources.value.filter((r) => r.id !== id);
  $q.notify({ type: 'positive', message: 'CompetencyResource deleted' });
}
</script>

<script lang="ts">
export default { name: 'SubCompetencyEditorPage' };
</script>
