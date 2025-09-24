<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'StudentProgressBadge',
});
</script>
<template>
  <div v-if="studentProgress">
    <div class="row items-center q-gutter-sm">
      <template v-if="studentProgress.status !== 'NotStarted'">
        <q-chip
          :color="getStatusColor(studentProgress.status)"
          text-color="white"
          :icon="getStatusIcon(studentProgress.status)"
          class="q-mr-xs"
        >
          {{ t('progressStatus.' + studentProgress.status) }}
        </q-chip>
      </template>
      <template v-else-if="studentProgress.lockOverride === 'Locked'">
        <q-chip color="grey" text-color="white" icon="lock">
          {{ t('progressStatus.Locked') }}
        </q-chip>
      </template>
      <template v-else-if="studentProgress.recommended">
        <q-chip color="grey" text-color="white" icon="star">
          {{ t('subCompetencies.recommended') }}
        </q-chip>
      </template>
    </div>
    <div v-if="studentProgress.status !== 'NotStarted'" class="q-mt-xs">
      <q-linear-progress
        :value="studentProgress.percent / 100"
        :color="getStatusColor(studentProgress.status)"
        size="8px"
        rounded
      />
      <div class="text-caption text-right q-mt-xs">{{ studentProgress.percent }}%</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StudentSubCompetencyProgress } from 'src/models/StudentSubCompetencyProgress';
import { useI18n } from 'vue-i18n';

defineProps<{
  studentProgress: StudentSubCompetencyProgress | null;
}>();

const { t } = useI18n();

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NotStarted: 'grey',
    InProgress: 'orange',
    PendingValidation: 'orange',
    Validated: 'green',
  };
  return colors[status] || 'grey';
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    NotStarted: 'lock',
    InProgress: 'schedule',
    PendingValidation: 'schedule',
    Validated: 'check_circle',
  };
  return icons[status] || 'help';
}
</script>
