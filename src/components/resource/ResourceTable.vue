import { CompetencyResource } from 'src/models/Competency';

<script setup lang="ts">
import UserDetailsDialog from 'src/components/ui/UserDetailsDialog.vue';
import { type CompetencyResource, type UpdateCompetencyInput } from 'src/models/Competency';
import { type User } from 'src/models/User';

import ResourceFormDialog from './ResourceFormDialog.vue';

import { ref } from 'vue';
const props = defineProps<{ items: CompetencyResource[] }>();
const emit = defineEmits<{
  (e: 'edit', payload: UpdateCompetencyInput): void;
  (e: 'delete', id: string): void;
}>();

const userDialogOpen = ref(false);
const userDialogUser = ref<User | null>(null);

function handleUpdate(payload: UpdateCompetencyInput): void {
  emit('edit', payload);
}

function openLink(url: string): void {
  window.open(url, '_blank');
}

async function openResourceFile(resource: CompetencyResource): Promise<void> {
  const url = await resource.resolveFileUrl();
  if (url) {
    window.open(url, '_blank');
  }
}

function showUserDetails(user: User): void {
  console.log(user);
  userDialogUser.value = user;
  userDialogOpen.value = true;
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
      { name: 'resource', label: 'Resource', field: 'resource', align: 'left' },
      { name: 'actions', label: '', field: 'id', align: 'right' },
    ]"
  >
    <template #body-cell-desc="slot">
      <td class="ellipsis-cell" :title="slot.row.description">
        {{ slot.row.description }}
      </td>
    </template>
    <template #body-cell-resource="slot">
      <td v-if="slot.row.type === 'Link' && slot.row.url" class="ellipsis-cell">
        <a
          :href="slot.row.url"
          target="_blank"
          rel="noopener"
          @click.prevent="openLink(slot.row.url)"
        >
          {{ slot.row.url }}
        </a>
      </td>
      <td v-else-if="slot.row.type === 'Document' && slot.row.fileKey" class="ellipsis-cell">
        <a href="#" @click.prevent="openResourceFile(slot.row)">Open</a>
      </td>
      <td v-else-if="slot.row.type === 'Human' && slot.row.personUserId" class="ellipsis-cell">
        <a href="#" @click.prevent="showUserDetails(slot.row.person)">{{ slot.row.person.name }}</a>
      </td>
      <td v-else-if="slot.row.type === 'Location'" class="ellipsis-cell"></td>
      <user-details-dialog
        :model-value="userDialogOpen"
        :user="userDialogUser"
        @update:model-value="userDialogOpen = $event"
      />
    </template>
    <template #body-cell-actions="slot">
      <div class="row justify-end q-gutter-xs">
        <resource-form-dialog label="Edit" :initial="slot.row" @update="handleUpdate" />
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

<style scoped>
.ellipsis-cell {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
