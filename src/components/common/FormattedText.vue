<template>
  <div class="formatted-text" :class="{ 'line-clamp-2': clamp }">
    {{ displayValue }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  text?: string | null;
  defaultText?: string;
  clamp?: boolean;
}>();

const displayValue = computed(() => props.text || props.defaultText || '');
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FormattedText',
});
</script>

<style scoped>
.formatted-text {
  white-space: pre-line;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
