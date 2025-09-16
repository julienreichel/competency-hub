<template>
  <div class="row justify-between items-center q-mb-lg">
    <user-search-filters
      :search="search"
      :role-filter="roleFilter"
      :role-options="roleOptions"
      @update:search="$emit('update:search', $event)"
      @update:role-filter="$emit('update:roleFilter', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import UserSearchFilters from './UserSearchFilters.vue';

export interface UserActionBarProps {
  search: string;
  roleFilter: string | null;
  roleOptions: string[];
}

defineProps<UserActionBarProps>();

defineEmits<{
  'update:search': [value: string];
  'update:roleFilter': [value: string | null];
}>();
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'UserActionBar',
});
</script>
