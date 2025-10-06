<template>
  <q-page padding>
    <breadcrumb-header
      :breadcrumbs="[
        { label: domainName, to: { name: 'domain', params: { domainId } } },
        { label: competency?.name ?? t('competencies.loading') },
      ]"
      :title="competency?.name ?? t('competencies.loading')"
      :loading="loading"
      :back-target="{ name: 'domain', params: { domainId } }"
    >
      <template #default>
        <div class="row q-gutter-sm">
          <q-btn
            v-if="canManage && subs.length === 0 && !loading"
            color="negative"
            icon="delete"
            :label="t('common.delete')"
            @click="confirmDeleteCompetency"
          />
        </div>
      </template>
    </breadcrumb-header>

    <template v-if="competency">
      <competency-card
        v-if="!editing"
        :competency="competency"
        :show-edit="hasRole('Admin') || hasRole('Educator')"
        :show-progress="hasRole('Student')"
        @edit="editing = true"
      />
      <competency-details-form
        v-else
        :model-value="competency"
        @save="onSaveCompetency"
        @cancel="editing = false"
      />
    </template>

    <q-separator class="q-my-lg" />

    <div class="row items-center q-gutter-sm">
      <div class="text-h6">{{ t('competencies.subCompetencies') }}</div>
      <q-space />
      <q-btn
        v-if="canManage"
        color="secondary"
        icon="add"
        :label="t('competencies.addSubCompetency')"
        @click="openDialog"
      />
    </div>

    <sub-competency-list
      class="q-mt-md"
      :items="subs"
      :show-student-progress="hasRole('Student')"
      @open="openSubCompetency"
      @rename="renameSubCompetency"
      @delete="deleteSubCompetency"
    />

    <quick-add-sub-competency-dialog
      v-model="dialog"
      @submit="handleQuickAddSubCompetency"
      @cancel="dialog = false"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import BreadcrumbHeader from 'src/components/common/BreadcrumbHeader.vue';
import CompetencyCard from 'src/components/competency/CompetencyCard.vue';
import CompetencyDetailsForm from 'src/components/competency/CompetencyDetailsForm.vue';
import QuickAddSubCompetencyDialog from 'src/components/competency/QuickAddSubCompetencyDialog.vue';
import SubCompetencyList from 'src/components/competency/SubCompetencyList.vue';
import { useAuth } from 'src/composables/useAuth';
import { useUsers } from 'src/composables/useUsers';
import { type Competency, type UpdateCompetencyInput } from 'src/models/Competency';
import { type SubCompetency } from 'src/models/SubCompetency';
import { competencyRepository } from 'src/models/repositories/CompetencyRepository';
import { subCompetencyRepository } from 'src/models/repositories/SubCompetencyRepository';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const $q = useQuasar();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { hasRole } = useAuth();
const canManage = computed(() => hasRole('Admin') || hasRole('Educator'));

let domainId = route.params.domainId as string | undefined;
const domainName = ref<string>(t('domains.title'));
const competencyId = route.params.competencyId as string;
const loading = ref(false);
const competency = ref<Competency | null>(null);
const editing = ref(false);
const subs = ref<SubCompetency[]>([]);
const dialog = ref<boolean>(false);

const TITLE_PART_MAX_LENGTH = 20;

async function load(): Promise<void> {
  loading.value = true;
  try {
    const { getCurrentUser } = useUsers();
    const user = await getCurrentUser();

    const c = await competencyRepository.findById(competencyId, true);
    competency.value = c;
    domainId = c?.domainId;
    if (c?.domain?.name) domainName.value = c?.domain?.name;

    // Attach user progress to sub-competencies
    if (user && c) {
      c.attachUserProgress(user);
    }

    // Ensure stable level
    subs.value = (c?.subCompetencies ?? []).sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
  } finally {
    loading.value = false;
  }
}

async function onSaveCompetency(updated: UpdateCompetencyInput): Promise<void> {
  await competencyRepository.update(competencyId, updated);
  $q.notify({ type: 'positive', message: 'Competency saved' });
  await load();
  editing.value = false;
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
  await router.push({ name: 'sub-competency', params: { competencyId, subId: id } });
}

function openDialog(): void {
  dialog.value = true;
}

async function handleQuickAddSubCompetency(name: string): Promise<void> {
  const trimmed = name.trim();
  await addSubCompetency(trimmed.length > 0 ? trimmed : t('subCompetencies.name'));
  dialog.value = false;
}

function confirmDeleteCompetency(): void {
  if (!competency.value) return;
  $q.dialog({
    title: t('competencies.title'),
    message: t('competencies.messages.deleteConfirm', { name: competency.value.name }),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void deleteCompetency();
  });
}

async function deleteCompetency(): Promise<void> {
  if (!competency.value) return;
  try {
    await competencyRepository.delete(competency.value.id);
    $q.notify({ type: 'positive', message: t('competencies.messages.deleted') });
    await router.push({ name: 'domain', params: { domainId } });
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: t('competencies.messages.error') });
  }
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

watch(
  [domainName, competency],
  ([domain, comp]) => {
    const parts = [
      'Competency Hub',
      truncate(domain || '', TITLE_PART_MAX_LENGTH),
      truncate(comp?.name || '', TITLE_PART_MAX_LENGTH),
    ].filter(Boolean);
    document.title = parts.join(' | ');
  },
  { immediate: true },
);

onMounted(load);
</script>

<style scoped></style>
