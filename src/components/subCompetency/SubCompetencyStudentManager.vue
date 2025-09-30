<template>
  <div v-if="canManage">
    <q-separator class="q-my-lg" />
    <student-progress-table
      variant="manager"
      :rows="tableRows"
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
import StudentProgressTable from 'src/components/educator/StudentProgressTable.vue';
import type { StudentProgressRow } from 'src/components/educator/studentProgressTypes';
import { useAuth } from 'src/composables/useAuth';
import { createManagerRows, useStudentProgressActions } from 'src/composables/useStudentProgress';
import { useUsers } from 'src/composables/useUsers';
import type {
  StudentSubCompetencyProgress,
  StudentSubCompetencyProgressUpdate,
} from 'src/models/StudentSubCompetencyProgress';
import type { SubCompetency } from 'src/models/SubCompetency';
import type { User } from 'src/models/User';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

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

const tableRows = computed<StudentProgressRow[]>(() =>
  subModel.value ? createManagerRows(students.value, subModel.value) : [],
);

const { applyUpdates } = useStudentProgressActions({
  students,
  currentEducator: currentUser,
  sub: subModel,
});

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
  rows: StudentProgressRow[],
  builder: (progress: StudentSubCompetencyProgress) => StudentSubCompetencyProgressUpdate,
  successMessage: string,
): Promise<void> {
  if (!rows.length) return;

  studentActionsLoading.value = true;
  try {
    const updatedCount = await applyUpdates(rows, builder);

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

async function handleUnlock(rows: StudentProgressRow[]): Promise<void> {
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

async function handleRecommend(rows: StudentProgressRow[]): Promise<void> {
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

async function handleLock(rows: StudentProgressRow[]): Promise<void> {
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

async function handleValidate(rows: StudentProgressRow[]): Promise<void> {
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
