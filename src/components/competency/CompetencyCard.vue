<template>
  <q-card flat bordered>
    <q-card-section class="row items-center justify-between q-gutter-sm">
      <div class="column col">
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
      </div>
      <div class="col-auto column items-center q-gutter-sm">
        <div v-if="progress" class="col-auto">
          <student-progress-badge :student-progress="progress" />
        </div>
        <div class="row">
          <q-btn
            v-if="showOpen !== false"
            flat
            color="primary"
            icon="arrow_forward"
            @click="$emit('open', competency.id)"
          />
          <q-btn
            v-if="showEdit"
            flat
            color="secondary"
            icon="edit"
            @click="$emit('edit', competency.id)"
          />
          <q-btn
            v-if="showDelete"
            flat
            color="negative"
            icon="delete"
            @click="$emit('delete', competency.id)"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { Competency } from 'src/models/Competency';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
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
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'CompetencyCard',
});
</script>
