<template>
  <q-card flat bordered>
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
        <q-btn
          v-if="showOpen !== false"
          flat
          color="primary"
          icon="arrow_forward"
          @click="$emit('open', resource.id)"
        />
        <resource-form-dialog
          v-if="showEdit"
          :initial="resource"
          :sub-competency-id="resource.subCompetencyId"
          @update="$emit('edit', $event)"
        />
        <q-btn
          v-if="showDelete"
          flat
          color="negative"
          icon="delete"
          @click="$emit('delete', resource.id)"
        />
      </div>
    </q-card-section>
    <user-details-dialog :model-value="userDialogOpen" :user="userDialogUser" />
  </q-card>
</template>

<script setup lang="ts">
import UserDetailsDialog from 'src/components/ui/UserDetailsDialog.vue';
import type { UpdateCompetencyInput } from 'src/models/Competency';
import type { CompetencyResource } from 'src/models/CompetencyResource';
import type { User } from 'src/models/User';
import { ref } from 'vue';
import ResourceFormDialog from './ResourceFormDialog.vue';

defineProps<{
  resource: CompetencyResource;
  showOpen?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
}>();

defineEmits<{
  (e: 'open', id: string): void;
  (e: 'edit', payload: UpdateCompetencyInput): void;
  (e: 'delete', id: string): void;
}>();

const userDialogOpen = ref(false);
const userDialogUser = ref<User | null>(null);

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
  userDialogUser.value = user;
  userDialogOpen.value = true;
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'ResourceCard',
});
</script>
