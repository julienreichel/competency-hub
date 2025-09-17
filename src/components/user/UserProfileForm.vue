<template>
  <div class="q-gutter-md">
    <q-input
      :model-value="modelValue.name"
      :label="t('admin.userName')"
      :readonly="disableName"
      :disable="disabled"
      outlined
      :rules="nameRules"
      @update:model-value="updateField('name', String($event ?? ''))"
    />

    <q-input
      :model-value="modelValue.email"
      :label="t('common.email')"
      type="email"
      readonly
      outlined
    />

    <q-select
      v-if="showRoleField"
      :model-value="modelValue.role"
      :options="roleOptions"
      :label="t('common.role')"
      outlined
      :disable="disabled"
      :rules="roleRules"
      @update:model-value="updateField('role', $event)"
    />

    <q-input
      :model-value="modelValue.contactInfo"
      :label="t('admin.contactInfo')"
      type="textarea"
      autogrow
      outlined
      :disable="disabled"
      @update:model-value="updateField('contactInfo', String($event ?? ''))"
    />

    <div v-if="showAvatarControls" class="q-gutter-sm">
      <div class="text-caption text-grey-7">{{ t('admin.avatarPickerTitle') }}</div>
      <avatar-picker
        :model-value="modelValue.avatar"
        @update:model-value="updateField('avatar', $event)"
      />

      <div>
        <div class="text-caption text-grey-7 q-mb-sm">{{ t('profile.picture') }}</div>

        <div v-if="!showUploadSection && picturePreview" class="profile-picture-wrapper">
          <q-img
            :src="picturePreview"
            :ratio="1"
            class="profile-picture-preview"
            spinner-color="primary"
            :alt="t('profile.uploadPhoto')"
          />
          <q-btn
            round
            dense
            icon="edit"
            color="primary"
            class="profile-picture-edit"
            @click="enableUpload"
          />
        </div>

        <div v-else>
          <amplify-uploader
            :key="uploaderKey"
            accept=".jpg,.jpeg"
            :max-files="1"
            auto-upload
            flat
            bordered
            class="full-width"
            :disable="disabled || uploadInProgress"
            :factory="uploadFactory"
            @uploading="handleUploading"
            @uploaded="handleUploaded"
            @failed="handleFailed"
          >
            <template #header>
              <div class="text-body2">{{ t('profile.uploadInstructions') }}</div>
            </template>
          </amplify-uploader>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import AmplifyUploader from 'src/components/ui/AmplifyUploader';
import AvatarPicker from 'src/components/ui/AvatarPicker.vue';
import { useUserFormatters } from 'src/composables/useUserFormatters';
import type { UserRole } from 'src/models/User';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

export type UserProfileFormModel = {
  name: string;
  email: string;
  role: UserRole | '';
  contactInfo: string;
  avatar: string | null;
  picture: string | null;
};

const props = defineProps<{
  modelValue: UserProfileFormModel;
  roleOptions?: UserRole[];
  disabled?: boolean;
  enableRole?: boolean;
  userId?: string | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: UserProfileFormModel];
  uploading: [value: boolean];
}>();

const { t } = useI18n();
const $q = useQuasar();
const { resolvePictureUrl } = useUserFormatters();

const disabled = computed(() => props.disabled ?? false);
const roleOptions = computed(() => props.roleOptions ?? []);
const showRoleField = computed(() => (props.enableRole ?? false) && roleOptions.value.length > 0);
const disableName = computed(() => disabled.value);
const showAvatarControls = computed(() => !disabled.value);
const nameRules = computed(() =>
  disabled.value
    ? []
    : [(val: string | null): boolean | string => !!val || t('validation.nameRequired')],
);
const roleRules = computed(() =>
  showRoleField.value
    ? [(val: UserRole | ''): boolean | string => !!val || t('validation.roleRequired')]
    : [],
);

const uploadInProgress = ref(false);
const uploaderKey = ref(0);
const showUploadSection = ref(false);
const picturePreview = ref<string | null>(null);
let pictureResolveToken = 0;

function extractExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === fileName.length - 1) {
    return '';
  }
  return fileName.slice(dotIndex);
}

function uploadFactory(files: UploadedFilePreview[]): {
  folder: (file: UploadedFilePreview) => string;
  filename: (file: UploadedFilePreview) => string;
} {
  const primaryFile = files[0];
  const baseId = typeof props.userId === 'string' ? props.userId.trim() : '';
  const extension = primaryFile?.name ? extractExtension(primaryFile.name) : '';

  return {
    folder: () => 'protected/profile',
    filename: () => `${baseId}${extension}`,
  };
}

function updateField<K extends keyof UserProfileFormModel>(
  field: K,
  value: UserProfileFormModel[K],
): void {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  });
}

type UploadedFilePreview = File & {
  path?: string;
  url?: string;
};

function resetUploader(): void {
  uploaderKey.value += 1;
}

function handleUploading(): void {
  uploadInProgress.value = true;
  emit('uploading', true);
  showUploadSection.value = true;
}

function handleUploaded(event: { files?: UploadedFilePreview[] }): void {
  uploadInProgress.value = false;
  emit('uploading', false);

  const file = event.files?.[0];
  updateField('picture', file?.path || null);

  showUploadSection.value = false;
  resetUploader();
}

function handleFailed(): void {
  uploadInProgress.value = false;
  emit('uploading', false);
  $q.notify({
    type: 'negative',
    message: t('profile.uploadError'),
    position: 'top',
  });
  showUploadSection.value = true;
  resetUploader();
}

function enableUpload(): void {
  showUploadSection.value = true;
}

watch(
  () => props.modelValue.picture,
  (picture) => {
    pictureResolveToken += 1;
    const currentToken = pictureResolveToken;

    void resolvePictureUrl(picture ?? null).then((resolvedUrl) => {
      if (currentToken !== pictureResolveToken) {
        return;
      }

      picturePreview.value = resolvedUrl;
      showUploadSection.value = !resolvedUrl;
    });
  },
  { immediate: true },
);
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'UserProfileForm',
});
</script>

<style scoped>
.profile-picture-wrapper {
  position: relative;
  display: inline-block;
  width: 160px;
  border-radius: 12px;
  overflow: hidden;
}

.profile-picture-preview {
  border-radius: 12px;
}

.profile-picture-edit {
  position: absolute;
  top: 8px;
  right: 8px;
}
</style>
