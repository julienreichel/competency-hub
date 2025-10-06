<template>
  <q-btn
    color="primary"
    icon="download"
    :label="t('domains.actions.exportJson')"
    :disable="!domain || exporting || importLoading"
    @click="onExport"
  />
  <q-btn
    color="primary"
    icon="upload"
    :label="t('domains.actions.importJson')"
    :loading="importLoading"
    :disable="!domain || exporting"
    @click="triggerImport"
  />
  <input
    ref="fileInputRef"
    type="file"
    accept="application/json"
    class="hidden-input"
    @change="onFileSelected"
  />
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { parseDomainJson, useDomainJsonSync } from 'src/composables/useDomainJsonSync';
import type { Competency } from 'src/models/Competency';
import type { Domain } from 'src/models/Domain';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  domain: Domain | null;
  competencies: Competency[];
}>();

const emit = defineEmits<{
  (event: 'refresh'): void;
}>();

const $q = useQuasar();
const { t } = useI18n();
const fileInputRef = ref<HTMLInputElement | null>(null);
const exporting = ref(false);

const { importDomainFromJson, exportDomainToJson, importLoading } = useDomainJsonSync();

const normalizedCompetencies = computed(() => props.competencies ?? []);

const resetFileInput = (): void => {
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

const buildFilename = (domainName: string): string => {
  const MAX_LENGTH = 60;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const slug = domainName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LENGTH);
  return `${slug || 'domain'}-${timestamp}.json`;
};

const downloadFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const onExport = (): void => {
  if (!props.domain) {
    $q.notify({ type: 'warning', message: t('domains.messages.exportUnavailable') });
    return;
  }

  try {
    exporting.value = true;
    const json = exportDomainToJson(props.domain);
    downloadFile(json, buildFilename(props.domain.name));
    $q.notify({ type: 'positive', message: t('domains.messages.exportSuccess') });
  } catch (error) {
    console.error('Failed to export domain JSON', error);
    $q.notify({ type: 'negative', message: t('domains.messages.exportError') });
  } finally {
    exporting.value = false;
  }
};

const triggerImport = (): void => {
  fileInputRef.value?.click();
};

const onFileSelected = async (event: Event): Promise<void> => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file || !props.domain) {
    resetFileInput();
    return;
  }

  try {
    const content = await file.text();
    const payload = parseDomainJson(content);
    const summary = await importDomainFromJson(payload, {
      currentDomain: props.domain,
      existingCompetencies: normalizedCompetencies.value,
    });
    const summaryItems = [
      t('domains.dialogs.importSummary.competencies', {
        created: summary.competencies.created,
        updated: summary.competencies.updated,
      }),
      t('domains.dialogs.importSummary.subCompetencies', {
        created: summary.subCompetencies.created,
        updated: summary.subCompetencies.updated,
      }),
      t('domains.dialogs.importSummary.resources', {
        created: summary.resources.created,
        updated: summary.resources.updated,
      }),
      t('domains.dialogs.importSummary.evaluations', {
        created: summary.evaluations.created,
        updated: summary.evaluations.updated,
      }),
    ];

    $q.dialog({
      title: t('domains.dialogs.importSummary.title'),
      message: `<ul>${summaryItems.map((item) => `<li>${item}</li>`).join('')}</ul>`,
      html: true,
    });
    emit('refresh');
  } catch (error) {
    console.error('Failed to import domain JSON', error);
    const message = error instanceof Error ? error.message : t('domains.messages.importError');
    $q.notify({ type: 'negative', message });
  } finally {
    resetFileInput();
  }
};
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'DomainJsonManager',
});
</script>

<style scoped>
.hidden-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
