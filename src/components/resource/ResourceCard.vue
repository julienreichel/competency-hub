<template>
  <base-card
    :clickable="allowOpen"
    :show-open-action="allowOpen"
    :show-edit-action="showEdit"
    :show-delete-action="showDelete"
    @card-click="$emit('open', resource.id)"
    @open="$emit('open', resource.id)"
    @edit="openEditDialog"
    @delete="$emit('delete', resource.id)"
  >
    <template #default>
      <div class="text-subtitle2">{{ resource.type }}</div>
      <div class="text-subtitle1">{{ resource.name }}</div>
      <div class="text-caption text-grey-7">
        {{ resource.description }}
      </div>
      <div v-if="showUser && resource.person">
        <a href="#" @click.prevent="showUserDetails(resource.person)">{{
          resource.person?.name
        }}</a>
      </div>
    </template>

    <template #actions-before>
      <q-btn
        v-if="showLinkIcon"
        flat
        dense
        color="primary"
        icon="open_in_new"
        @click.stop="handleOpen"
      />
    </template>

    <template #actions-after>
      <resource-form-dialog
        v-if="showEdit"
        v-model="editDialogOpen"
        :initial="resource"
        :sub-competency-id="resource.subCompetencyId"
        @update="$emit('edit', $event)"
      />
    </template>
  </base-card>
  <user-details-dialog v-model="userDialogOpen" :user="userDialogUser" />
</template>

<script setup lang="ts">
import UserDetailsDialog from 'src/components/ui/UserDetailsDialog.vue';
import type { UpdateCompetencyInput } from 'src/models/Competency';
import { type CompetencyResource, ResourceType } from 'src/models/CompetencyResource';
import type { User } from 'src/models/User';
import { computed, ref } from 'vue';
import ResourceFormDialog from './ResourceFormDialog.vue';
import BaseCard from 'src/components/common/BaseCard.vue';

const props = defineProps<{
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
const editDialogOpen = ref(false);
const showLink = computed(() => props.resource.type === ResourceType.LINK && props.resource.url);
const showLDocument = computed(
  () => props.resource.type === ResourceType.DOCUMENT && props.resource.fileKey,
);
const showUser = computed(
  () =>
    props.resource.type === ResourceType.HUMAN &&
    props.resource.personUserId &&
    props.resource.person,
);

const showLinkIcon = computed(() => showLink.value || showLDocument.value || showUser.value);
async function handleOpen(): Promise<void> {
  if (showLink.value && props.resource.url) {
    openLink(props.resource.url);
  }
  if (showLDocument.value) {
    await openResourceFile(props.resource);
  }
  if (showUser.value && props.resource.person) {
    showUserDetails(props.resource.person);
  }
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
  userDialogUser.value = user;
  userDialogOpen.value = true;
}

const allowOpen = computed(() => props.showOpen !== false);
const showEdit = computed(() => props.showEdit !== false);
const showDelete = computed(() => props.showDelete !== false);

function openEditDialog(): void {
  editDialogOpen.value = true;
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'ResourceCard',
});
</script>
