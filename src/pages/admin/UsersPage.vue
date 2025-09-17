<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg">
      <q-icon name="admin_panel_settings" class="q-mr-sm" />
      {{ $t('admin.userManagement') }}
    </div>

    <user-action-bar
      :search="searchQuery"
      :role-filter="roleFilter"
      :role-options="roleOptions"
      @update:search="searchQuery = $event"
      @update:role-filter="onRoleFilterUpdate"
    />

    <q-table
      :rows="filteredUsers"
      :columns="columns"
      row-key="id"
      :pagination="{ rowsPerPage: 15 }"
      flat
      bordered
      selection="multiple"
      v-model:selected="selectedUsers"
    >
      <template v-slot:body-cell-avatar="props">
        <q-td :props="props">
          <user-avatar :user="props.row" />
        </q-td>
      </template>

      <template v-slot:body-cell-role="props">
        <q-td :props="props">
          <role-chip :role="props.value" />
        </q-td>
      </template>

      <template v-slot:body-cell-lastActive="props">
        <q-td :props="props">
          <last-active-cell :last-active="props.value" />
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <user-actions :user="props.row" @view="viewUser" @edit="editUser" />
        </q-td>
      </template>

      <template v-slot:top-right v-if="selectedUsers.length > 0">
        <q-btn
          outline
          color="primary"
          icon="group"
          :label="$t('admin.changeRole')"
          :loading="bulkRoleLoading"
          :disable="bulkRoleLoading"
          @click="bulkChangeRole"
        />
      </template>
    </q-table>

    <user-stats-cards :users="users" />

    <user-details-dialog
      v-model="showUserDialog"
      :user="selectedUserForDialog"
      :all-users="users"
      :current-educator-id="currentEducatorId"
      :can-manage-parents="canManageParents"
      :can-manage-educators="canManageEducators"
      @close="closeUserDialog"
      @add-educator="handleAddEducator"
      @remove-educator="handleRemoveEducator"
      @assign-parent="handleAssignParent"
      @remove-parent="handleRemoveParent"
      @assign-educator="handleAssignEducatorFromDialog"
      @unassign-educator="handleUnassignEducatorFromDialog"
    />

    <edit-user-dialog
      v-model="showEditDialog"
      :user="selectedUserForEdit"
      :role-options="roleOptions"
      @cancel="handleEditCanceled"
      @save="handleEditSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import EditUserDialog from 'src/components/admin/EditUserDialog.vue';
import LastActiveCell from 'src/components/admin/LastActiveCell.vue';
import UserActionBar from 'src/components/admin/UserActionBar.vue';
import UserActions from 'src/components/admin/UserActions.vue';
import UserDetailsDialog from 'src/components/admin/UserDetailsDialog.vue';
import UserStatsCards from 'src/components/admin/UserStatsCards.vue';
import RoleChip from 'src/components/ui/RoleChip.vue';
import UserAvatar from 'src/components/ui/UserAvatar.vue';
import { useAuth } from 'src/composables/useAuth';
import { useUsers } from 'src/composables/useUsers';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import type { User as UserModel } from 'src/models/User';
import { UserRole } from 'src/models/User';

type User = UserModel;

interface EditableUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  picture?: string | null;
  contactInfo?: string | null;
}

const $q = useQuasar();
const { t } = useI18n();

const searchQuery = ref('');
const roleFilter = ref<UserRole | null>(null);
const selectedUsers = ref<User[]>([]);
const users = ref<User[]>([]);
const showUserDialog = ref(false);
const selectedUserForDialog = ref<User | null>(null);
const showEditDialog = ref(false);
const selectedUserForEdit = ref<EditableUser | null>(null);
const bulkRoleLoading = ref(false);

const roleOptions = [UserRole.STUDENT, UserRole.PARENT, UserRole.EDUCATOR];

