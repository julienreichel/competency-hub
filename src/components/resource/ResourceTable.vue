<script setup lang="ts">
import { type CreateResourceInput, type UpdateCompetencyInput } from 'src/models/Competency';
import ResourceFormDialog from './ResourceFormDialog.vue';

const props = defineProps<{ items: CreateResourceInput[] }>();
const emit = defineEmits<{
  (e: 'edit', payload: UpdateCompetencyInput): void;
  (e: 'delete', id: string): void;
}>();

function handleUpdate(payload: UpdateCompetencyInput): void {
  emit('edit', payload);
}
</script>

<template>
  <q-table
    flat
    bordered
    :rows="props.items"
    row-key="id"
    :columns="[
      { name: 'type', label: 'Type', field: 'type', align: 'left' },
      { name: 'name', label: 'Name', field: 'name', align: 'left' },
      { name: 'desc', label: 'Description', field: 'description', align: 'left' },
      { name: 'url', label: 'URL', field: 'url', align: 'left' },
      { name: 'file', label: 'File key', field: 'fileKey', align: 'left' },
      { name: 'actions', label: '', field: 'id', align: 'right' },
    ]"
  >
    <template #body-cell-actions="slot">
      <div class="row justify-end q-gutter-xs">
        <resource-form-dialog
          dense
          flat
          color="primary"
          label="Edit"
          :initial="slot.row"
          @update="handleUpdate"
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
  name: 'ResourceTable',
});
</script>
