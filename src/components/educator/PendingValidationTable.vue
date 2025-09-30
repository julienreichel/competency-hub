<template>
  <q-table
    flat
    bordered
    row-key="id"
    :rows="rows"
    :columns="columns"
    :loading="loading"
    :no-data-label="noDataLabel"
  >
    <template #body-cell-student="props">
      <q-td :props="props">
        <div class="row items-center no-wrap q-gutter-sm">
          <user-avatar :user="props.row.student" size="40px" />
          <div>
            <div class="text-body1">{{ props.row.student.name }}</div>
            <div class="text-caption text-grey-7">{{ props.row.student.email }}</div>
          </div>
        </div>
      </q-td>
    </template>

    <template #body-cell-competency="props">
      <q-td :props="props">
        <div class="text-body1">{{ props.row.subCompetencyName }}</div>
        <div class="text-caption text-grey-7">
          {{ props.row.domainName }} - {{ props.row.competencyName }}
        </div>
      </q-td>
    </template>

    <template #body-cell-evaluationsStatusSummaries="props">
      <q-td :props="props">
        <div v-for="summary in props.row.evaluationsStatusSummaries" :key="summary.id">
          <q-icon :name="summary.statusIcon" :color="summary.statusColor" size="sm" />
          {{ summary.name }}
        </div>
      </q-td>
    </template>

    <template #body-cell-actions="props">
      <q-td :props="props">
        <div class="row items-center justify-end q-gutter-xs">
          <q-btn
            color="positive"
            icon="check"
            :label="t('subCompetencies.validateAction')"
            :loading="isBusy(props.row.progress.id)"
            @click="emit('validate', props.row)"
          />

          <q-btn dense flat round icon="more_vert" :aria-label="t('common.actions')">
            <q-menu anchor="top right" self="top right">
              <q-list dense style="min-width: 180px">
                <q-item
                  clickable
                  v-close-popup
                  @click="emit('openStudentCompetencies', props.row.student.id)"
                >
                  <q-item-section avatar>
                    <q-icon name="psychology" />
                  </q-item-section>
                  <q-item-section>{{
                    t('educator.assessments.table.menu.openCompetencies')
                  }}</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  @click="emit('openStudentAssessments', props.row.student.id)"
                >
                  <q-item-section avatar>
                    <q-icon name="quiz" />
                  </q-item-section>
                  <q-item-section>{{
                    t('educator.assessments.table.menu.openAssessments')
                  }}</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  @click="emit('openSubCompetency', props.row.subCompetency)"
                >
                  <q-item-section avatar>
                    <q-icon name="school" />
                  </q-item-section>
                  <q-item-section>{{
                    t('educator.assessments.table.menu.openSubCompetency')
                  }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-td>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import UserAvatar from 'src/components/ui/UserAvatar.vue';
import type { StudentSubCompetencyProgress } from 'src/models/StudentSubCompetencyProgress';
import type { SubCompetency } from 'src/models/SubCompetency';
import type { User } from 'src/models/User';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EvaluationStatus } from '../../models/EvaluationAttempt';

const props = defineProps<{
  rows: PendingValidationRow[];
  loading: boolean;
  noDataLabel: string;
  busyIds?: string[];
}>();

const emit = defineEmits<{
  validate: [row: PendingValidationRow];
  openStudentCompetencies: [studentId: string];
  openStudentAssessments: [studentId: string];
  openSubCompetency: [subCompetency: SubCompetency];
}>();

const { t } = useI18n();

const columns = computed(() => [
  {
    name: 'student',
    required: true,
    label: t('educator.assessments.table.student'),
    field: 'student',
    align: 'left' as const,
  },
  {
    name: 'competency',
    label: t('competencies.title'),
    field: 'competencyName',
    align: 'left' as const,
  },
  {
    name: 'evaluationsStatusSummaries',
    label: t('educator.assessments.table.evaluationStatus'),
    field: 'evaluationsStatusSummaries',
    align: 'left' as const,
  },
  { name: 'actions', label: t('common.actions'), field: 'actions', align: 'right' as const },
]);

const busySet = computed(() => new Set(props.busyIds ?? []));

function isBusy(progressId: string): boolean {
  return busySet.value.has(progressId);
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export interface EvaluationStatusSummary {
  id: string;
  name: string;
  status: EvaluationStatus;
  statusIcon: string;
  statusColor: string;
}
export interface PendingValidationRow {
  id: string;
  student: User;
  progress: StudentSubCompetencyProgress;
  subCompetency: SubCompetency;
  domainName: string;
  domainValue: string | null;
  competencyName: string;
  subCompetencyName: string;
  evaluationsStatusSummaries: EvaluationStatusSummary[];
}

export default defineComponent({
  name: 'PendingValidationTable',
});
</script>
