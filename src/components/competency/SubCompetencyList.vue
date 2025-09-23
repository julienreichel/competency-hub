<template>
  <div>
    <div v-if="props.items.length === 0" class="text-grey-6 text-center q-mt-lg">
      {{ t('subCompetencies.emptyState') }}
    </div>
    <div v-else class="column q-gutter-md">
      <q-card v-for="sub in itemsWithId" :key="String(sub.id)" flat bordered>
        <q-card-section class="row items-center justify-between q-gutter-sm">
          <div class="column">
            <div class="row items-center q-gutter-xs">
              <q-icon name="star" color="amber" size="20px" v-if="sub.level !== undefined" />
              <span v-if="sub.level !== undefined" class="text-weight-bold">{{ sub.level }}</span>
              <span class="text-subtitle1 q-ml-sm">{{ sub.name }}</span>
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">
              {{ sub.description || t('subCompetencies.noDescription') }}
            </div>
          </div>
          <div class="row items-center q-gutter-xs">
            <q-btn
              flat
              color="primary"
              icon="arrow_forward"
              @click="emit('open', String(sub.id))"
            />
            <q-btn
              v-if="props.showDelete !== false"
              flat
              color="negative"
              icon="delete"
              @click="emit('delete', String(sub.id))"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type CreateSubCompetencyInput } from 'src/models/Competency';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

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
