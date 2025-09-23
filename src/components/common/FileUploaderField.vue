<template>
  <div>
    <div class="text-caption q-mb-xs">{{ label }}</div>
    <amplify-uploader
      v-if="!modelValue"
      class="full-width"
      :accept="accept || 'application/pdf, image/*'"
      :max-files="1"
      auto-upload
      :factory="uploadFactory"
      @uploaded="onUploaded"
    />
    <div v-else class="q-mt-xs row items-center q-gutter-sm">
      <q-btn
        v-if="fileUrl"
        :label="$t('resource.openFile')"
        icon="open_in_new"
        class="text-weight-bold"
        @click="openFile"
        :aria-label="$t('resource.openFile')"
      />
      <q-spinner v-else size="sm" color="primary" />
      <q-btn
        color="negative"
        icon="delete"
        size="md"
        class="q-ml-md q-px-md q-py-xs text-weight-bold"
        :label="$t('common.clear')"
        @click="$emit('update:modelValue', null)"
        :aria-label="$t('common.clear')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getUrl } from 'aws-amplify/storage';
import { ref, watch } from 'vue';

import AmplifyUploader from 'src/components/utils/AmplifyUploader';

type UploadedFilePreview = File & { path?: string; url?: string };

const props = defineProps<{
  modelValue?: string | null | undefined;
  subCompetencyId: string;
  label?: string;
  accept?: string[] | string;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string | null): void }>();

function openFile(): void {
  if (fileUrl.value) {
    window.open(fileUrl.value, '_blank', 'noopener');
  }
}

const fileUrl = ref<string | null>(null);

async function resolveFileUrl(key: string | null | undefined): Promise<void> {
  if (!key) {
    fileUrl.value = null;
    return;
  }
  try {
    const { url } = await getUrl({ path: key });
    fileUrl.value = url.toString();
  } catch (error) {
    console.error('Failed to resolve file URL', error);
    fileUrl.value = null;
  }
}

watch(
  () => props.modelValue,
  (key) => {
    void resolveFileUrl(key);
  },
  { immediate: true },
);

function uploadFactory(_: UploadedFilePreview[]): {
  folder: (file: UploadedFilePreview) => string;
  filename: (file: UploadedFilePreview) => string;
} {
  return {
    folder: () => `protected/resource/${props.subCompetencyId}`,
    filename: (file) => file.name,
  };
}

function onUploaded(payload: { files?: UploadedFilePreview[] }): void {
  const file = payload.files?.[0];
  const key = file?.path || null;
  emit('update:modelValue', key);
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FileUploaderField',
});
</script>
