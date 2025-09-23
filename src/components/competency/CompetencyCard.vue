<template>
  <q-card flat bordered>
    <q-card-section class="row items-center justify-between q-gutter-sm">
      <div>
        <div class="text-subtitle1">{{ competency.name }}</div>
        <div class="text-caption text-grey-7">
          {{ competency.description || t('competencies.noDescription') }}
        </div>
        <div v-if="competency.objectives" class="q-mt-sm">
          <div class="text-caption">{{ competency.objectives }}</div>
        </div>
      </div>
      <div class="row items-center q-gutter-sm">
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
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { Competency } from 'src/models/Competency';
import { useI18n } from 'vue-i18n';

defineProps<{
  competency: Competency;
  showOpen?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
}>();

defineEmits<{
  (e: 'open', id: string): void;
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
}>();

const { t } = useI18n();
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'CompetencyCard',
});
</script>
