<template>
  <q-table
    class="managed-table"
    flat
    bordered
    v-bind="attrs"
    :rows="rows"
    :columns="enhancedColumns"
    :loading="loading"
    :row-key="rowKey"
    :selection="selection"
    :no-data-label="noDataLabel"
    v-model:selected="selectedProxy"
    :selected-rows-label="selectedRowsLabel"
  >
    <template v-if="slots.top" #top="slotProps">
      <slot name="top" v-bind="slotProps" />
    </template>
    <template v-else-if="hasTopContent" #top>
      <div class="row items-center justify-between q-col-gutter-md full-width">
        <div class="col">
          <slot name="top-left" />
        </div>
        <div class="col-auto row q-gutter-sm items-center">
          <slot name="top-right" />
          <template v-for="action in normalizedBulkActions" :key="action.key">
            <q-btn
              flat
              :color="action.color || 'primary'"
              :icon="action.icon"
              :label="action.label"
              :disable="bulkActionDisabled(action)"
              :loading="action.loading"
              @click="triggerBulk(action)"
            />
          </template>
        </div>
      </div>
    </template>

    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps" />
    </template>
  </q-table>
</template>

<script setup lang="ts">
import type { QTableColumn, QTableProps } from 'quasar';
import { computed, useAttrs, useSlots } from 'vue';

export interface ManagedTableColumn extends QTableColumn {
  noMaxWidth?: boolean;
  isActionColumn?: boolean;
}

export interface ManagedTableBulkAction {
  key: string;
  label: string;
  icon?: string;
  color?: string;
  handler?: (rows: unknown[]) => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  disableWhenEmpty?: boolean;
}

const props = withDefaults(
  defineProps<{
    rows: unknown[];
    columns: ManagedTableColumn[];
    loading?: boolean;
    rowKey?: QTableProps['rowKey'];
    selection?: QTableProps['selection'];
    noDataLabel?: string;
    bulkActions?: ManagedTableBulkAction[];
    selectedRowsLabel?: QTableProps['selectedRowsLabel'];
  }>(),
  {
    loading: false,
    rowKey: 'id',
    selection: 'multiple',
    noDataLabel: undefined,
    bulkActions: () => [],
    selectedRowsLabel: undefined,
  },
);

const attrs = useAttrs();
const slots = useSlots();
const selectedProxy = defineModel<unknown[]>('selected', { default: [] });

const normalizedBulkActions = computed(() => props.bulkActions ?? []);
const hasTopContent = computed(
  () => normalizedBulkActions.value.length > 0 || Boolean(slots['top-left'] || slots['top-right']),
);

const enhancedColumns = computed(() =>
  props.columns.map((column) => {
    const baseClasses = column.classes ? [column.classes] : [];
    const headerClasses = column.headerClasses ? [column.headerClasses] : [];
    if (!column.noMaxWidth) {
      baseClasses.push('managed-table__cell');
      headerClasses.push('managed-table__cell');
    }
    if (column.isActionColumn) {
      baseClasses.push('managed-table__cell--actions');
      headerClasses.push('managed-table__cell--actions');
    }
    return {
      ...column,
      classes: baseClasses.join(' '),
      headerClasses: headerClasses.join(' '),
      align: column.isActionColumn ? 'right' : column.align,
    } as QTableColumn;
  }),
);

function bulkActionDisabled(action: ManagedTableBulkAction): boolean {
  if (action.disabled) return true;
  if (action.disableWhenEmpty === false) return false;
  return selectedProxy.value.length === 0;
}

async function triggerBulk(action: ManagedTableBulkAction): Promise<void> {
  if (bulkActionDisabled(action)) return;
  try {
    await action.handler?.(selectedProxy.value);
  } catch (error) {
    console.error(`Bulk action ${action.key} failed`, error);
  }
}
</script>

<style>
.managed-table tbody td {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ManagedTable',
});
</script>
