<script setup lang="ts">
import AmplifyUploader from 'src/components/utils/AmplifyUploader';

type UploadedFilePreview = File & {
  path?: string;
  url?: string;
};

/**
 * Wrapper for your project's <amplify-uploader> (as used in UserProfileForm.vue).
 * It emits update:modelValue with the uploaded file's S3 key.
 *
 * If your uploader emits a different event/payload, adjust 'onUploaded' accordingly.
 */
defineProps<{
  modelValue?: string | null | undefined;
  label?: string;
  accept?: string[] | string;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string | null): void }>();

function onUploaded(payload: { files?: UploadedFilePreview[] }): void {
  // Accept either single file object or array
  const file = payload.files?.[0];
  const key = file?.path || null;
  emit('update:modelValue', key);
}
</script>

<template>
  <div>
    <div class="text-caption q-mb-xs">{{ label || 'Upload file' }}</div>
    <!-- Your project-specific uploader component -->
    <amplify-uploader
      :accept="accept || 'application/pdf, image/*'"
      :max-files="1"
      auto-upload
      @uploaded="onUploaded"
    />
    <div v-if="modelValue" class="q-mt-xs text-caption">
      Saved key: <code>{{ modelValue }}</code>
      <q-btn flat dense size="sm" label="Clear" @click="$emit('update:modelValue', null)" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FileUploaderField',
});
</script>
