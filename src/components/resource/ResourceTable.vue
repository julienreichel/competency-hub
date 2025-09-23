<template>
  <div>
    <div v-if="props.items.length === 0" class="text-grey-6 text-center q-mt-lg">
      {{ $t('resources.emptyState') }}
    </div>
    <div v-else class="column q-gutter-md">
      <resource-card
        v-for="resource in props.items"
        :key="resource.id"
        :resource="resource"
        :show-edit="props.showActions"
        :show-delete="props.showActions"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { type CompetencyResource, type UpdateCompetencyInput } from 'src/models/Competency';
import ResourceCard from './ResourceCard.vue';

const props = defineProps<{
  items: CompetencyResource[];
  showActions?: boolean;
}>();
const emit = defineEmits<{
  (e: 'edit', payload: UpdateCompetencyInput): void;
  (e: 'delete', id: string): void;
}>();
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ResourceTable',
});
</script>
