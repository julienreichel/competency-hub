<template>
  <base-card
    :clickable="allowOpen"
    :show-open-action="allowOpen"
    :show-edit-action="showEdit"
    :show-delete-action="showDelete"
    @card-click="$emit('open', competency.id)"
    @open="$emit('open', competency.id)"
    @edit="$emit('edit', competency.id)"
    @delete="$emit('delete', competency.id)"
  >
    <template #default>
      <div v-if="showContext && competency.domain">
        <div class="text-h6">{{ competency.domain.name }}</div>
      </div>
      <div class="text-subtitle1">{{ competency.name }}</div>
      <div class="text-caption text-grey-7">
        {{ competency.description || t('competencies.noDescription') }}
      </div>
      <div v-if="competency.objectives" class="q-mt-sm">
        <div class="text-caption">{{ competency.objectives }}</div>
      </div>
    </template>

    <template v-if="progress" #aside>
      <student-progress-badge :student-progress="progress" />
    </template>
  </base-card>
</template>

<script setup lang="ts">
import type { Competency } from 'src/models/Competency';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseCard from 'src/components/common/BaseCard.vue';
import StudentProgressBadge from './StudentProgressBadge.vue';

const props = defineProps<{
  competency: Competency;
  showOpen?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showContext?: boolean;
  showProgress?: boolean;
}>();

defineEmits<{
  (e: 'open', id: string): void;
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
}>();

const { t } = useI18n();
const progress = computed(() => {
  if (!props.showProgress) return false;
  const status = props.competency.getStatus();
  const percent = props.competency.getProgress();
  return { status, percent };
});

const allowOpen = computed(() => props.showOpen !== false);
const showEdit = computed(() => props.showEdit !== false);
const showDelete = computed(() => props.showDelete !== false);
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'CompetencyCard',
});
</script>
