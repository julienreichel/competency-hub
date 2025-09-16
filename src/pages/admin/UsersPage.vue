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
      @update:role-filter="onRoleFilterUpdate"
      @update:status-filter="onStatusFilterUpdate"
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
            @toggle-status="toggleUserStatus"
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

    <!-- Statistics Cards -->
    <user-stats-cards :stats="userStats" />
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
import { useUsers } from 'src/composables/useUsers';
import { computed, onMounted, ref } from 'vue';

import type { User as UserModel } from 'src/models/User';
import { UserRole, UserStatus } from 'src/models/User';
type User = UserModel;

const searchQuery = ref('');
const roleFilter = ref<UserRole | null>(null);
const statusFilter = ref<UserStatus | null>(null);
const selectedUsers = ref<User[]>([]);
const users = ref<User[]>([]);

const roleOptions = [UserRole.STUDENT, UserRole.EDUCATOR, UserRole.PARENT];
const statusOptions = [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED];

const columns = [
  { name: 'avatar', label: '', field: 'avatar', align: 'center' as const },
  { name: 'name', label: 'Name', field: 'name', align: 'left' as const, sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left' as const, sortable: true },
  // Username column removed
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

// Real user data

const { fetchUsers } = useUsers();

function onRoleFilterUpdate(val: string | null): void {
  roleFilter.value = (val as UserRole) ?? null;
}

function onStatusFilterUpdate(val: string | null): void {
  statusFilter.value = (val as UserStatus) ?? null;
}

onMounted(async () => {
  users.value = await fetchUsers();
});

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
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesRole = !roleFilter.value || user.role === roleFilter.value;
    const matchesStatus = !statusFilter.value || user.status === statusFilter.value;

    return matchesSearch && matchesRole && matchesStatus;
  });
});

function viewUser(user: User): void {
  console.log('Viewing user:', user.name);
}

function editUser(user: User): void {
  console.log('Editing user:', user.name);
}

function toggleUserStatus(user: User): void {
  console.log('Toggling status for:', user.name);
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
</script>
