<template>
  <div>
    <div v-if="props.items.length === 0" class="text-grey-6 text-center q-mt-lg">
      {{ t('subCompetencies.emptyState') }}
    </div>
    <div v-else class="column q-gutter-md">
      <sub-competency-card
        v-for="sub in itemsWithId"
        :key="String(sub.id)"
        :sub="sub"
        show-open
        :show-delete="props.showDelete"
        @open="emit('open', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { type CreateSubCompetencyInput } from 'src/models/Competency';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SubCompetencyCard from './SubCompetencyCard.vue';

const props = defineProps<{
  items: CreateSubCompetencyInput[];
  showDelete?: boolean;
}>();
const emit = defineEmits<{
  (e: 'open', id: string): void;
  (e: 'delete', id: string): void;
}>();

const { t } = useI18n();

const itemsWithId = computed(() => props.items.filter((item) => !!item.id));
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SubCompetencyList',
});
</script>
