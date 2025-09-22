<template>
  <div>
    <div v-if="competencies.length === 0" class="text-grey-6 text-center q-mt-lg">
      {{ $t('competencies.emptyState') }}
    </div>
    <div v-else class="column q-gutter-md">
      <q-card v-for="competency in competencies" :key="competency.id" flat bordered>
        <q-card-section class="row items-center justify-between q-gutter-sm">
          <div>
            <div class="text-subtitle1">{{ competency.name }}</div>
            <div class="text-caption text-grey-7">
              {{ competency.description || $t('competencies.noDescription') }}
            </div>
          </div>
          <div class="row items-center q-gutter-sm">
            <q-btn flat color="primary" icon="edit" @click="$emit('edit', competency.id)" />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Competency } from 'src/models/Competency';
import { defineEmits, defineProps } from 'vue';

defineProps<{
  competencies: Competency[];
}>();

defineEmits<{
  (e: 'edit', id: string): void;
}>();
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'CompetencyList',
});
</script>

<style scoped></style>
