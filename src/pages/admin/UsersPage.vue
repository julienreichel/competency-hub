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
          <user-actions
            :user="props.row"
            @view="viewUser"
            @edit="editUser"
            @view-activity="viewActivity"
          />
        </q-td>
      </template>

      <template v-slot:top-right v-if="selectedUsers.length > 0">
        <q-btn
          outline
          color="primary"
          icon="group"
          :label="$t('admin.changeRole')"
          @click="bulkChangeRole"
        />
      </template>
    </q-table>

    <user-stats-cards :users="users" />

    <user-details-dialog
      v-model="showUserDialog"
      :user="selectedUserForDialog"
      @close="closeUserDialog"
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
import EditUserDialog from 'src/components/admin/EditUserDialog.vue';
import LastActiveCell from 'src/components/admin/LastActiveCell.vue';
import UserActionBar from 'src/components/admin/UserActionBar.vue';
import UserActions from 'src/components/admin/UserActions.vue';
import UserDetailsDialog from 'src/components/admin/UserDetailsDialog.vue';
import UserStatsCards from 'src/components/admin/UserStatsCards.vue';
import RoleChip from 'src/components/ui/RoleChip.vue';
import UserAvatar from 'src/components/ui/UserAvatar.vue';
import { useUsers } from 'src/composables/useUsers';
import { computed, onMounted, ref, watch } from 'vue';

import type { User as UserModel } from 'src/models/User';
import { UserRole } from 'src/models/User';

type User = UserModel;

interface EditableUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  contactInfo?: string | null;
}

const searchQuery = ref('');
const roleFilter = ref<UserRole | null>(null);
const selectedUsers = ref<User[]>([]);
const users = ref<User[]>([]);
const showUserDialog = ref(false);
const selectedUserForDialog = ref<User | null>(null);
const showEditDialog = ref(false);
const selectedUserForEdit = ref<EditableUser | null>(null);

const roleOptions = [UserRole.STUDENT, UserRole.EDUCATOR, UserRole.PARENT];

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

const { fetchUsers, updateUser } = useUsers();

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
    contactInfo: user.contactInfo ?? null,
  };
  showEditDialog.value = true;
}

async function handleEditSaved(payload: {
  id: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  contactInfo: string;
}): Promise<void> {
  const updatedUser = await updateUser(payload.id, {
    name: payload.name,
    role: payload.role,
    avatar: payload.avatar ?? null,
    contactInfo: payload.contactInfo === '' ? null : payload.contactInfo,
  });

  if (updatedUser) {
    const index = users.value.findIndex((candidate) => candidate.id === updatedUser.id);
    if (index !== -1) {
      users.value.splice(index, 1, updatedUser);
    }
    if (selectedUserForDialog.value?.id === updatedUser.id) {
      selectedUserForDialog.value = updatedUser;
    }
  }

  selectedUserForEdit.value = null;
  showEditDialog.value = false;
}

function handleEditCanceled(): void {
  selectedUserForEdit.value = null;
  showEditDialog.value = false;
}

function viewActivity(user: User): void {
  console.log('Viewing activity for:', user.name);
}

function bulkChangeRole(): void {
  console.log(
    'Bulk changing role for:',
    selectedUsers.value.map((user) => user.name),
  );
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
