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
        <q-chip color="warning" text-color="black" icon="star">
          {{ t('subCompetencies.recommended') }}
        </q-chip>
      </template>
      <template v-else>
        <q-chip color="grey" text-color="white" icon="schedule">
          {{ t('progressStatus.NotStarted') }}
        </q-chip>
      </template>
    </div>
    <div v-if="studentProgress.status === 'InProgress'" class="q-mt-xs">
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
import { useI18n } from 'vue-i18n';

defineProps<{
  studentProgress: {
    status: string;
    percent: number;
    recommended?: boolean | null;
    lockOverride?: string | null;
  } | null;
}>();

const { t } = useI18n();

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NotStarted: 'grey',
    InProgress: 'info',
    PendingValidation: 'warning',
    Validated: 'positive',
  };
  return colors[status] || 'grey';
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    Locked: 'lock',
    NotStarted: 'schedule',
    InProgress: 'schedule',
    PendingValidation: 'schedule',
    Validated: 'check_circle',
  };
  return icons[status] || 'help';
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'StudentProgressBadge',
});
</script>
