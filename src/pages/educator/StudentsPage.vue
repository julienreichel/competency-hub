<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg row items-center q-gutter-sm">
      <q-icon name="groups" />
      <span>{{ $t('educator.myStudentsTitle') }}</span>
    </div>

    <q-card flat bordered>
      <q-card-section class="row items-center q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-input
            v-model="searchTerm"
            :label="$t('educator.searchStudents')"
            filled
            dense
            clearable
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <div class="col-auto">
          <q-btn
            outline
            color="primary"
            icon="refresh"
            :label="$t('common.refresh')"
            :loading="loading"
            @click="refreshUsers"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-tabs v-model="activeTab" align="justify" class="text-primary">
        <q-tab name="my" icon="person" :label="$t('educator.myStudentsTab')" />
        <q-tab name="all" icon="diversity_3" :label="$t('educator.allStudentsTab')" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel name="my" class="q-pa-none">
          <student-assignments-table
            :students="filteredMyStudents"
            :user-map="userMap"
            :loading="loading"
            :current-educator-id="currentEducatorId"
            :assigned-student-ids="assignedStudentIds"
            :empty-label="$t('educator.noMyStudents')"
            @assign="handleAssign"
            @unassign="handleUnassign"
            @view="openStudentDialog"
          />
        </q-tab-panel>

        <q-tab-panel name="all" class="q-pa-none">
          <student-assignments-table
            :students="filteredAllStudents"
            :user-map="userMap"
            :loading="loading"
            :current-educator-id="currentEducatorId"
            :assigned-student-ids="assignedStudentIds"
            :empty-label="$t('educator.noStudentsFound')"
            @assign="handleAssign"
            @unassign="handleUnassign"
            @view="openStudentDialog"
          />
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <user-details-dialog
      v-model="showStudentDialog"
      :user="selectedStudentForDialog"
      :all-users="allUsers"
      :can-manage-parents="false"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import StudentAssignmentsTable from 'src/components/educator/StudentAssignmentsTable.vue';
import UserDetailsDialog from 'src/components/ui/UserDetailsDialog.vue';
import { useAuth } from 'src/composables/useAuth';
import { useUsers } from 'src/composables/useUsers';
import type { User } from 'src/models/User';
import { UserRole } from 'src/models/User';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const activeTab = ref<'my' | 'all'>('my');
const searchTerm = ref('');
const allUsers = ref<User[]>([]);
const showStudentDialog = ref(false);
const selectedStudentForDialog = ref<User | null>(null);
const currentEducator = ref<User | null>(null);
const dialogLoading = ref(false);

const {
  assignEducatorToStudent,
  unassignEducatorFromStudent,
  fetchUsers,
  getUserById,
  loading,
  error,
} = useUsers();
const { userId } = useAuth();
const $q = useQuasar();
const { t } = useI18n();

const currentEducatorId = computed(() => {
  const id = userId.value;
  return id && id !== 'undefined' ? id : null;
});

const userMap = computed<Map<string, User>>(
  () => new Map<string, User>(allUsers.value.map((user) => [user.id, user] as [string, User])),
);

const students = computed<User[]>(
  () => allUsers.value.filter((user) => user.role === UserRole.STUDENT) as User[],
);

const assignedStudentIds = computed<string[]>(() => currentEducator.value?.studentIds ?? []);

const assignedStudentSet = computed<Set<string>>(() => new Set(assignedStudentIds.value));

const myStudents = computed<User[]>(() => {
  if (assignedStudentIds.value.length === 0) {
    return [];
  }

  return assignedStudentIds.value
    .map((id) => userMap.value.get(id) ?? null)
    .filter(
      (candidate): candidate is User => candidate !== null && candidate.role === UserRole.STUDENT,
    );
});

const normalizedSearch = computed(() => searchTerm.value.trim().toLowerCase());

function filterBySearch(collection: User[]): User[] {
  if (!normalizedSearch.value) {
    return collection;
  }
  return collection.filter((student) => {
    const haystack = `${student.name} ${student.email}`.toLowerCase();
    return haystack.includes(normalizedSearch.value);
  });
}

