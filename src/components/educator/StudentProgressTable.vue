<template>
  <q-table
    flat
    bordered
    row-key="id"
    :rows="rows"
    :columns="columns"
    :loading="loading"
    :no-data-label="computedNoDataLabel"
    selection="multiple"
    v-model:selected="selectedRows"
  >
    <template #top>
      <div class="row items-center justify-between full-width q-col-gutter-md">
        <div class="col">
          <div class="text-subtitle1">{{ t('subCompetencies.studentProgress') }}</div>
          <div class="text-caption text-grey-7">
            {{ t('subCompetencies.studentProgressHint') }}
          </div>
        </div>
        <div class="col-auto row q-gutter-sm">
          <q-btn
            v-if="isManager"
            color="primary"
            icon="lock_open"
            :label="t('subCompetencies.unlockAction')"
            :disable="!canBulkUnlock"
            @click="emitBulk('unlock')"
          />
          <q-btn
            v-if="isManager"
            color="secondary"
            icon="thumb_up"
            :label="t('subCompetencies.recommendAction')"
            :disable="!canBulkRecommend"
            @click="emitBulk('recommend')"
          />
          <q-btn
            color="positive"
            icon="check"
            :label="t('subCompetencies.validateAction')"
            :disable="!canBulkValidate"
            @click="emitBulk('validate')"
          />
        </div>
      </div>
    </template>

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

    <template v-if="isManager" #body-cell-status="props">
      <q-td :props="props">
        <student-progress-badge :student-progress="props.row.progress" />
      </q-td>
    </template>

    <template v-else #body-cell-competency="props">
      <q-td :props="props">
        <div class="text-body1">{{ props.row.subCompetencyName }}</div>
        <div class="text-caption text-grey-7">
          {{ props.row.domainName }} - {{ props.row.competencyName }}
        </div>
      </q-td>
    </template>

    <template #body-cell-evaluationsStatusSummaries="props">
      <q-td :props="props">
        <div
          v-for="summary in props.row.evaluationsStatusSummaries"
          :key="summary.id"
          class="row items-center no-wrap q-gutter-xs q-mb-xs"
        >
          <q-icon :name="summary.statusIcon" :color="summary.statusColor" size="sm" />
          <span>{{ summary.name }}</span>
        </div>
      </q-td>
    </template>

    <template #body-cell-actions="props">
      <q-td :props="props">
        <div class="row q-gutter-xs">
          <q-space />
          <q-btn
            v-if="isManager"
            flat
            dense
            color="primary"
            icon="lock_open"
            :disable="props.row.progress?.lockOverride === 'Locked'"
            @click="emitRow('unlock', props.row)"
          />
          <q-btn
            v-if="isManager"
            flat
            dense
            color="secondary"
            icon="thumb_up"
            :disable="props.row.progress?.recommended"
            @click="emitRow('recommend', props.row)"
          />
          <q-btn
            flat
            dense
            color="positive"
            icon="check"
            :disable="props.row.progress?.status === 'Validated'"
            @click="emitRow('validate', props.row)"
          />

          <q-btn
            v-if="!isManager"
            dense
            flat
            round
            icon="more_vert"
            :aria-label="t('common.actions')"
          >
            <q-menu anchor="top right" self="top right">
              <q-list dense style="min-width: 180px">
                <q-item
                  clickable
                  v-close-popup
                  @click="emit('open-student-competencies', props.row.student.id)"
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
                  @click="emit('open-student-assessments', props.row.student.id)"
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
                  @click="emit('open-sub-competency', props.row.subCompetency)"
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
import StudentProgressBadge from 'src/components/competency/StudentProgressBadge.vue';
import UserAvatar from 'src/components/ui/UserAvatar.vue';
import type { SubCompetency } from 'src/models/SubCompetency';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { type StudentProgressRow, type StudentProgressTableVariant } from './studentProgressTypes';

const props = defineProps<{
  variant: StudentProgressTableVariant;
  rows: StudentProgressRow[];
  loading: boolean;
  busyIds?: string[];
  noDataLabel?: string;
}>();

const emit = defineEmits<{
  (event: 'unlock', rows: StudentProgressRow[]): void;
  (event: 'recommend', rows: StudentProgressRow[]): void;
  (event: 'lock', rows: StudentProgressRow[]): void;
  (event: 'validate', rows: StudentProgressRow[]): void;
  (event: 'validate-row', row: StudentProgressRow): void;
  (event: 'open-student-competencies', studentId: string): void;
  (event: 'open-student-assessments', studentId: string): void;
  (event: 'open-sub-competency', subCompetency: SubCompetency): void;
}>();

const { t } = useI18n();

const isManager = computed(() => props.variant === 'manager');

const selectedRows = ref<StudentProgressRow[]>([]);

watch(
  () => props.rows,
  (current) => {
    const byId = new Map(current.map((row) => [row.id, row] as [string, StudentProgressRow]));
    selectedRows.value = selectedRows.value
      .map((row) => byId.get(row.id) ?? null)
      .filter((row): row is StudentProgressRow => row !== null);
  },
  { deep: true },
);

const columns = computed(() => (isManager.value ? managerColumns.value : pendingColumns.value));

const managerColumns = computed(() => [
  {
    name: 'student',
    required: true,
    label: t('common.name'),
    field: 'student',
    align: 'left' as const,
  },
  {
    name: 'status',
    label: t('subCompetencies.status'),
    field: 'status',
    align: 'right' as const,
  },
  {
    name: 'evaluationsStatusSummaries',
    label: t('educator.assessments.table.evaluationStatus'),
    field: 'evaluationsStatusSummaries',
    align: 'left' as const,
  },
  { name: 'actions', label: t('common.actions'), align: 'right' as const, field: 'actions' },
]);

const pendingColumns = computed(() => [
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

const computedNoDataLabel = computed(() => props.noDataLabel ?? '');

const rows = computed(() => props.rows);

const canBulkUnlock = computed(() =>
  selectedRows.value.some((row) => row.progress?.lockOverride === 'Locked'),
);
const canBulkRecommend = computed(() =>
  selectedRows.value.some(
    (row) => !row.progress?.recommended && row.progress?.status === 'NotStarted',
  ),
);
const canBulkValidate = computed(() =>
  selectedRows.value.some((row) => row.progress?.status !== 'Validated'),
);

type ManagerAction = 'unlock' | 'recommend' | 'lock' | 'validate';

function emitManagerAction(action: ManagerAction, rows: StudentProgressRow[]): void {
  if (!rows.length) {
    return;
  }

  switch (action) {
    case 'unlock':
      emit('unlock', rows);
      break;
    case 'recommend':
      emit('recommend', rows);
      break;
    case 'lock':
      emit('lock', rows);
      break;
    case 'validate':
      emit('validate', rows);
      break;
    default:
      break;
  }
}

function emitBulk(action: ManagerAction): void {
  emitManagerAction(action, [...selectedRows.value]);
}

function emitRow(action: ManagerAction, row: StudentProgressRow): void {
  emitManagerAction(action, [row]);
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'StudentProgressTable',
});
</script>
