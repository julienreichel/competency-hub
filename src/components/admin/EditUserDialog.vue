<template>
  <base-dialog
    v-model="open"
    :title="t('admin.editUser')"
    :persistent="true"
    :show-close="true"
    :use-form="true"
    @cancel="handleCancel"
    @submit="handleSubmit"
    size="md"
    :loading="uploading"
  >
    <user-profile-form
      v-model="form"
      :role-options="roleOptions"
      enable-role
      :user-id="props.user?.id ?? null"
      data-testid="edit-user-form"
      @uploading="handleUploading"
    />
  </base-dialog>
</template>

<script setup lang="ts">
import BaseDialog from 'src/components/ui/BaseDialog.vue';
import UserProfileForm, {
  type UserProfileFormModel,
} from 'src/components/user/UserProfileForm.vue';
import type { UserRole } from 'src/models/User';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type EditableUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  picture?: string | null;
  contactInfo?: string | null;
};

const props = defineProps<{
  user: EditableUser | null;
  roleOptions: UserRole[];
}>();

const emit = defineEmits<{
  save: [
    value: {
      id: string;
      name: string;
      role: UserRole;
      avatar: string | null;
      picture: string | null;
      contactInfo: string;
    },
  ];
  cancel: [];
}>();

const { t } = useI18n();

const emptyForm = (): UserProfileFormModel => ({
  name: '',
  email: '',
  role: '' as UserRole | '',
  contactInfo: '',
  avatar: null,
  picture: null,
});

const form = ref<UserProfileFormModel>(emptyForm());
const uploading = ref(false);

const open = defineModel<boolean>({ default: false });

watch(
  () => props.user,
  (user) => {
    if (!user) {
      form.value = emptyForm();
      uploading.value = false;
      return;
    }

    form.value = {
      name: user.name,
      email: user.email,
      role: user.role,
      contactInfo: user.contactInfo ?? '',
      avatar: user.avatar ?? null,
      picture: user.picture ?? null,
    };
    uploading.value = false;
  },
  { immediate: true },
);

function handleCancel(): void {
  emit('cancel');
}

function handleUploading(status: boolean): void {
  uploading.value = status;
}

function handleSubmit(): void {
  if (!props.user) return;
  if (!form.value.role) return;
  const { role } = form.value;
  emit('save', {
    id: props.user.id,
    name: form.value.name,
    role,
    avatar: form.value.avatar,
    picture: form.value.picture,
    contactInfo: form.value.contactInfo,
  });
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'EditUserDialog',
});
</script>
