<template>
  <managed-table
    row-key="id"
    :rows="rows"
    :columns="columns"
    :loading="loading"
    :no-data-label="emptyLabel"
    :selection="'multiple'"
    v-model:selected="selectedRows"
    :bulk-actions="bulkActions"
  >
    <template #body-cell-name="props">
      <q-td :props="props">
        <div class="row items-center no-wrap q-gutter-sm">
          <user-avatar :user="props.row" size="42px" />
          <div>
            <div class="text-body1">{{ props.row.name }}</div>
            <div class="text-caption text-grey-7">{{ props.row.email }}</div>
          </div>
        </div>
      </q-td>
    </template>

    <template #body-cell-parents="props">
      <q-td :props="props">
        <div class="text-body2">
          {{ formatRelationNames(props.row.parents, props.row.parentIds) }}
        </div>
      </q-td>
    </template>

    <template #body-cell-educators="props">
      <q-td :props="props">
        <div class="text-body2">
          {{ formatRelationNames(props.row.educators, props.row.educatorIds) }}
        </div>
      </q-td>
    </template>

    <template #body-cell-actions="props">
      <q-td :props="props">
        <div class="managed-table__actions-row">
          <q-btn
            v-if="currentEducatorId"
            flat
            dense
            :color="isAssigned(props.row) ? 'negative' : 'primary'"
            :icon="isAssigned(props.row) ? 'person_remove' : 'person_add'"
            @click="
              isAssigned(props.row) ? emit('unassign', props.row.id) : emit('assign', props.row.id)
            "
          />
          <q-btn flat dense round icon="more_vert" :aria-label="$t('common.actions')">
            <q-menu anchor="top right" self="top right">
              <q-list dense style="min-width: 160px">
                <q-item clickable v-close-popup @click="emit('view', props.row.id)">
                  <q-item-section avatar>
                    <q-icon name="visibility" />
                  </q-item-section>
                  <q-item-section>{{ $t('common.view') }}</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="emit('viewCompetencies', props.row.id)">
                  <q-item-section avatar>
                    <q-icon name="psychology" />
                  </q-item-section>
                  <q-item-section>{{ t('educator.viewCompetencies') }}</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="emit('viewAssessments', props.row.id)">
                  <q-item-section avatar>
                    <q-icon name="quiz" />
                  </q-item-section>
                  <q-item-section>{{ t('educator.viewAssessments') }}</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="emit('viewReport', props.row.id)">
                  <q-item-section avatar>
                    <q-icon name="assessment" />
                  </q-item-section>
                  <q-item-section>{{ t('educator.viewReport') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-td>
    </template>
  </managed-table>
</template>

<script setup lang="ts">
import ManagedTable, { type ManagedTableBulkAction } from 'src/components/common/ManagedTable.vue';
import UserAvatar from 'src/components/ui/UserAvatar.vue';
import type { User } from 'src/models/User';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  students: User[];
  userMap: Map<string, User>;
  loading: boolean;
  currentEducatorId: string | null;
  assignedStudentIds?: string[];
  emptyLabel: string;
  showAssign?: boolean;
  showUnassign?: boolean;
}>();

const emit = defineEmits<{
  assign: [studentId: string];
  unassign: [studentId: string];
  view: [studentId: string];
  viewCompetencies: [studentId: string];
  viewAssessments: [studentId: string];
  viewReport: [studentId: string];
}>();

const { t } = useI18n();

const columns = [
  {
    name: 'name',
    required: true,
    label: t('common.name'),
    field: 'name',
    align: 'left' as const,
    noMaxWidth: true,
  },
  {
    name: 'parents',
    label: t('educator.parents'),
    field: 'parentNames',
    align: 'left' as const,
  },
  {
    name: 'educators',
    label: t('educator.educators'),
    field: 'educatorNames',
    align: 'left' as const,
  },
  {
    name: 'actions',
    align: 'right' as const,
    label: t('common.actions'),
    field: 'actions',
    isActionColumn: true,
  },
];

const rows = computed(() => props.students);

const assignedStudentSet = computed(() => new Set(props.assignedStudentIds ?? []));

const selectedRows = ref<User[]>([]);

const bulkActions = computed<ManagedTableBulkAction[]>(() => {
  const action: ManagedTableBulkAction[] = [];
  if (props.showAssign) {
    action.push({
      key: 'assign',
      label: t('educator.assignLabel'),
      icon: 'person_add',
      color: 'primary',
      handler: (rows: unknown[]): void => {
        (rows as User[]).forEach((student) => {
          if (!isAssigned(student)) {
            emit('assign', student.id);
          }
        });
        selectedRows.value = [];
      },
      disableWhenEmpty: true,
    });
  }
  if (props.showUnassign) {
    action.push({
      key: 'unassign',
      label: t('educator.unassignLabel'),
      icon: 'person_remove',
      color: 'negative',
      handler: (rows: unknown[]): void => {
        (rows as User[]).forEach((student) => {
          if (isAssigned(student)) {
            emit('unassign', student.id);
          }
        });
        selectedRows.value = [];
      },
      disableWhenEmpty: true,
    });
  }
  return action;
});

function formatRelationNames(
  relations: User[] | undefined,
  ids: string[] | null | undefined,
): string {
  const relationNames = (relations ?? [])
    .map((relation) => props.userMap.get(relation.id)?.name ?? relation.name)
    .filter((name) => Boolean(name));

  if (relationNames.length > 0) {
    return relationNames.join(', ');
  }

  const fallbackNames = (ids ?? [])
    .map((id) => props.userMap.get(id)?.name)
    .filter((name): name is string => Boolean(name));

  return fallbackNames.length > 0 ? fallbackNames.join(', ') : '—';
}

function isAssigned(student: User): boolean {
  if (!props.currentEducatorId) {
    return false;
  }
  if (student.educators.some((educator) => educator.id === props.currentEducatorId)) {
    return true;
  }

  if (student.educatorIds.includes(props.currentEducatorId)) {
    return true;
  }

  return assignedStudentSet.value.has(student.id);
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'StudentAssignmentsTable',
});
</script>
