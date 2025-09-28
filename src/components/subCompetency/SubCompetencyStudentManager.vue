<template>
  <div v-if="canManage">
    <q-separator class="q-my-lg" />
    <sub-competency-student-table
      :students="students"
      :loading="studentsLoading"
      @unlock="handleUnlock"
      @recommend="handleRecommend"
      @lock="handleLock"
      @validate="handleValidate"
    />
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuth } from 'src/composables/useAuth';
import { useUsers } from 'src/composables/useUsers';
import SubCompetencyStudentTable, {
  type SubCompetencyStudentRow,
} from 'src/components/competency/SubCompetencyStudentTable.vue';
import type { SubCompetency } from 'src/models/SubCompetency';
import { StudentProgressRepository } from 'src/models/repositories/StudentProgressRepository';
import type {
  StudentSubCompetencyProgress,
  StudentSubCompetencyProgressUpdate,
} from 'src/models/StudentSubCompetencyProgress';
import type { User } from 'src/models/User';
import { UserRole } from 'src/models/User';

const subModel = defineModel<SubCompetency | null>('sub', { default: null });

const { hasRole } = useAuth();
const { getCurrentUser } = useUsers();
const { t } = useI18n();
const $q = useQuasar();

const canManage = computed(() => hasRole('Educator'));
const currentUser = ref<User | null>(null);
const students = ref<User[]>([]);
const studentActionsLoading = ref(false);

const studentsLoading = computed(() => studentActionsLoading.value);

watch(
  () => subModel.value,
  () => {
    if (!canManage.value) return;
    attachProgressToStudents();
  },
  { immediate: true },
);

watch(
  () => currentUser.value,
  () => {
    if (!canManage.value) return;
    attachProgressToStudents();
  },
);

onMounted(async () => {
  if (!canManage.value) return;
  currentUser.value = await getCurrentUser();
  attachProgressToStudents();
});

function attachProgressToStudents(): void {
  if (!canManage.value) return;
  const sub = subModel.value;
  if (!sub || !currentUser.value) {
    students.value = [];
    return;
  }

  const list = Array.isArray(currentUser.value.students) ? currentUser.value.students : [];
  list.forEach((student) => student.attachProgress(sub));
  students.value = [...list];
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
      const updated = progress.local
        ? await StudentProgressRepository.createProgress({ ...progress, ...updates })
        : await StudentProgressRepository.updateProgress(progress.id, updates);

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

function updateLocalProgressCache(student: User, progress: StudentSubCompetencyProgress): void {
  const sub = subModel.value;
  if (!sub) return;

  let progressIndex = sub.studentProgress.findIndex((entry) => entry.id === progress.id);
  if (progressIndex === -1) {
    sub.studentProgress.push(progress);
  } else {
    sub.studentProgress.splice(progressIndex, 1, progress);
  }

  progressIndex = student.studentProgress.findIndex((entry) => entry.id === progress.id);
  if (progressIndex === -1) {
    student.studentProgress.push(progress);
  } else {
    student.studentProgress.splice(progressIndex, 1, progress);
  }

  if (currentUser.value?.role === UserRole.EDUCATOR && Array.isArray(currentUser.value.students)) {
    const educatorStudentIndex = currentUser.value.students.findIndex(
      (entry) => entry.id === student.id,
    );
    if (educatorStudentIndex !== -1) {
      currentUser.value.students.splice(educatorStudentIndex, 1, student);
    }
  }

  const localIndex = students.value.findIndex((entry) => entry.id === student.id);
  if (localIndex !== -1) {
    students.value.splice(localIndex, 1, student);
  } else {
    students.value.push(student);
  }
  students.value = [...students.value];
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
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SubCompetencyStudentManager',
});
</script>
