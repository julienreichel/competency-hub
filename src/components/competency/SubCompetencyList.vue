<script setup lang="ts">
import { type CreateSubCompetencyInput } from 'src/models/Competency';
import { ref } from 'vue';

const props = defineProps<{ items: CreateSubCompetencyInput[] }>();
const emit = defineEmits<{
  (e: 'edit', id: string): void;
  (e: 'rename', id: string, name: string): void;
  (e: 'delete', id: string): void;
  (e: 'move-up', id: string): void;
  (e: 'move-down', id: string): void;
}>();

const renamingId = ref<string | null>(null);
const renameValue = ref<string>('');
function startRename(row: CreateSubCompetencyInput): void {
  if (!row.id) return;
  renamingId.value = row.id;
  renameValue.value = row.name;
}
function confirmRename(row: CreateSubCompetencyInput): void {
  if (!row.id) return;
  emit('rename', row.id, renameValue.value || row.name);
  renamingId.value = null;
}
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
      { name: 'actions', label: '', field: 'id', align: 'right' },
    ]"
  >
    <template #body-cell-name="slot">
      <div v-if="renamingId === slot.row.id" class="row items-center q-gutter-sm">
        <div class="col">
          <q-input v-model="renameValue" dense autofocus @keyup.enter="confirmRename(slot.row)" />
        </div>
        <q-btn flat dense icon="check" @click="confirmRename(slot.row)" />
        <q-btn flat dense icon="close" @click="renamingId = null" />
      </div>
      <div v-else class="row items-center no-wrap">
        <div class="text-weight-medium">{{ slot.row.name }}</div>
        <q-space />
      </div>
    </template>

    <template #body-cell-actions="slot">
      <div class="row justify-end q-gutter-xs">
        <q-btn flat dense size="sm" icon="arrow_upward" @click="emit('move-up', slot.row.id)" />
        <q-btn flat dense size="sm" icon="arrow_downward" @click="emit('move-down', slot.row.id)" />
        <q-btn flat dense size="sm" icon="edit" @click="emit('edit', slot.row.id)" />
        <q-btn
          flat
          dense
          size="sm"
          icon="drive_file_rename_outline"
          @click="startRename(slot.row)"
        />
        <q-btn
          flat
          dense
          size="sm"
          icon="delete"
          color="negative"
          @click="emit('delete', slot.row.id)"
        />
      </div>
    </template>
  </q-table>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SubCompetencyList',
});
</script>
