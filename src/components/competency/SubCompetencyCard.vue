<template>
  <q-card flat bordered>
    <q-card-section class="row justify-between item-start q-gutter-sm full-height">
      <div class="column col">
        <div v-if="showContext && sub.competency">
          <div v-if="sub.competency.domain" class="text-h6">{{ sub.competency.domain.name }}</div>
          <div class="text-subtitle2 text-grey-7">{{ sub.competency.name }}</div>
        </div>
        <div class="row items-center q-gutter-xs full-width">
          <div class="col">
            <q-icon name="star" color="amber" size="20px" v-if="sub.level !== undefined" />
            <span v-if="sub.level !== undefined" class="text-weight-bold">{{ sub.level }}</span>
            <span class="text-subtitle1 q-ml-sm">{{ sub.name }}</span>
          </div>
        </div>
        <div class="text-caption text-grey-7 q-mt-xs">
          {{ sub.description || t('subCompetencies.noDescription') }}
        </div>
        <div v-if="sub.objectives" class="q-mt-sm">
          <div class="text-caption">{{ sub.objectives }}</div>
        </div>
      </div>
      <div class="col-auto column justify-between q-gutter-xs">
        <div v-if="studentProgress" class="col-auto">
          <student-progress-badge :student-progress="studentProgress" />
        </div>
        <div class="row q-gutter-xs">
          <q-space />
          <q-btn
            v-if="showOpen && !locked"
            flat
            dense
            color="primary"
            icon="arrow_forward"
            @click="$emit('open', String(sub.id))"
          />
          <q-btn
            v-if="showEdit"
            flat
            dense
            color="secondary"
            icon="edit"
            @click="$emit('edit', String(sub.id))"
          />
          <q-btn
            v-if="showDelete"
            flat
            dense
            color="negative"
            icon="delete"
            @click="$emit('delete', String(sub.id))"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { SubCompetency } from 'src/models/SubCompetency';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import StudentProgressBadge from './StudentProgressBadge.vue';

const props = defineProps<{
  sub: SubCompetency;
  showOpen?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showStudentProgress?: boolean;
  showContext?: boolean;
}>();

defineEmits<{
  (e: 'open', id: string): void;
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
}>();

const { t } = useI18n();

const studentProgress = computed(() => {
  if (
    !props.showStudentProgress ||
    !props.sub.studentProgress ||
    props.sub.studentProgress.length === 0
  ) {
    return null;
  }
  return props.sub.studentProgress[0];
});

const locked = computed(() => {
  return studentProgress.value?.lockOverride === 'Locked';
});
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'SubCompetencyCard',
});
</script>
