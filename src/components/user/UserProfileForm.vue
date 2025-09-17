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

    <div v-if="showAvatarPicker">
      <div class="text-caption text-grey-7 q-mb-sm">{{ t('admin.avatarPickerTitle') }}</div>
      <avatar-picker
        :model-value="modelValue.avatar"
        @update:model-value="updateField('avatar', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import AvatarPicker from 'src/components/ui/AvatarPicker.vue';
import type { UserRole } from 'src/models/User';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export type UserProfileFormModel = {
  name: string;
  email: string;
  role: UserRole | '';
  contactInfo: string;
  avatar: string | null;
};

const props = defineProps<{
  modelValue: UserProfileFormModel;
  roleOptions?: UserRole[];
  disabled?: boolean;
  enableRole?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: UserProfileFormModel];
}>();

const { t } = useI18n();

const disabled = computed(() => props.disabled ?? false);
const roleOptions = computed(() => props.roleOptions ?? []);
const showRoleField = computed(() => (props.enableRole ?? false) && roleOptions.value.length > 0);
const disableName = computed(() => disabled.value);
const showAvatarPicker = computed(() => !disabled.value);
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

function updateField<K extends keyof UserProfileFormModel>(
  field: K,
  value: UserProfileFormModel[K],
): void {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  });
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'UserProfileForm',
});
</script>
