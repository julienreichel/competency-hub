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
        <q-btn
          color="primary"
          icon="add"
          :label="$t('competencies.addCompetency')"
          @click="openCreateDialog"
        />
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
        <competency-list :competencies="filteredCompetencies" @edit="openEditor" />
      </div>
    </q-card>

    <q-dialog v-model="dialog.open">
      <q-card style="min-width: 360px">
        <q-card-section>
          <div class="text-h6">{{ $t('competencies.createTitle') }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="form.name"
            :label="$t('competencies.fields.name')"
            :rules="[requiredRule]"
          />
          <q-input
            v-model="form.description"
            type="textarea"
            :label="$t('competencies.fields.description')"
          />
          <q-input
            v-model="form.objectives"
            type="textarea"
            :label="$t('competencies.fields.objectives')"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" color="primary" @click="closeDialog" />
          <q-btn
            color="primary"
            :label="$t('competencies.actions.create')"
            :loading="dialog.loading"
            @click="submitDialog"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import BreadcrumbHeader from 'src/components/common/BreadcrumbHeader.vue';
import type { Competency } from 'src/models/Competency';
import type { Domain } from 'src/models/Domain';
import { competencyRepository } from 'src/models/repositories/CompetencyRepository';
import { domainRepository } from 'src/models/repositories/DomainRepository';
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import CompetencyList from 'src/components/competency/CompetencyList.vue';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();

const domainId = route.params.domainId as string;
const domain = ref<Domain | null>(null);
const competencies = ref<Competency[]>([]);
const loading = ref(false);
const search = ref('');

const dialog = reactive({
  open: false,
  loading: false,
});

const form = reactive({
  name: '',
  description: '',
  objectives: '',
});

const requiredRule = (value: string): true | string =>
  value?.trim() ? true : t('validation.required');

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
    domain.value = await domainRepository.findById(domainId, true);
    competencies.value = domain.value?.competencies ?? [];
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
  if (dialog.loading) return;
  dialog.open = false;
}

async function submitDialog(): Promise<void> {
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
  void router.push({ name: 'competency-editor', params: { competencyId } });
}

onMounted(() => {
  void loadData();
});
</script>

<style scoped></style>
