<template>
  <q-page class="q-pa-lg column q-gutter-lg">
    <breadcrumb-header
      :breadcrumbs="[
        { label: $t('domains.title'), to: { name: 'domains' } },
        { label: domain?.name ?? $t('domains.loading') },
      ]"
      :title="domain?.name ?? $t('domains.loading')"
      :loading="loading"
      :back-target="{ name: 'domains' }"
    >
      <template #default>
        <div class="row q-gutter-sm">
          <q-btn
            v-if="canManage"
            color="secondary"
            icon="add"
            :label="$t('competencies.addCompetency')"
            @click="openCreateDialog"
          />
          <q-btn
            v-if="hasRole('Admin') && competencies.length === 0 && !loading"
            color="negative"
            icon="delete"
            :label="$t('common.delete')"
            @click="confirmDeleteDomain"
          />
        </div>
      </template>
    </breadcrumb-header>

    <q-card flat bordered>
      <q-input
        v-model="search"
        dense
        outlined
        debounce="200"
        class="q-ma-md"
        :placeholder="$t('competencies.searchPlaceholder')"
        clearable
        prefix-icon="search"
      />

      <q-separator />

      <div v-if="loading" class="q-pa-lg column items-center justify-center">
        <q-spinner color="primary" size="32px" />
        <div class="text-caption text-grey-7 q-mt-sm">{{ $t('competencies.loading') }}</div>
      </div>

      <div v-else class="q-pa-md">
        <competency-list
          :competencies="filteredCompetencies"
          @open="openEditor"
          :show-progress="hasRole('Student')"
        />
      </div>
    </q-card>

    <create-competency-dialog
      v-model="dialog.open"
      :form="form"
      :loading="dialog.loading"
      @submit="submitDialog"
      @cancel="closeDialog"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import BreadcrumbHeader from 'src/components/common/BreadcrumbHeader.vue';
import { useAuth } from 'src/composables/useAuth';
import { useUsers } from 'src/composables/useUsers';
import type { Competency } from 'src/models/Competency';
import type { Domain } from 'src/models/Domain';
import { competencyRepository } from 'src/models/repositories/CompetencyRepository';
import { domainRepository } from 'src/models/repositories/DomainRepository';
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import CompetencyList from 'src/components/competency/CompetencyList.vue';
import CreateCompetencyDialog from 'src/components/competency/CreateCompetencyDialog.vue';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const { hasRole } = useAuth();
const { getCurrentUser } = useUsers();
const canManage = computed(() => hasRole('Admin') || hasRole('Educator'));

const domainId = route.params.domainId as string;
const domain = ref<Domain | null>(null);
const competencies = ref<Competency[]>([]);
const loading = ref(false);
const search = ref('');

type FormType = {
  name: string;
  description?: string;
  objectives?: string;
};

const dialog = reactive({
  open: false,
  loading: false,
});

const form = reactive({
  name: '',
  description: '',
  objectives: '',
});

const filteredCompetencies = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) {
    return competencies.value;
  }
  return competencies.value.filter((competency) =>
    [competency.name, competency.description, competency.objectives]
      .filter(Boolean)
      .some((field) => field?.toLowerCase().includes(term)),
  );
});

async function loadData(): Promise<void> {
  loading.value = true;
  try {
    const user = await getCurrentUser();

    domain.value = await domainRepository.findById(domainId, true);
    competencies.value = domain.value?.competencies ?? [];
    // Attach user progress to sub-competencies
    if (user) {
      competencies.value.forEach((c) => c.attachUserProgress(user));
    }

    // Attach user progress to sub-competencies
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: t('competencies.messages.loadError') });
  } finally {
    loading.value = false;
  }
}

function openCreateDialog(): void {
  dialog.open = true;
  form.name = '';
  form.description = '';
  form.objectives = '';
}

function closeDialog(): void {
  dialog.open = false;
}

async function submitDialog(form: FormType): Promise<void> {
  const trimmedName = form.name.trim();
  if (!trimmedName) {
    $q.notify({ type: 'warning', message: t('validation.required') });
    return;
  }

  dialog.loading = true;
  try {
    const created = await competencyRepository.create({
      domainId,
      name: trimmedName,
      description: form.description || null,
      objectives: form.objectives || null,
    });
    competencies.value = [...competencies.value, created];
    closeDialog();
    $q.notify({ type: 'positive', message: t('competencies.messages.created') });
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: t('competencies.messages.error') });
  } finally {
    dialog.loading = false;
  }
}

function openEditor(competencyId: string): void {
  void router.push({ name: 'competency', params: { competencyId } });
}

function confirmDeleteDomain(): void {
  if (!domain.value) return;
  $q.dialog({
    title: t('domains.title'),
    message: t('domains.messages.deleteConfirm', { name: domain.value.name }),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void deleteDomain();
  });
}

async function deleteDomain(): Promise<void> {
  if (!domain.value) return;
  try {
    await domainRepository.delete(domain.value.id);
    $q.notify({ type: 'positive', message: t('domains.messages.deleted') });
    await router.push({ name: 'domains' });
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: t('domains.messages.error') });
  }
}

onMounted(() => {
  void loadData();
});
</script>

<style scoped></style>
