<template>
  <span :class="lastActiveClass">
    {{ formattedLastActive }}
  </span>
</template>

<script setup lang="ts">
import { useUserFormatters } from 'src/composables/useUserFormatters';
import { computed } from 'vue';

export interface LastActiveCellProps {
  lastActive: string;
}

const props = defineProps<LastActiveCellProps>();

const { getLastActiveClass, formatLastActive } = useUserFormatters();

/**
 * CSS class for last active display based on recency
 */
const lastActiveClass = computed((): string => {
  return getLastActiveClass(props.lastActive);
});

/**
 * Formatted last active text
 */
const formattedLastActive = computed((): string => {
  return formatLastActive(props.lastActive);
});
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'LastActiveCell',
});
</script>
