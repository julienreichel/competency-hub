<template>
  <q-table
    flat
    bordered
    row-key="id"
    :rows="rows"
    :columns="columns"
    :loading="loading"
    :no-data-label="emptyLabel"
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
        <div class="text-body2">{{ formatNames(props.row.parentIds) }}</div>
      </q-td>
    </template>

    <template #body-cell-educators="props">
      <q-td :props="props">
        <div class="text-body2">{{ formatNames(props.row.educatorIds) }}</div>
      </q-td>
    </template>

    <template #body-cell-actions="props">
      <q-td :props="props">
        <div class="row q-gutter-xs">
          <q-btn
            flat
            color="primary"
            icon="visibility"
            :label="$t('common.view')"
            @click="emit('view', props.row.id)"
          />
          <q-btn
            v-if="currentEducatorId"
            :color="isAssigned(props.row) ? 'negative' : 'primary'"
            :icon="isAssigned(props.row) ? 'person_remove' : 'person_add'"
            :label="
              isAssigned(props.row) ? $t('educator.unassignLabel') : $t('educator.assignLabel')
            "
            @click="
              isAssigned(props.row) ? emit('unassign', props.row.id) : emit('assign', props.row.id)
            "
          />
        </div>
      </q-td>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import UserAvatar from 'src/components/ui/UserAvatar.vue';
import type { User } from 'src/models/User';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  students: User[];
  userMap: Map<string, User>;
  loading: boolean;
  currentEducatorId: string | null;
  emptyLabel: string;
}>();

const emit = defineEmits<{
  assign: [studentId: string];
  unassign: [studentId: string];
  view: [studentId: string];
}>();

const { t } = useI18n();

const columns = [
  { name: 'name', required: true, label: t('common.name'), field: 'name', align: 'left' as const },
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
  },
];

const rows = computed(() => props.students);

function formatNames(ids: string[] | null | undefined): string {
  const names = (ids ?? [])
    .map((id) => props.userMap.get(id)?.name)
    .filter((name): name is string => Boolean(name));
  return names.length > 0 ? names.join(', ') : '—';
}

function isAssigned(student: User): boolean {
  if (!props.currentEducatorId) {
    return false;
  }
  return (student.educatorIds ?? []).includes(props.currentEducatorId);
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'StudentAssignmentsTable',
});
</script>
