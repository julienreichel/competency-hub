<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 420px">
      <q-card-section class="row items-center justify-between text-subtitle1 text-primary">
        <span>{{ t('admin.editUser') }}</span>
        <q-btn flat dense round icon="close" @click="handleCancel" />
      </q-card-section>

      <q-form @submit.prevent="handleSubmit">
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="form.name"
            :label="t('admin.userName')"
            :rules="[(val) => !!val || t('validation.nameRequired')]"
            filled
            data-testid="edit-user-name"
          />

          <q-input
            v-model="form.email"
            :label="t('common.email')"
            filled
            readonly
            data-testid="edit-user-email"
          />

          <q-select
            v-model="form.role"
            :options="roleOptions"
            :label="t('common.role')"
            filled
            :rules="[(val) => !!val || t('validation.roleRequired')]"
          />

          <q-input
            v-model="form.contactInfo"
            :label="t('admin.contactInfo')"
            filled
            type="textarea"
          />

          <div>
            <div class="text-caption text-grey-7 q-mb-sm">{{ t('admin.avatarPickerTitle') }}</div>
            <avatar-picker v-model="form.avatarUrl" />
          </div>
        </q-card-section>

        <q-card-actions>
          <q-space />
          <q-btn flat :label="t('common.cancel')" @click="handleCancel" />
          <q-btn color="primary" type="submit" :label="t('common.save')" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import AvatarPicker from 'src/components/ui/AvatarPicker.vue';
import type { UserRole } from 'src/models/User';
import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type EditableUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
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
    value: { id: string; name: string; role: UserRole; avatar: string | null; contactInfo: string },
  ];
  cancel: [];
}>();

const { t } = useI18n();

const form = reactive({
  name: '',
  email: '',
  role: '' as UserRole | '',
  avatarUrl: null as string | null,
  contactInfo: '',
});

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
      form.name = '';
      form.email = '';
      form.role = '';
      form.avatarUrl = null;
      return;
    }
    form.name = user.name;
    form.email = user.email;
    form.role = user.role;
    form.avatarUrl = user.avatar ?? null;
    form.contactInfo = user.contactInfo ?? '';
  },
  { immediate: true },
);

function handleCancel(): void {
  emit('cancel');
  emit('update:modelValue', false);
}

function handleSubmit(): void {
  if (!props.user) return;
  if (!form.role) return;
  const { role } = form;
  emit('save', {
    id: props.user.id,
    name: form.name,
    role,
    avatar: form.avatarUrl,
    contactInfo: form.contactInfo,
  });
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'EditUserDialog',
});
</script>
