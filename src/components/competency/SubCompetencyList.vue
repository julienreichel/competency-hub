<script setup lang="ts">
import { type CreateSubCompetencyInput } from 'src/models/Competency';

const props = defineProps<{ items: CreateSubCompetencyInput[] }>();
const emit = defineEmits<{
  (e: 'edit', id: string): void;
  (e: 'rename', id: string, name: string): void;
  (e: 'delete', id: string): void;
  (e: 'move-up', id: string): void;
  (e: 'move-down', id: string): void;
}>();
</script>

<template>
  <q-table
    :rows="props.items"
    row-key="id"
    flat
    bordered
    :columns="[
      { name: 'order', label: '#', field: 'order', align: 'left', sortable: true },
      { name: 'name', label: 'Name', field: 'name', align: 'left' },
      { name: 'description', label: 'Description', field: 'description', align: 'left' },
      { name: 'actions', label: '', field: 'id', align: 'right' },
    ]"
  >
    <template #body-cell-actions="slot">
      <td iv class="justify-end q-gutter-xs">
        <q-btn flat dense size="sm" icon="arrow_upward" @click="emit('move-up', slot.row.id)" />
        <q-btn flat dense size="sm" icon="arrow_downward" @click="emit('move-down', slot.row.id)" />
        <q-btn flat dense size="sm" icon="edit" @click="emit('edit', slot.row.id)" />
        <q-btn
          flat
          dense
          size="sm"
          icon="delete"
          color="negative"
          @click="emit('delete', slot.row.id)"
        />
      </td>
    </template>
  </q-table>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SubCompetencyList',
});
</script>
