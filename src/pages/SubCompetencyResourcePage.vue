<template>
  <q-page padding>
    <breadcrumb-header
      :breadcrumbs="[
        { label: domainName, to: { name: 'domain-competencies', params: { domainId } } },
        {
          label: competencyName,
          to: { name: 'competency-sub-competency', params: { competencyId } },
        },
        { label: sub && sub.name ? sub.name : t('subCompetencies.loading') },
      ]"
      :title="sub && sub.name ? sub.name : t('subCompetencies.loading')"
      :loading="loading"
      :back-target="{ name: 'competency-sub-competency', params: { competencyId } }"
    />

    <template v-if="sub">
      <sub-competency-card
        v-if="!editing"
        :sub="sub"
        :show-edit="hasRole('Admin') || hasRole('Educator')"
        :show-student-progress="hasRole('Student')"
        @edit="editing = true"
      />
      <sub-competency-form v-else :model-value="sub" @save="onSaveSub" @cancel="editing = false" />
    </template>

    <q-separator class="q-my-lg" />

    <div class="row items-center q-gutter-sm">
      <div class="text-h6">{{ t('resources.title') }}</div>
      <q-space />
      <resource-form-dialog
        v-if="hasRole('Admin') || hasRole('Educator')"
        :label="t('resources.addResource')"
        :sub-competency-id="subId"
        @create="createResource"
      />
    </div>

    <resource-table
      class="q-mt-md"
      :items="resources"
      :show-actions="hasRole('Admin') || hasRole('Educator')"
      @edit="updateResource"
      @delete="deleteResource"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import BreadcrumbHeader from 'src/components/common/BreadcrumbHeader.vue';
import { useUsers } from 'src/composables/useUsers';
import {
  type CompetencyResource,
  type CreateResourceInput,
  type UpdateResourceInput,
} from 'src/models/CompetencyResource';
import { type SubCompetency, type UpdateSubCompetencyInput } from 'src/models/SubCompetency';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import { resourceRepository } from 'src/models/repositories/ResourceRepository';
import { subCompetencyRepository } from 'src/models/repositories/SubCompetencyRepository';

import SubCompetencyCard from 'src/components/competency/SubCompetencyCard.vue';
import SubCompetencyForm from 'src/components/competency/SubCompetencyForm.vue';
import ResourceFormDialog from 'src/components/resource/ResourceFormDialog.vue';
import ResourceTable from 'src/components/resource/ResourceTable.vue';
import { useAuth } from 'src/composables/useAuth';

const $q = useQuasar();
const { t } = useI18n();
const route = useRoute();
const { hasRole } = useAuth();

let domainId = route.params.domainId as string | undefined;
const competencyId = route.params.competencyId as string;
const subId = route.params.subId as string;

const loading = ref(false);
const sub = ref<SubCompetency | null>(null);
const editing = ref(false);
const domainName = ref<string>(t('domains.title'));
const competencyName = ref<string>(t('competencies.title'));

onMounted(async () => {
  await load();

  // Attach user progress to sub-competency
  const { getCurrentUser } = useUsers();
  const user = await getCurrentUser();
  if (user && sub.value) {
    sub.value.attachUserProgressAndValidations(user);
  }

  if (!sub.value?.competency?.name) return;
  competencyName.value = sub.value.competency.name;

  if (!sub.value?.competency?.domain?.name) return;
  domainName.value = sub.value.competency.domain?.name;
  domainId = sub.value.competency.domainId;
});
const resources = ref<CompetencyResource[]>([]);

async function load(): Promise<void> {
  loading.value = true;
  try {
    sub.value = await subCompetencyRepository.findById(subId);
    resources.value = sub.value?.resources ?? [];
  } finally {
    loading.value = false;
  }
}

async function onSaveSub(updated: UpdateSubCompetencyInput): Promise<void> {
  await subCompetencyRepository.update(subId, updated);
  $q.notify({ type: 'positive', message: 'Sub-competency saved' });
  await load();
  editing.value = false;
}

async function createResource(payload: CreateResourceInput): Promise<void> {
  const created = await resourceRepository.create(payload);
  resources.value.push(created);
  $q.notify({ type: 'positive', message: 'CompetencyResource added' });
}

async function updateResource(payload: UpdateResourceInput): Promise<void> {
  if (!payload.id) return;
  const updatedResource = await resourceRepository.update(payload.id, payload);
  const idx = resources.value.findIndex((r) => r.id === payload.id);
  if (idx !== -1) resources.value[idx] = updatedResource;
  $q.notify({ type: 'positive', message: 'CompetencyResource updated' });
}

async function deleteResource(id: string): Promise<void> {
  await resourceRepository.delete(id);
  resources.value = resources.value.filter((r) => r.id !== id);
  $q.notify({ type: 'positive', message: 'CompetencyResource deleted' });
}

onMounted(load);
</script>

<script lang="ts">
export default { name: 'SubCompetencyEditorPage' };
</script>