const filteredMyStudents = computed<User[]>(() => filterBySearch(myStudents.value));
const filteredAllStudents = computed<User[]>(() => {
  const available = students.value.filter((student) =>
    currentEducatorId.value ? !assignedStudentSet.value.has(student.id) : true,
  );
  return filterBySearch(available);
});

async function loadUsers(): Promise<void> {
  const fetched = await fetchUsers();
  allUsers.value = fetched;
}

function mergeUsersIntoState(users: User[] | undefined): void {
  users?.forEach((user) => {
    updateUserInState(user);
  });
}

async function loadCurrentEducator(): Promise<void> {
  const id = currentEducatorId.value;
  if (!id) {
    currentEducator.value = null;
    return;
  }

  try {
    const educator = await getUserById(id);
    if (!educator) {
      currentEducator.value = null;
      return;
    }

    currentEducator.value = educator;
    updateUserInState(educator);
    mergeUsersIntoState(educator.students);
  } catch (err) {
    console.error('Failed to load educator details', err);
  }
}

async function refreshUsers(): Promise<void> {
  await loadUsers();
  await loadCurrentEducator();
  if (error.value) {
    $q.notify({ type: 'negative', message: error.value, position: 'top' });
  } else {
    $q.notify({ type: 'positive', message: t('educator.refreshSuccess'), position: 'top' });
  }
}

function updateUserInState(updated: User | null): void {
  if (!updated) return;
  const index = allUsers.value.findIndex((candidate) => candidate.id === updated.id);
  if (index !== -1) {
    allUsers.value.splice(index, 1, updated);
  } else {
    allUsers.value.push(updated);
  }

  if (currentEducator.value?.id === updated.id) {
    currentEducator.value = updated;
    mergeUsersIntoState(updated.students);
  }
}

function updateDialogUser(updated: User | null): void {
  if (!updated || !selectedStudentForDialog.value) {
    return;
  }
  if (selectedStudentForDialog.value.id === updated.id) {
    selectedStudentForDialog.value = updated;
  }
  if (currentEducator.value?.id === updated.id) {
    currentEducator.value = updated;
    mergeUsersIntoState(updated.students);
  }
}

async function handleAssign(studentId: string): Promise<void> {
  if (!currentEducatorId.value) {
    $q.notify({ type: 'warning', message: t('educator.missingEducatorId'), position: 'top' });
    return;
  }
  const { student, educator } = await assignEducatorToStudent(studentId, currentEducatorId.value);
  if (!student) {
    if (error.value) {
      $q.notify({ type: 'negative', message: error.value, position: 'top' });
    }
    return;
  }
  updateUserInState(student);
  updateUserInState(educator);
  updateDialogUser(student);
  $q.notify({ type: 'positive', message: t('educator.assignSuccess'), position: 'top' });
}

async function handleUnassign(studentId: string): Promise<void> {
  if (!currentEducatorId.value) {
    $q.notify({ type: 'warning', message: t('educator.missingEducatorId'), position: 'top' });
    return;
  }
  const { student, educator } = await unassignEducatorFromStudent(
    studentId,
    currentEducatorId.value,
  );
  if (!student) {
    if (error.value) {
      $q.notify({ type: 'negative', message: error.value, position: 'top' });
    }
    return;
  }
  updateUserInState(student);
  updateUserInState(educator);
  updateDialogUser(student);
  $q.notify({ type: 'positive', message: t('educator.unassignSuccess'), position: 'top' });
}

function openStudentDialog(studentId: string): void {
  const cached = userMap.value.get(studentId);
  if (cached) {
    selectedStudentForDialog.value = cached;
  }
  showStudentDialog.value = true;
  void loadDetailedStudent(studentId);
}

async function loadDetailedStudent(studentId: string): Promise<void> {
  dialogLoading.value = true;
  try {
    const detailed = await getUserById(studentId);
    if (!detailed) {
      return;
    }
    updateUserInState(detailed);
    updateDialogUser(detailed);
    selectedStudentForDialog.value = detailed;
  } catch (err) {
    console.error('Failed to load student details', err);
  } finally {
    dialogLoading.value = false;
  }
}

onMounted(async () => {
  await loadUsers();
  await loadCurrentEducator();
});

watch(currentEducatorId, () => {
  void loadCurrentEducator();
});
</script>
