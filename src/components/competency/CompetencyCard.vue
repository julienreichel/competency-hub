<template>
  <q-card flat bordered>
    <q-card-section class="row items-center justify-between q-gutter-sm">
      <div>
        <div class="text-subtitle1">{{ competency.name }}</div>
        <div class="text-caption text-grey-7">
          {{ competency.description || t('competencies.noDescription') }}
        </div>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-btn flat color="primary" icon="arrow_forward" @click="$emit('open', competency.id)" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { Competency } from 'src/models/Competency';
import { useI18n } from 'vue-i18n';

defineProps<{ competency: Competency }>();

defineEmits<{ (e: 'open', id: string): void }>();

const { t } = useI18n();
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'CompetencyCard',
});
</script>