const columns = [
  { name: 'avatar', label: '', field: 'avatar', align: 'center' as const },
  { name: 'name', label: 'Name', field: 'name', align: 'left' as const, sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left' as const, sortable: true },
  { name: 'role', label: 'Role', field: 'role', align: 'center' as const, sortable: true },
  {
    name: 'lastActive',
    label: 'Last Active',
    field: 'lastActive',
    align: 'center' as const,
    sortable: true,
  },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' as const },
];

const {
  fetchUsers,
  updateUser,
  addUserToGroup,
  assignParentToStudent,
  removeParentFromStudent,
  assignEducatorToStudent,
  unassignEducatorFromStudent,
  error,
} = useUsers();

const { userId, hasRole } = useAuth();

const currentEducatorId = computed(() => {
  if (!hasRole(UserRole.EDUCATOR)) {
    return null;
  }
  const id = userId.value;
  return id && id !== 'undefined' ? id : null;
});
const canManageParents = computed(() => hasRole(UserRole.ADMIN));
const canManageEducators = computed(() => hasRole(UserRole.ADMIN));

onMounted(async () => {
  users.value = await fetchUsers();
});

const filteredUsers = computed(() => {
  return users.value.filter((user) => {
    const matchesSearch =
      !searchQuery.value ||
      user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesRole = !roleFilter.value || user.role === roleFilter.value;
    return matchesSearch && matchesRole;
  });
});

function onRoleFilterUpdate(val: string | null): void {
  roleFilter.value = (val as UserRole) ?? null;
}

function updateUserInState(updatedUser: User | null): void {
  if (!updatedUser) {
    return;
  }
  const index = users.value.findIndex((candidate) => candidate.id === updatedUser.id);
  if (index !== -1) {
    users.value.splice(index, 1, updatedUser);
  } else {
    users.value.push(updatedUser);
  }
}

function updateDialogUser(updatedUser: User | null): void {
  if (!updatedUser || !selectedUserForDialog.value) {
    return;
  }
  if (selectedUserForDialog.value.id === updatedUser.id) {
    selectedUserForDialog.value = updatedUser;
  }
}

function viewUser(user: User): void {
  selectedUserForDialog.value = user;
  showUserDialog.value = true;
}

function editUser(user: User): void {
  selectedUserForEdit.value = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar ?? null,
    picture: user.picture ?? null,
    contactInfo: user.contactInfo ?? null,
  };
  showEditDialog.value = true;
}

async function handleEditSaved(payload: {
  id: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  picture: string | null;
  contactInfo: string;
}): Promise<void> {
  const updatedUser = await updateUser(payload.id, {
    name: payload.name,
    role: payload.role,
    avatar: payload.avatar ?? null,
    picture: payload.picture ?? null,
    contactInfo: payload.contactInfo === '' ? null : payload.contactInfo,
  });

  if (updatedUser) {
    updateUserInState(updatedUser);
    updateDialogUser(updatedUser);
  }

  selectedUserForEdit.value = null;
  showEditDialog.value = false;
}

function handleEditCanceled(): void {
  selectedUserForEdit.value = null;
  showEditDialog.value = false;
}

async function handleAssignParent(payload: { studentId: string; parentId: string }): Promise<void> {
  const { student, parent } = await assignParentToStudent(payload.studentId, payload.parentId);

  if (!student) {
    $q.notify({
      type: 'negative',
      message: error.value ?? t('educator.assignParentError'),
      position: 'top',
    });
    return;
  }

  updateUserInState(student);
  updateUserInState(parent);
  updateDialogUser(student);

  $q.notify({
    type: 'positive',
    message: t('educator.parentAssignSuccess'),
    position: 'top',
  });
}

async function handleAddEducator(payload: {
  studentId: string;
  educatorId: string;
}): Promise<void> {
  const { student, educator } = await assignEducatorToStudent(
    payload.studentId,
    payload.educatorId,
  );

  if (!student) {
    $q.notify({
      type: 'negative',
      message: error.value ?? t('educator.assignEducatorError'),
      position: 'top',
    });
    return;
  }

  updateUserInState(student);
  updateUserInState(educator);
  updateDialogUser(student);

  $q.notify({
    type: 'positive',
    message: t('educator.assignEducatorSuccess'),
    position: 'top',
  });
}

async function handleRemoveParent(payload: { studentId: string; parentId: string }): Promise<void> {
  const { student, parent } = await removeParentFromStudent(payload.studentId, payload.parentId);

  if (!student) {
    $q.notify({
      type: 'negative',
      message: error.value ?? t('educator.removeParentError'),
      position: 'top',
    });
    return;
  }

  updateUserInState(student);
  updateUserInState(parent);
  updateDialogUser(student);

  $q.notify({
    type: 'positive',
    message: t('educator.parentRemoveSuccess'),
    position: 'top',
  });
}

async function handleRemoveEducator(payload: {
  studentId: string;
  educatorId: string;
}): Promise<void> {
  const { student, educator } = await unassignEducatorFromStudent(
    payload.studentId,
    payload.educatorId,
  );

  if (!student) {
    $q.notify({
      type: 'negative',
      message: error.value ?? t('educator.removeEducatorError'),
      position: 'top',
    });
    return;
  }

  updateUserInState(student);
  updateUserInState(educator);
  updateDialogUser(student);

  $q.notify({
    type: 'positive',
    message: t('educator.removeEducatorSuccess'),
    position: 'top',
  });
}

