<template>
  <q-page class="q-pa-lg column q-gutter-lg">
    <div class="row items-center q-gutter-sm">
      <q-btn flat round icon="arrow_back" color="primary" @click="goBack" />
      <div class="column">
        <div class="text-caption text-grey-7">{{ $t('domains.title') }}</div>
        <div class="text-h5">{{ domain?.name ?? $t('domains.loading') }}</div>
      </div>
      <q-space />
      <q-btn
        color="primary"
        icon="add"
        :label="$t('competencies.addCompetency')"
        @click="openCreateDialog"
      />
    </div>

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
        <div v-if="filteredCompetencies.length === 0" class="text-grey-6 text-center q-mt-lg">
          {{ $t('competencies.emptyState') }}
        </div>
        <div v-else class="column q-gutter-md">
          <q-card v-for="competency in filteredCompetencies" :key="competency.id" flat bordered>
            <q-card-section class="row items-center justify-between q-gutter-sm">
              <div>
                <div class="text-subtitle1">{{ competency.name }}</div>
                <div class="text-caption text-grey-7">
                  {{ competency.description || $t('competencies.noDescription') }}
                </div>
              </div>
              <div class="row items-center q-gutter-sm">
                <q-btn
                  flat
                  color="primary"
                  icon="edit"
                  :label="$t('common.edit')"
                  @click="openEditor(competency.id)"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
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
import { useRoute, useRouter } from 'vue-router';
import { onMounted, reactive, ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { domainRepository } from 'src/models/repositories/DomainRepository';
import { competencyRepository } from 'src/models/repositories/CompetencyRepository';
import type { Competency } from 'src/models/Competency';
import type { Domain } from 'src/models/Domain';

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

function goBack(): void {
  void router.push({ name: 'domains' });
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
