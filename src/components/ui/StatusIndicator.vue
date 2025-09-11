<template>
  <div class="flex items-center q-gutter-xs">
    <q-icon :name="statusIcon" :color="statusColor" size="sm" />
    <span>{{ status }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface StatusIndicatorProps {
  status: 'Active' | 'Inactive' | 'Suspended';
}

const props = defineProps<StatusIndicatorProps>();

/**
 * Get icon for status indicator
 */
const statusIcon = computed((): string => {
  switch (props.status) {
    case 'Active':
      return 'check_circle';
    case 'Inactive':
      return 'radio_button_unchecked';
    case 'Suspended':
      return 'block';
    default:
      return 'help';
  }
});

/**
 * Get color for status indicator
 */
const statusColor = computed((): string => {
  switch (props.status) {
    case 'Active':
      return 'green';
    case 'Inactive':
      return 'grey';
    case 'Suspended':
      return 'red';
    default:
      return 'grey';
  }
});
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'StatusIndicator',
});
</script>
