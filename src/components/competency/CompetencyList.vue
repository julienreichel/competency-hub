<template>
  <div>
    <div v-if="competencies.length === 0" class="text-grey-6 text-center q-mt-lg">
      {{ $t('competencies.emptyState') }}
    </div>
    <div v-else class="column q-gutter-md">
      <competency-card
        v-for="competency in competencies"
        :key="competency.id"
        :competency="competency"
        show-open
        :show-progress="showProgress || false"
        @open="$emit('open', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Competency } from 'src/models/Competency';
import CompetencyCard from './CompetencyCard.vue';

defineProps<{
  competencies: Competency[];
  showProgress?: boolean;
}>();

defineEmits<{
  (e: 'open', id: string): void;
}>();
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'CompetencyList',
});
</script>

<style scoped></style>