async function handleAssignEducatorFromDialog(studentId: string): Promise<void> {
  if (!currentEducatorId.value) {
    $q.notify({ type: 'warning', message: t('educator.missingEducatorId'), position: 'top' });
    return;
  }

  const { student, educator } = await assignEducatorToStudent(studentId, currentEducatorId.value);

  if (!student) {
    $q.notify({
      type: 'negative',
      message: error.value ?? t('educator.assignError'),
      position: 'top',
    });
    return;
  }

  updateUserInState(student);
  updateUserInState(educator);
  updateDialogUser(student);

  $q.notify({ type: 'positive', message: t('educator.assignSuccess'), position: 'top' });
}

async function handleUnassignEducatorFromDialog(studentId: string): Promise<void> {
  if (!currentEducatorId.value) {
    $q.notify({ type: 'warning', message: t('educator.missingEducatorId'), position: 'top' });
    return;
  }

  const { student, educator } = await unassignEducatorFromStudent(
    studentId,
    currentEducatorId.value,
  );

  if (!student) {
    $q.notify({
      type: 'negative',
      message: error.value ?? t('educator.unassignError'),
      position: 'top',
    });
    return;
  }

  updateUserInState(student);
  updateUserInState(educator);
  updateDialogUser(student);

  $q.notify({ type: 'positive', message: t('educator.unassignSuccess'), position: 'top' });
}

async function performBulkRoleChange(targetRole: UserRole): Promise<void> {
  const targets = selectedUsers.value.filter((user) => user.role !== targetRole);

  if (targets.length === 0) {
    $q.notify({
      type: 'info',
      message: t('admin.bulkRoleNoChanges'),
      position: 'top',
    });
    return;
  }

  bulkRoleLoading.value = true;
  const updatedUsers: User[] = [];
  const failedIds = new Set<string>();
  const failedNames = new Set<string>();

  try {
    for (const user of targets) {
      try {
        const result = await addUserToGroup(user.id, targetRole);
        if (result) {
          updatedUsers.push(result);
        } else {
          failedIds.add(user.id);
          failedNames.add(user.name);
        }
      } catch (error) {
        console.error('Failed to update role for user', user.id, error);
        failedIds.add(user.id);
        failedNames.add(user.name);
      }
    }
  } finally {
    bulkRoleLoading.value = false;
  }

  updatedUsers.forEach((updatedUser) => {
    const index = users.value.findIndex((candidate) => candidate.id === updatedUser.id);
    if (index !== -1) {
      users.value.splice(index, 1, updatedUser);
    }
  });

  if (failedIds.size === 0) {
    selectedUsers.value = [];
    $q.notify({
      type: 'positive',
      message: t('admin.bulkRoleSuccess', { count: updatedUsers.length }),
      position: 'top',
    });
    return;
  }

  selectedUsers.value = users.value.filter((user) => failedIds.has(user.id));

  if (updatedUsers.length > 0) {
    $q.notify({
      type: 'warning',
      message: t('admin.bulkRolePartial', {
        success: updatedUsers.length,
        failed: failedIds.size,
      }),
      caption: Array.from(failedNames).join(', '),
      position: 'top',
    });
  } else {
    $q.notify({
      type: 'negative',
      message: t('admin.bulkRoleError'),
      position: 'top',
    });
  }
}

function bulkChangeRole(): void {
  if (roleOptions.length === 0) {
    return;
  }
  selectedUserForDialog.value = null;

  const fallbackRole = roleOptions[0] ?? UserRole.STUDENT;
  const initialRoleCandidate = selectedUsers.value[0]?.role;
  const dialogDefaultRole =
    initialRoleCandidate && roleOptions.includes(initialRoleCandidate)
      ? initialRoleCandidate
      : fallbackRole;

  $q.dialog({
    title: t('admin.changeRole'),
    message: t('admin.changeRolePrompt', { count: selectedUsers.value.length }),
    cancel: true,
    persistent: true,
    options: {
      type: 'radio',
      model: dialogDefaultRole,
      items: roleOptions.map((role) => ({
        label: role,
        value: role,
      })),
    },
  }).onOk((newRole: UserRole) => {
    performBulkRoleChange(newRole).catch((error) => {
      console.error('Bulk role change failed unexpectedly', error);
      $q.notify({
        type: 'negative',
        message: t('admin.bulkRoleError'),
        position: 'top',
      });
    });
  });
}

function closeUserDialog(): void {
  showUserDialog.value = false;
  selectedUserForDialog.value = null;
}

watch(showUserDialog, (isOpen) => {
  if (!isOpen) {
    selectedUserForDialog.value = null;
  }
});

watch(showEditDialog, (isOpen) => {
  if (!isOpen) {
    selectedUserForEdit.value = null;
  }
});
</script>
