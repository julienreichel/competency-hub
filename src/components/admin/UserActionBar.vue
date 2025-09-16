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
}>();
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'UserActionBar',
});
</script>
