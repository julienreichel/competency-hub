<template>
  <q-chip :color="roleColor" text-color="white" size="sm">
    {{ role }}
  </q-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface RoleChipProps {
  role: 'Student' | 'Educator' | 'Parent' | 'Admin' | 'Unknown';
}

const props = defineProps<RoleChipProps>();

/**
 * Get color for role chip based on role type
 */
const roleColor = computed((): string => {
  switch (props.role) {
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
});
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'RoleChip',
});
</script>
