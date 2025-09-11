<template>
  <div class="row justify-between items-center q-mb-lg">
    <user-search-filters
      :search="search"
      :role-filter="roleFilter"
      :status-filter="statusFilter"
      :role-options="roleOptions"
      :status-options="statusOptions"
      @update:search="$emit('update:search', $event)"
      @update:role-filter="$emit('update:roleFilter', $event)"
      @update:status-filter="$emit('update:statusFilter', $event)"
    />
    <q-btn-group>
      <q-btn
        color="primary"
        icon="person_add"
        :label="$t('admin.addUser')"
        @click="$emit('add-user')"
      />
      <q-btn
        outline
        color="primary"
        icon="file_upload"
        :label="$t('admin.bulkImport')"
        @click="$emit('bulk-import')"
      />
    </q-btn-group>
  </div>
</template>

<script setup lang="ts">
import UserSearchFilters from './UserSearchFilters.vue';

export interface UserActionBarProps {
  search: string;
  roleFilter: string | null;
  statusFilter: string | null;
  roleOptions: string[];
  statusOptions: string[];
}

defineProps<UserActionBarProps>();

defineEmits<{
  'update:search': [value: string];
  'update:roleFilter': [value: string | null];
  'update:statusFilter': [value: string | null];
  'add-user': [];
  'bulk-import': [];
}>();
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'UserActionBar',
});
</script>
