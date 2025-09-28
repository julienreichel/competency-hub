<template>
  <div>
    <q-separator class="q-my-lg" />

    <div class="row items-center q-gutter-sm">
      <div class="text-h6">{{ t('resources.title') }}</div>
      <q-space />
      <resource-form-dialog
        v-if="canManage"
        v-model="createDialogOpen"
        :label="t('resources.addResource')"
        :sub-competency-id="subCompetencyId"
        @create="handleCreateResource"
      />
    </div>

    <resource-table
      class="q-mt-md"
      :items="resources"
      :show-actions="canManage"
      @edit="handleUpdateResource"
      @delete="handleDeleteResource"
    />
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuth } from 'src/composables/useAuth';
import ResourceFormDialog from 'src/components/resource/ResourceFormDialog.vue';
import ResourceTable from 'src/components/resource/ResourceTable.vue';
import {
  type CompetencyResource,
  type CreateResourceInput,
  type UpdateResourceInput,
  CompetencyResource as CompetencyResourceModel,
} from 'src/models/CompetencyResource';
import { resourceRepository } from 'src/models/repositories/ResourceRepository';

const props = defineProps<{
  subCompetencyId: string;
  initialResources?: CompetencyResource[];
}>();

const { hasRole } = useAuth();
const { t } = useI18n();
const $q = useQuasar();

const resources = ref<CompetencyResource[]>([]);
const createDialogOpen = ref(false);
const canManage = computed(() => hasRole('Admin') || hasRole('Educator'));

watch(
  () => props.initialResources,
  (value) => {
    if (Array.isArray(value)) {
      resources.value = value.map((item) =>
        item instanceof CompetencyResourceModel ? item : new CompetencyResourceModel(item),
      );
    } else {
      resources.value = [];
    }
  },
  { immediate: true },
);

async function handleCreateResource(payload: CreateResourceInput): Promise<void> {
  try {
    const created = await resourceRepository.create(payload);
    resources.value = [...resources.value, created];
    $q.notify({ type: 'positive', message: t('resources.messages.created') });
  } catch (error) {
    console.error('Failed to create resource', error);
    $q.notify({ type: 'negative', message: t('resources.messages.error') });
  }
}

async function handleUpdateResource(payload: UpdateResourceInput): Promise<void> {
  if (!payload.id) return;
  try {
    const updated = await resourceRepository.update(payload.id, payload);
    const index = resources.value.findIndex((item) => item.id === payload.id);
    if (index !== -1) {
      const next = [...resources.value];
      next.splice(index, 1, updated);
      resources.value = next;
    }
    $q.notify({ type: 'positive', message: t('resources.messages.updated') });
  } catch (error) {
    console.error('Failed to update resource', error);
    $q.notify({ type: 'negative', message: t('resources.messages.error') });
  }
}

async function handleDeleteResource(id: string): Promise<void> {
  const previous = [...resources.value];
  resources.value = resources.value.filter((resource) => resource.id !== id);
  try {
    await resourceRepository.delete(id);
    $q.notify({ type: 'positive', message: t('resources.messages.deleted') });
  } catch (error) {
    console.error('Failed to delete resource', error);
    resources.value = previous;
    $q.notify({ type: 'negative', message: t('resources.messages.error') });
  }
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SubCompetencyResourceManager',
});
</script>
