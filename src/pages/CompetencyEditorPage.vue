<template>
  <q-page class="q-pa-lg column q-gutter-lg">
    <div class="row items-center q-gutter-sm">
      <q-btn flat round icon="arrow_back" color="primary" @click="goBack" />
      <div class="column">
        <div class="text-caption text-grey-7">{{ $t('competencies.editor.breadcrumb') }}</div>
        <div class="text-h5">{{ detailsForm.name || $t('competencies.editor.loading') }}</div>
      </div>
      <q-space />
      <q-btn
        color="primary"
        icon="save"
        :label="$t('competencies.actions.save')"
        :loading="saving"
        :disable="!isDirty"
        @click="saveDetails"
      />
    </div>

    <q-card flat bordered>
      <q-tabs v-model="activeTab" color="primary" align="left" narrow-indicator>
        <q-tab name="details" :label="$t('competencies.editor.tabs.details')" icon="description" />
        <q-tab name="stages" :label="$t('competencies.editor.tabs.stages')" icon="timeline" />
        <q-tab name="resources" :label="$t('competencies.editor.tabs.resources')" icon="link" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel name="details">
          <q-form class="column q-gutter-md q-pa-md">
            <q-input
              v-model="detailsForm.name"
              :label="$t('competencies.fields.name')"
              :rules="[requiredRule]"
            />
            <q-input
              v-model="detailsForm.description"
              type="textarea"
              :label="$t('competencies.fields.description')"
            />
            <q-input
              v-model="detailsForm.objectives"
              type="textarea"
              :label="$t('competencies.fields.objectives')"
            />
          </q-form>
        </q-tab-panel>

        <q-tab-panel name="stages" class="q-pa-md text-grey-7">
          <div class="text-subtitle1 q-mb-sm">
            {{ $t('competencies.editor.stages.placeholder.title') }}
          </div>
          <div>{{ $t('competencies.editor.stages.placeholder.description') }}</div>
        </q-tab-panel>

        <q-tab-panel name="resources" class="q-pa-md text-grey-7">
          <div class="text-subtitle1 q-mb-sm">
            {{ $t('competencies.editor.resources.placeholder.title') }}
          </div>
          <div>{{ $t('competencies.editor.resources.placeholder.description') }}</div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { competencyRepository } from 'src/models/repositories/CompetencyRepository';
import type { Competency } from 'src/models/Competency';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();

const competencyId = route.params.competencyId as string;
const competency = ref<Competency | null>(null);
const saving = ref(false);
const activeTab = ref<'details' | 'stages' | 'resources'>('details');

const detailsForm = reactive({
  name: '',
  description: '',
  objectives: '',
});

const requiredRule = (value: string): true | string =>
  value?.trim() ? true : t('validation.required');

const isDirty = computed(
  () =>
    competency.value !== null &&
    (detailsForm.name !== competency.value.name ||
      (detailsForm.description ?? '') !== (competency.value.description ?? '') ||
      (detailsForm.objectives ?? '') !== (competency.value.objectives ?? '')),
);

async function loadCompetency(): Promise<void> {
  try {
    const loaded = await competencyRepository.findById(competencyId, { includeDetails: true });
    if (!loaded) {
      $q.notify({ type: 'negative', message: t('competencies.editor.messages.notFound') });
      void router.push({ name: 'domains' });
      return;
    }
    competency.value = loaded;
    detailsForm.name = loaded.name;
    detailsForm.description = loaded.description ?? '';
    detailsForm.objectives = loaded.objectives ?? '';
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: t('competencies.editor.messages.loadError') });
  }
}

function goBack(): void {
  if (!competency.value) {
    void router.push({ name: 'domains' });
    return;
  }
  void router.push({
    name: 'domain-competencies',
    params: { domainId: competency.value.domainId },
  });
}

async function saveDetails(): Promise<void> {
  if (!competency.value) {
    return;
  }
  const trimmedName = detailsForm.name.trim();
  if (!trimmedName) {
    $q.notify({ type: 'warning', message: t('validation.required') });
    return;
  }

  saving.value = true;
  try {
    const updated = await competencyRepository.update(competency.value.id, {
      name: trimmedName,
      description: detailsForm.description || null,
      objectives: detailsForm.objectives || null,
    });
    competency.value = updated;
    detailsForm.name = updated.name;
    detailsForm.description = updated.description ?? '';
    detailsForm.objectives = updated.objectives ?? '';
    $q.notify({ type: 'positive', message: t('competencies.editor.messages.saved') });
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: t('competencies.editor.messages.saveError') });
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadCompetency();
});
</script>

<style scoped></style>
