<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg">
      <q-icon name="admin_panel_settings" class="q-mr-sm" />
      User Management
    </div>

    <!-- Action Bar -->
    <div class="row justify-between items-center q-mb-lg">
      <div class="row q-gutter-md">
        <q-input
          v-model="searchQuery"
          filled
          placeholder="Search users..."
          debounce="300"
          style="width: 300px"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-select
          v-model="roleFilter"
          filled
          :options="roleOptions"
          label="Role"
          clearable
          style="width: 150px"
        />
        <q-select
          v-model="statusFilter"
          filled
          :options="statusOptions"
          label="Status"
          clearable
          style="width: 150px"
        />
      </div>
      <q-btn-group>
        <q-btn
          color="primary"
          icon="person_add"
          label="Add User"
          @click="showAddUserDialog = true"
        />
        <q-btn outline color="primary" icon="file_upload" label="Bulk Import" @click="bulkImport" />
      </q-btn-group>
    </div>

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
          <q-avatar size="40px">
            <q-img v-if="props.row.avatar" :src="props.row.avatar" :alt="props.row.name" />
            <span v-else>{{ getInitials(props.row.name) }}</span>
          </q-avatar>
        </q-td>
      </template>

      <template v-slot:body-cell-role="props">
        <q-td :props="props">
          <q-chip :color="getRoleColor(props.value)" text-color="white" size="sm">
            {{ props.value }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-icon
            :name="getStatusIcon(props.value)"
            :color="getStatusColor(props.value)"
            size="sm"
          />
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-lastActive="props">
        <q-td :props="props">
          <span :class="getLastActiveClass(props.value)">
            {{ formatLastActive(props.value) }}
          </span>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn-group flat>
            <q-btn flat icon="visibility" size="sm" @click="viewUser(props.row)">
              <q-tooltip>View Profile</q-tooltip>
            </q-btn>
            <q-btn flat icon="edit" size="sm" @click="editUser(props.row)">
              <q-tooltip>Edit User</q-tooltip>
            </q-btn>
            <q-btn flat icon="more_vert" size="sm">
              <q-menu>
                <q-list>
                  <q-item clickable @click="resetPassword(props.row)">
                    <q-item-section>Reset Password</q-item-section>
                  </q-item>
                  <q-item clickable @click="toggleUserStatus(props.row)">
                    <q-item-section>
                      {{ props.row.status === 'Active' ? 'Deactivate' : 'Activate' }}
                    </q-item-section>
                  </q-item>
                  <q-item clickable @click="viewActivity(props.row)">
                    <q-item-section>View Activity</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable @click="deleteUser(props.row)">
                    <q-item-section>Delete User</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-btn-group>
        </q-td>
      </template>

      <template v-slot:top-right v-if="selectedUsers.length > 0">
        <q-btn-group>
          <q-btn
            outline
            color="negative"
            icon="delete"
            :label="`Delete (${selectedUsers.length})`"
            @click="bulkDelete"
          />
          <q-btn outline color="primary" icon="group" label="Change Role" @click="bulkChangeRole" />
        </q-btn-group>
      </template>
    </q-table>

    <!-- Statistics Cards -->
    <div class="row q-gutter-md q-mt-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section class="text-center">
            <q-icon name="people" size="2em" color="blue" />
            <div class="text-h5 q-mt-sm">{{ userStats.total }}</div>
            <div class="text-subtitle2">Total Users</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section class="text-center">
            <q-icon name="check_circle" size="2em" color="green" />
            <div class="text-h5 q-mt-sm">{{ userStats.active }}</div>
            <div class="text-subtitle2">Active Users</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section class="text-center">
            <q-icon name="person_add" size="2em" color="purple" />
            <div class="text-h5 q-mt-sm">{{ userStats.newThisMonth }}</div>
            <div class="text-subtitle2">New This Month</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section class="text-center">
            <q-icon name="schedule" size="2em" color="orange" />
            <div class="text-h5 q-mt-sm">{{ userStats.onlineNow }}</div>
            <div class="text-subtitle2">Online Now</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Add User Dialog -->
    <q-dialog v-model="showAddUserDialog">
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">Add New User</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="addUser" class="q-gutter-md">
            <div class="row q-gutter-md">
              <div class="col">
                <q-input
                  v-model="newUser.firstName"
                  filled
                  label="First Name *"
                  :rules="[(val) => !!val || 'First name is required']"
                />
              </div>
              <div class="col">
                <q-input
                  v-model="newUser.lastName"
                  filled
                  label="Last Name *"
                  :rules="[(val) => !!val || 'Last name is required']"
                />
              </div>
            </div>

            <q-input
              v-model="newUser.email"
              filled
              type="email"
              label="Email *"
              :rules="[(val) => !!val || 'Email is required']"
            />

            <q-select
              v-model="newUser.role"
              filled
              :options="roleOptions"
              label="Role *"
              :rules="[(val) => !!val || 'Role is required']"
            />

            <q-input
              v-model="newUser.username"
              filled
              label="Username"
              hint="If left blank, will use email prefix"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showAddUserDialog = false" />
          <q-btn color="primary" label="Add User" @click="addUser" :disable="!isNewUserValid" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

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

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function getRoleColor(role: string): string {
  switch (role) {
    case 'Admin':
      return 'red';
    case 'Educator':
      return 'blue';
    case 'Parent':
      return 'green';
    case 'Student':
      return 'purple';
    default:
      return 'grey';
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'Active':
      return 'check_circle';
    case 'Inactive':
      return 'radio_button_unchecked';
    case 'Suspended':
      return 'block';
    default:
      return 'help';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Active':
      return 'green';
    case 'Inactive':
      return 'grey';
    case 'Suspended':
      return 'red';
    default:
      return 'grey';
  }
}

// Constants for time calculations
const TIME_CONSTANTS = {
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_HOUR: 3600,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  ONE_HOUR: 1,
} as const;

function getLastActiveClass(lastActive: string): string {
  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  const hoursDiff =
    (now.getTime() - lastActiveDate.getTime()) /
    (TIME_CONSTANTS.MILLISECONDS_PER_SECOND * TIME_CONSTANTS.SECONDS_PER_HOUR);

  if (hoursDiff < TIME_CONSTANTS.ONE_HOUR) return 'text-green';
  if (hoursDiff < TIME_CONSTANTS.HOURS_PER_DAY) return 'text-orange';
  return 'text-grey';
}

function formatLastActive(lastActive: string): string {
  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  const diff = now.getTime() - lastActiveDate.getTime();
  const hours = Math.floor(
    diff / (TIME_CONSTANTS.MILLISECONDS_PER_SECOND * TIME_CONSTANTS.SECONDS_PER_HOUR),
  );
  const days = Math.floor(hours / TIME_CONSTANTS.HOURS_PER_DAY);

  if (hours < TIME_CONSTANTS.ONE_HOUR) return 'Just now';
  if (hours < TIME_CONSTANTS.HOURS_PER_DAY) return `${hours}h ago`;
  if (days < TIME_CONSTANTS.DAYS_PER_WEEK) return `${days}d ago`;
  return lastActiveDate.toLocaleDateString();
}

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
