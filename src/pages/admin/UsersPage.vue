<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg">
      <q-icon name="admin_panel_settings" class="q-mr-sm" />
      {{ $t('admin.userManagement') }}
    </div>

    <!-- Action Bar -->
    <user-action-bar
      :search="searchQuery"
      :role-filter="roleFilter"
      :status-filter="statusFilter"
      :role-options="roleOptions"
      :status-options="statusOptions"
      @update:search="searchQuery = $event"
      @update:role-filter="roleFilter = $event"
      @update:status-filter="statusFilter = $event"
      @add-user="showAddUserDialog = true"
      @bulk-import="bulkImport"
    />

    <!-- Users Table -->
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

      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <status-indicator :status="props.value" />
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
            @reset-password="resetPassword"
            @toggle-status="toggleUserStatus"
            @view-activity="viewActivity"
            @delete="deleteUser"
          />
        </q-td>
      </template>

      <template v-slot:top-right v-if="selectedUsers.length > 0">
        <q-btn-group>
          <q-btn
            outline
            color="negative"
            icon="delete"
            :label="`${$t('common.delete')} (${selectedUsers.length})`"
            @click="bulkDelete"
          />
          <q-btn
            outline
            color="primary"
            icon="group"
            :label="$t('admin.changeRole')"
            @click="bulkChangeRole"
          />
        </q-btn-group>
      </template>
    </q-table>

    <!-- Statistics Cards -->
    <user-stats-cards :stats="userStats" />

    <!-- Add User Dialog -->
    <q-dialog v-model="showAddUserDialog">
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">{{ $t('admin.addNewUser') }}</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="addUser" class="q-gutter-md">
            <div class="row q-gutter-md">
              <div class="col">
                <q-input
                  v-model="newUser.firstName"
                  filled
                  :label="`${$t('common.firstName')} *`"
                  :rules="[(val) => !!val || $t('validation.firstNameRequired')]"
                />
              </div>
              <div class="col">
                <q-input
                  v-model="newUser.lastName"
                  filled
                  :label="`${$t('common.lastName')} *`"
                  :rules="[(val) => !!val || $t('validation.lastNameRequired')]"
                />
              </div>
            </div>

            <q-input
              v-model="newUser.email"
              filled
              type="email"
              :label="`${$t('common.email')} *`"
              :rules="[(val) => !!val || $t('validation.emailRequired')]"
            />

            <q-select
              v-model="newUser.role"
              filled
              :options="roleOptions"
              :label="`${$t('common.role')} *`"
              :rules="[(val) => !!val || $t('validation.roleRequired')]"
            />

            <q-input
              v-model="newUser.username"
              filled
              :label="$t('common.username')"
              :hint="$t('admin.usernameHint')"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" @click="showAddUserDialog = false" />
          <q-btn
            color="primary"
            :label="$t('admin.addUser')"
            @click="addUser"
            :disable="!isNewUserValid"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import LastActiveCell from 'src/components/admin/LastActiveCell.vue';
import UserActionBar from 'src/components/admin/UserActionBar.vue';
import UserActions from 'src/components/admin/UserActions.vue';
import UserStatsCards from 'src/components/admin/UserStatsCards.vue';
import RoleChip from 'src/components/ui/RoleChip.vue';
import StatusIndicator from 'src/components/ui/StatusIndicator.vue';
import UserAvatar from 'src/components/ui/UserAvatar.vue';
import { computed, ref } from 'vue';

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'Student' | 'Educator' | 'Parent' | 'Admin';
  status: 'Active' | 'Inactive' | 'Suspended';
  lastActive: string;
  createdDate: string;
  avatar?: string;
}

interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
}

const searchQuery = ref('');
const roleFilter = ref<string | null>(null);
const statusFilter = ref<string | null>(null);
const selectedUsers = ref<User[]>([]);
const showAddUserDialog = ref(false);

const newUser = ref<NewUser>({
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  role: '',
});

const roleOptions = ['Student', 'Educator', 'Parent', 'Admin'];
const statusOptions = ['Active', 'Inactive', 'Suspended'];

const columns = [
  { name: 'avatar', label: '', field: 'avatar', align: 'center' as const },
  { name: 'name', label: 'Name', field: 'name', align: 'left' as const, sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left' as const, sortable: true },
  {
    name: 'username',
    label: 'Username',
    field: 'username',
    align: 'left' as const,
    sortable: true,
  },
  { name: 'role', label: 'Role', field: 'role', align: 'center' as const, sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center' as const, sortable: true },
  {
    name: 'lastActive',
    label: 'Last Active',
    field: 'lastActive',
    align: 'center' as const,
    sortable: true,
  },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' as const },
];

// Mock data
const users = ref<User[]>([
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@school.edu',
    username: 'jsmith',
    role: 'Educator',
    status: 'Active',
    lastActive: '2024-01-15T10:30:00Z',
    createdDate: '2023-08-15',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@parent.com',
    username: 'sjohnson',
    role: 'Parent',
    status: 'Active',
    lastActive: '2024-01-14T15:45:00Z',
    createdDate: '2023-09-01',
  },
  {
    id: '3',
    name: 'Emma Davis',
    email: 'emma.davis@student.edu',
    username: 'edavis',
    role: 'Student',
    status: 'Active',
    lastActive: '2024-01-15T09:15:00Z',
    createdDate: '2023-09-15',
  },
]);

const userStats = ref({
  total: 1247,
  active: 1156,
  newThisMonth: 23,
  onlineNow: 89,
});

const filteredUsers = computed(() => {
  return users.value.filter((user) => {
    const matchesSearch =
      !searchQuery.value ||
      user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesRole = !roleFilter.value || user.role === roleFilter.value;
    const matchesStatus = !statusFilter.value || user.status === statusFilter.value;

    return matchesSearch && matchesRole && matchesStatus;
  });
});

const isNewUserValid = computed(() => {
  return (
    newUser.value.firstName && newUser.value.lastName && newUser.value.email && newUser.value.role
  );
});

function viewUser(user: User): void {
  console.log('Viewing user:', user.name);
}

function editUser(user: User): void {
  console.log('Editing user:', user.name);
}

function resetPassword(user: User): void {
  console.log('Resetting password for:', user.name);
}

function toggleUserStatus(user: User): void {
  console.log('Toggling status for:', user.name);
}

function viewActivity(user: User): void {
  console.log('Viewing activity for:', user.name);
}

function deleteUser(user: User): void {
  console.log('Deleting user:', user.name);
}

function bulkDelete(): void {
  console.log('Bulk deleting users:', selectedUsers.value);
}

function bulkChangeRole(): void {
  console.log('Bulk changing role for users:', selectedUsers.value);
}

function bulkImport(): void {
  console.log('Bulk importing users');
}

function addUser(): void {
  if (!isNewUserValid.value) return;

  console.log('Adding new user:', newUser.value);
  // Reset form
  newUser.value = {
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    role: '',
  };
  showAddUserDialog.value = false;
}
</script>
