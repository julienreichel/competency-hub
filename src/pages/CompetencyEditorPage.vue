<template>
  <q-page padding>
    <breadcrumb-header
      :breadcrumbs="[
        { label: domainName, to: { name: 'domain-competencies', params: { domainId } } },
        { label: competency?.name ?? t('competencies.loading') },
      ]"
      :title="competency?.name ?? t('competencies.loading')"
      :loading="loading"
      :back-target="{ name: 'domain-competencies', params: { domainId } }"
    />

    <q-separator class="q-mb-md" />

    <competency-details-form v-if="competency" :model-value="competency" @save="saveCompetency" />

    <q-separator class="q-my-lg" />

    <div class="row items-center q-gutter-sm">
      <div class="text-h6">{{ t('competencies.subCompetencies') }}</div>
      <q-space />
      <q-btn color="primary" :label="t('competencies.addSubCompetency')" @click="openDialog" />
    </div>

    <sub-competency-list
      class="q-mt-md"
      :items="subs"
      @open="openSubCompetency"
      @rename="renameSubCompetency"
      @delete="deleteSubCompetency"
    />

    <quick-add-sub-competency-dialog
      v-model="dialog"
      v-model:addName="addName"
      @submit="closeDialog"
      @cancel="dialog = false"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import BreadcrumbHeader from 'src/components/common/BreadcrumbHeader.vue';
import CompetencyDetailsForm from 'src/components/competency/CompetencyDetailsForm.vue';
import QuickAddSubCompetencyDialog from 'src/components/competency/QuickAddSubCompetencyDialog.vue';
import SubCompetencyList from 'src/components/competency/SubCompetencyList.vue';
import {
  type Competency,
  type SubCompetency,
  type UpdateCompetencyInput,
} from 'src/models/Competency';
import { competencyRepository } from 'src/models/repositories/CompetencyRepository';
import { subCompetencyRepository } from 'src/models/repositories/SubCompetencyRepository';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const $q = useQuasar();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

let domainId = route.params.domainId as string | undefined;
const domainName = ref<string>(t('domains.title'));
const competencyId = route.params.competencyId as string;
const loading = ref(false);
const competency = ref<Competency | null>(null);
const subs = ref<SubCompetency[]>([]);
const addName = ref<string>('');
const dialog = ref<boolean>(false);

async function load(): Promise<void> {
  loading.value = true;
  try {
    // Expect repo to return competency + subCompetencies array (or fetch separately)
    const c = await competencyRepository.findById(competencyId, true);
    competency.value = c;
    domainId = c?.domainId;
    if (c?.domain?.name) domainName.value = c?.domain?.name;
    // Ensure stable level
    subs.value = (c?.subCompetencies ?? []).sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
  } finally {
    loading.value = false;
  }
}

async function saveCompetency(updated: UpdateCompetencyInput): Promise<void> {
  await competencyRepository.update(competencyId, updated);
  $q.notify({ type: 'positive', message: 'Competency saved' });
  await load();
}

async function addSubCompetency(name: string): Promise<void> {
  const nextOrder = (subs.value[subs.value.length - 1]?.level ?? 0) + 1;
  const created = await subCompetencyRepository.create({
    competencyId,
    name,
    level: nextOrder,
  });
  subs.value.push(created);
  $q.notify({ type: 'positive', message: 'Sub-competency added' });
}

async function renameSubCompetency(id: string, name: string): Promise<void> {
  const found = subs.value.find((s) => s.id === id);
  if (!found) return;
  found.name = name;
  await subCompetencyRepository.update(id, { id, name });
  $q.notify({ type: 'positive', message: 'Renamed' });
}

async function deleteSubCompetency(id: string): Promise<void> {
  await subCompetencyRepository.delete(id);
  subs.value = subs.value.filter((s) => s.id !== id);
  $q.notify({ type: 'positive', message: 'Deleted' });
}

async function openSubCompetency(id: string): Promise<void> {
  await router.push({ name: 'sub-competency-editor', params: { competencyId, subId: id } });
}

function openDialog(): void {
  addName.value = '';
  dialog.value = true;
}

async function closeDialog(): Promise<void> {
  await addSubCompetency(addName.value || 'New sub-competency');
  dialog.value = false;
}

onMounted(load);
</script>

<style scoped></style>
