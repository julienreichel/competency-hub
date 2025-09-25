<template>
  <q-table
    flat
    bordered
    row-key="id"
    selection="multiple"
    :rows="rows"
    :columns="columns"
    :loading="loading"
    v-model:selected="selected"
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
            color="primary"
            icon="lock_open"
            :label="t('subCompetencies.unlockAction')"
            :disable="!canBulkUnlock"
            @click="trigger('unlock', selected)"
          />
          <q-btn
            color="secondary"
            icon="thumb_up"
            :label="t('subCompetencies.recommendAction')"
            :disable="!canBulkRecommend"
            @click="trigger('recommend', selected)"
          />
          <q-btn
            color="positive"
            icon="check"
            :label="t('subCompetencies.validateAction')"
            :disable="!canBulkValidate"
            @click="trigger('validate', selected)"
          />
          <q-btn
            color="negative"
            icon="lock"
            :label="t('subCompetencies.lockAction')"
            :disable="!canBulkLock"
            @click="trigger('lock', selected)"
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

    <template #body-cell-status="props">
      <q-td :props="props">
        <student-progress-badge v-if="props.row.progress" :student-progress="props.row.progress" />
        <div v-else>{{ t('progressStatus.NotStarted') }}</div>
      </q-td>
    </template>

    <template #body-cell-actions="props">
      <q-td :props="props">
        <div class="row q-gutter-xs">
          <q-space />
          <q-btn
            flat
            dense
            color="primary"
            icon="lock_open"
            :disable="!props.row.locked"
            @click="trigger('unlock', [props.row])"
          />
          <q-btn
            flat
            dense
            color="secondary"
            icon="thumb_up"
            :disable="props.row.recommended"
            @click="trigger('recommend', [props.row])"
          />
          <q-btn
            flat
            dense
            color="positive"
            icon="check"
            :disable="props.row.progress?.status === 'Validated'"
            @click="trigger('validate', [props.row])"
          />
          <q-btn
            flat
            dense
            color="negative"
            icon="lock"
            :disable="props.row.locked"
            @click="trigger('lock', [props.row])"
          />
        </div>
      </q-td>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import StudentProgressBadge from 'src/components/competency/StudentProgressBadge.vue';
import UserAvatar from 'src/components/ui/UserAvatar.vue';
import type { StudentSubCompetencyProgress } from 'src/models/StudentSubCompetencyProgress';
import type { User } from 'src/models/User';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

export interface SubCompetencyStudentRow {
  id: string;
  student: User;
  progress: StudentSubCompetencyProgress | null;
  statusKey: 'Locked' | 'NotStarted' | 'InProgress' | 'PendingValidation' | 'Validated';
  locked: boolean;
  recommended: boolean;
}

const props = defineProps<{
  students: User[];
  loading: boolean;
}>();

const emit = defineEmits<{
  unlock: [rows: SubCompetencyStudentRow[]];
  recommend: [rows: SubCompetencyStudentRow[]];
  lock: [rows: SubCompetencyStudentRow[]];
  validate: [rows: SubCompetencyStudentRow[]];
}>();

const { t } = useI18n();

const columns = computed(() => [
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
    field: 'statusKey',
    align: 'right' as const,
  },
  { name: 'actions', label: t('common.actions'), align: 'right' as const, field: 'actions' },
]);

const rows = computed<SubCompetencyStudentRow[]>(() =>
  props.students.map((student) => {
    const progress = Array.isArray(student.studentProgress)
      ? (student.studentProgress[0] ?? null)
      : null;
    const locked = progress?.lockOverride === 'Locked';
    const statusKey = locked ? 'Locked' : (progress?.status ?? 'NotStarted');
    const recommended = Boolean(progress?.recommended);
    return {
      id: student.id,
      student,
      progress,
      statusKey,
      locked,
      recommended,
    };
  }),
);

const selected = ref<SubCompetencyStudentRow[]>([]);

watch(
  () => rows.value,
  (newRows) => {
    const byId = new Map(newRows.map((row) => [row.id, row] as [string, SubCompetencyStudentRow]));
    selected.value = selected.value
      .map((row) => byId.get(row.id) ?? null)
      .filter((row): row is SubCompetencyStudentRow => row !== null);
  },
  { deep: true },
);

const canBulkUnlock = computed(() => selected.value.some((row) => row.locked));
const canBulkRecommend = computed(() => selected.value.some((row) => !row.recommended));
const canBulkLock = computed(() => selected.value.some((row) => !row.locked));
const canBulkValidate = computed(() =>
  selected.value.some((row) => row.progress?.status !== 'Validated'),
);

function trigger(
  action: 'unlock' | 'recommend' | 'lock' | 'validate',
  payload: SubCompetencyStudentRow[],
): void {
  if (!payload.length) return;
  if (action === 'unlock') emit('unlock', payload);
  if (action === 'recommend') emit('recommend', payload);
  if (action === 'lock') emit('lock', payload);
  if (action === 'validate') emit('validate', payload);
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SubCompetencyStudentTable',
});
</script>
