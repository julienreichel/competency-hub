<template>
  <base-dialog
    v-model="open"
    :title="t('messaging.dialog.newMessage.title')"
    icon="forum"
    :primary-label="t('messaging.dialog.newMessage.actions.send')"
    :cancel-label="t('common.cancel')"
    :disable-primary="submitting"
    :loading="submitting"
    @submit="handleSubmit"
    @cancel="handleCancel"
    @closed="handleClosed"
  >
    <div class="column q-gutter-md">
      <q-input
        v-model="title"
        outlined
        :label="t('messaging.dialog.newMessage.fields.title')"
        :placeholder="placeholderLabel"
        :disable="submitting"
        :rules="[requiredRule]"
      />

      <q-select
        v-model="selectedRecipients"
        outlined
        use-chips
        multiple
        emit-value
        map-options
        :options="recipientOptions"
        :label="t('messaging.dialog.newMessage.fields.recipients')"
        :disable="submitting || recipientsLoading"
        :loading="recipientsLoading"
        :rules="[recipientRule]"
      />

      <q-input
        v-model="body"
        outlined
        type="textarea"
        autogrow
        :label="t('messaging.dialog.newMessage.fields.body')"
        :disable="submitting"
      />

      <q-banner v-if="errorMessage" dense class="bg-negative text-white">
        {{ errorMessage }}
      </q-banner>
    </div>
  </base-dialog>
</template>

<script setup lang="ts">
import BaseDialog from 'src/components/common/BaseDialog.vue';
import { useUsers } from 'src/composables/useUsers';
import { UserRole, type User } from 'src/models/User';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    initialTargets?: string[];
    titlePlaceholderKey?: string;
    allowedRoles?: UserRole[];
  }>(),
  {
    initialTargets: () => [],
    titlePlaceholderKey: 'messaging.dialog.newMessage.titlePlaceholder',
    allowedRoles: () => [UserRole.EDUCATOR, UserRole.PARENT],
  },
);

const open = defineModel<boolean>({ default: false });

const emit = defineEmits<{
  (e: 'create', payload: { title: string; body: string; participantIds: string[] }): void;
}>();

const { t } = useI18n();
const { fetchUsers } = useUsers();

const title = ref('');
const body = ref('');
const selectedRecipients = ref<string[]>([...props.initialTargets]);
const submitting = ref(false);
const recipientsLoading = ref(false);
const errorMessage = ref<string | null>(null);
const users = ref<User[]>([]);

const placeholderLabel = computed(() => t(props.titlePlaceholderKey));

const allowedRoles = computed(() => props.allowedRoles ?? []);

const filteredUsers = computed(() => {
  if (!allowedRoles.value.length) {
    return users.value;
  }
  const seed = new Set(props.initialTargets);
  return users.value.filter((user) => seed.has(user.id) || allowedRoles.value.includes(user.role));
});

const recipientOptions = computed(() =>
  filteredUsers.value.map((user) => ({
    label: user.getDisplayName(),
    value: user.id,
  })),
);

watch(
  () => props.initialTargets,
  (value) => {
    selectedRecipients.value = [...value];
  },
);

async function loadUsers(): Promise<void> {
  recipientsLoading.value = true;
  try {
    users.value = await fetchUsers();
  } finally {
    recipientsLoading.value = false;
  }
}

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen && users.value.length === 0) {
      void loadUsers();
    }
  },
  { immediate: true },
);

function requiredRule(value: string): boolean | string {
  return value.trim().length > 0 || t('validation.required');
}

function recipientRule(value: string[]): boolean | string {
  return value.length > 0 || t('messaging.dialog.newMessage.errors.recipientRequired');
}

function resetForm(): void {
  title.value = '';
  body.value = '';
  selectedRecipients.value = [...props.initialTargets];
  errorMessage.value = null;
}

function handleCancel(): void {
  resetForm();
}

function handleClosed(): void {
  if (!open.value) {
    resetForm();
  }
}

function handleSubmit(): void {
  errorMessage.value = null;

  if (!title.value.trim()) {
    errorMessage.value = t('validation.required');
    return;
  }
  if (!selectedRecipients.value.length) {
    errorMessage.value = t('messaging.dialog.newMessage.errors.recipientRequired');
    return;
  }

  submitting.value = true;
  emit('create', {
    title: title.value.trim(),
    body: body.value.trim(),
    participantIds: [...new Set(selectedRecipients.value)],
  });
  submitting.value = false;
  open.value = false;
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'NewMessageDialog',
});
</script>
