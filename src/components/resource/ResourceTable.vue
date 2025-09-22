<template>
  <div>
    <div v-if="props.items.length === 0" class="text-grey-6 text-center q-mt-lg">
      {{ t('resources.emptyState') }}
    </div>
    <div v-else class="column q-gutter-md">
      <q-card v-for="resource in props.items" :key="resource.id" flat bordered>
        <q-card-section class="row items-center justify-between q-gutter-sm">
          <div>
            <div class="text-subtitle2">{{ resource.type }}</div>
            <div class="text-subtitle1">{{ resource.name }}</div>
            <div class="text-caption text-grey-7">
              {{ resource.description }}
            </div>
            <div v-if="resource.type === 'Link' && resource.url">
              <a
                :href="resource.url"
                target="_blank"
                rel="noopener"
                @click.prevent="openLink(resource.url)"
              >
                {{ resource.url }}
              </a>
            </div>
            <div v-else-if="resource.type === 'Document' && resource.fileKey">
              <a href="#" @click.prevent="openResourceFile(resource)">Open</a>
            </div>
            <div v-else-if="resource.type === 'Human' && resource.personUserId && resource.person">
              <a href="#" @click.prevent="showUserDetails(resource.person)">{{
                resource.person.name
              }}</a>
            </div>
          </div>
          <div class="row items-center q-gutter-xs">
            <resource-form-dialog label="Edit" :initial="resource" @update="handleUpdate" />
            <q-btn flat color="negative" icon="delete" @click="emit('delete', resource.id)" />
          </div>
        </q-card-section>
        <user-details-dialog
          :model-value="userDialogOpen"
          :user="userDialogUser"
          @update:model-value="userDialogOpen = $event"
        />
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import UserDetailsDialog from 'src/components/ui/UserDetailsDialog.vue';
import { type CompetencyResource, type UpdateCompetencyInput } from 'src/models/Competency';
import { type User } from 'src/models/User';

import ResourceFormDialog from './ResourceFormDialog.vue';

import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const props = defineProps<{ items: CompetencyResource[] }>();
const emit = defineEmits<{
  (e: 'edit', payload: UpdateCompetencyInput): void;
  (e: 'delete', id: string): void;
}>();

const { t } = useI18n();
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

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ResourceTable',
});
</script>
