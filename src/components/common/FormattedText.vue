<template>
  <div class="formatted-text">
    {{ displayValue }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  text?: string | null;
  defaultText?: string;
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
</style>
