<script setup lang="ts">
import { useQuasar } from 'quasar';
import {
  type CompetencyResource,
  type CreateResourceInput,
  type SubCompetency,
  type UpdateResourceInput,
  type UpdateSubCompetencyInput,
} from 'src/models/Competency';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { resourceRepository } from 'src/models/repositories/ResourceRepository';
import { subCompetencyRepository } from 'src/models/repositories/SubCompetencyRepository';

import SubCompetencyForm from 'src/components/competency/SubCompetencyForm.vue';
import ResourceFormDialog from 'src/components/resource/ResourceFormDialog.vue';
import ResourceTable from 'src/components/resource/ResourceTable.vue';

const $q = useQuasar();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

let domainId = route.params.domainId as string | undefined;
const competencyId = route.params.competencyId as string;
const subId = route.params.subId as string;

const loading = ref(false);
const sub = ref<SubCompetency | null>(null);
const domainName = ref<string>(t('domains.title'));
const competencyName = ref<string>(t('competencies.title'));

onMounted(async () => {
  await load();

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

function goBack(): void {
  if (competencyId) {
    void router.push({ name: 'competency-editor', params: { competencyId } });
  } else {
    router.back();
  }
}

async function saveSub(updated: UpdateSubCompetencyInput): Promise<void> {
  await subCompetencyRepository.update(subId, updated);
  $q.notify({ type: 'positive', message: 'Sub-competency saved' });
  await load();
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

<template>
  <q-page padding>
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-btn flat round icon="arrow_back" color="primary" @click="goBack" />
      <div class="column">
        <q-breadcrumbs class="text-grey-7">
          <q-breadcrumbs-el
            :label="domainName"
            :to="{ name: 'domain-competencies', params: { domainId } }"
          />
          <q-breadcrumbs-el
            :label="competencyName"
            :to="{ name: 'competency-editor', params: { competencyId } }"
          />
          <q-breadcrumbs-el :label="sub && sub.name ? sub.name : t('subCompetencies.loading')" />
        </q-breadcrumbs>
        <div class="text-h5">{{ sub && sub.name ? sub.name : t('subCompetencies.loading') }}</div>
      </div>
      <q-space />
      <q-spinner v-if="loading" size="sm" />
    </div>

    <q-separator class="q-mb-lg" />

    <sub-competency-form v-if="sub" :model-value="sub" @save="saveSub" />

    <q-separator class="q-my-lg" />

    <div class="row items-center q-gutter-sm">
      <div class="text-h6">{{ t('resources.title') }}</div>
      <q-space />
      <resource-form-dialog
        :label="t('resources.addResource')"
        :sub-competency-id="subId"
        @create="createResource"
      />
    </div>

    <resource-table
      class="q-mt-md"
      :items="resources"
      @edit="updateResource"
      @delete="deleteResource"
    />
  </q-page>
</template>

<script lang="ts">
export default { name: 'SubCompetencyEditorPage' };
</script>
