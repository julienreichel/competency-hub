<template>
  <div class="row q-gutter-md">
    <q-input
      :model-value="search"
      @update:model-value="handleSearchUpdate"
      filled
      :placeholder="$t('admin.searchUsers')"
      debounce="300"
      style="width: 300px"
    >
      <template v-slot:append>
        <q-icon name="search" />
      </template>
    </q-input>
    <q-select
      :model-value="roleFilter"
      @update:model-value="$emit('update:roleFilter', $event)"
      filled
      :options="roleOptions"
      :label="$t('common.role')"
      clearable
      style="width: 150px"
    />
    <q-select
      :model-value="statusFilter"
      @update:model-value="$emit('update:statusFilter', $event)"
      filled
      :options="statusOptions"
      :label="$t('common.status')"
      clearable
      style="width: 150px"
    />
  </div>
</template>

<script setup lang="ts">
export interface UserSearchFiltersProps {
  search: string;
  roleFilter: string | null;
  statusFilter: string | null;
  roleOptions: string[];
  statusOptions: string[];
}

defineProps<UserSearchFiltersProps>();

const emit = defineEmits<{
  'update:search': [value: string];
  'update:roleFilter': [value: string | null];
  'update:statusFilter': [value: string | null];
}>();

/**
 * Handle search input update with proper type casting
 */
function handleSearchUpdate(value: string | number | null): void {
  emit('update:search', String(value || ''));
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'UserSearchFilters',
});
</script>
