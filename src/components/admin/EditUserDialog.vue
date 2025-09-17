<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 420px">
      <q-card-section class="row items-center justify-between text-subtitle1 text-primary">
        <span>{{ t('admin.editUser') }}</span>
        <q-btn flat dense round icon="close" @click="handleCancel" />
      </q-card-section>

      <q-form @submit.prevent="handleSubmit">
        <q-card-section class="q-gutter-md">
          <user-profile-form
            v-model="form"
            :role-options="roleOptions"
            enable-role
            :user-id="props.user?.id ?? null"
            data-testid="edit-user-form"
            @uploading="handleUploading"
          />
        </q-card-section>

        <q-card-actions>
          <q-space />
          <q-btn flat :label="t('common.cancel')" :disable="uploading" @click="handleCancel" />
          <q-btn color="primary" type="submit" :label="t('common.save')" :disable="uploading" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import UserProfileForm, {
  type UserProfileFormModel,
} from 'src/components/user/UserProfileForm.vue';
import type { UserRole } from 'src/models/User';
import { computed, ref, watch } from 'vue';
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
  modelValue: boolean;
  user: EditableUser | null;
  roleOptions: UserRole[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
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

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    emit('update:modelValue', value);
    if (!value) {
      emit('cancel');
    }
  },
});

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
  emit('update:modelValue', false);
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
