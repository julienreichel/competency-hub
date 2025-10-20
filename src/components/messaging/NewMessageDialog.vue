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

const PARENT_GROUP_PREFIX = 'parents:';

type RecipientOption = {
  label: string;
  value: string;
  role?: UserRole;
};

const props = withDefaults(
  defineProps<{
    initialTargets?: string[];
    titlePlaceholderKey?: string;
  }>(),
  {
    initialTargets: () => [],
    titlePlaceholderKey: 'messaging.dialog.newMessage.titlePlaceholder',
  },
);

const open = defineModel<boolean>({ default: false });

const emit = defineEmits<{
  (e: 'create', payload: { title: string; body: string; participantIds: string[] }): void;
}>();

const { t } = useI18n();
const { getCurrentUser, getUsersByIds, fetchUsers } = useUsers();

const title = ref('');
const body = ref('');
const selectedRecipients = ref<string[]>([...props.initialTargets]);
const submitting = ref(false);
const recipientsLoading = ref(false);
const errorMessage = ref<string | null>(null);
const rawRecipientOptions = ref<RecipientOption[]>([]);

const placeholderLabel = computed(() => t(props.titlePlaceholderKey));
const recipientOptions = computed(() => rawRecipientOptions.value);

watch(
  () => props.initialTargets,
  (value) => {
    selectedRecipients.value = [...value];
    void ensureInitialTargetsIncluded();
  },
);

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen && rawRecipientOptions.value.length === 0) {
      void loadRecipients();
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

async function handleSubmit(): Promise<void> {
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
  try {
    const participantIds = await resolveParticipantIds();
    if (!participantIds.length) {
      errorMessage.value = t('messaging.dialog.newMessage.errors.recipientRequired');
      submitting.value = false;
      return;
    }

    emit('create', {
      title: title.value.trim(),
      body: body.value.trim(),
      participantIds,
    });
    open.value = false;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('common.unknown');
  } finally {
    submitting.value = false;
  }
}

async function loadRecipients(): Promise<void> {
  recipientsLoading.value = true;
  errorMessage.value = null;

  try {
    const user = await getCurrentUser();

    let options: RecipientOption[];

    if (!user) {
      options = [];
    } else if (user.role === UserRole.ADMIN) {
      options = await buildAdminRecipientOptions(user);
    } else {
      options = await buildRecipientOptionsForUser(user);
    }

    rawRecipientOptions.value = await includeInitialTargets(options);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('common.unknown');
    rawRecipientOptions.value = await includeInitialTargets([]);
  } finally {
    recipientsLoading.value = false;
  }
}

async function ensureInitialTargetsIncluded(): Promise<void> {
  rawRecipientOptions.value = await includeInitialTargets(rawRecipientOptions.value);
}

async function includeInitialTargets(options: RecipientOption[]): Promise<RecipientOption[]> {
  const existing = new Set(options.map((option) => option.value));
  const missing = props.initialTargets.filter(
    (target) => !existing.has(target) && !target.startsWith(PARENT_GROUP_PREFIX),
  );

  if (!missing.length) {
    return options;
  }

  const users = await getUsersByIds(missing);
  const merged = [...options, ...users.map(createUserOption)];
  return dedupeOptions(merged);
}

async function resolveParticipantIds(): Promise<string[]> {
  const participantIds = new Set<string>();
  const parentGroupChildren = new Set<string>();

  selectedRecipients.value.forEach((value) => {
    if (value.startsWith(PARENT_GROUP_PREFIX)) {
      parentGroupChildren.add(value.substring(PARENT_GROUP_PREFIX.length));
    } else {
      participantIds.add(value);
    }
  });

  if (parentGroupChildren.size > 0) {
    const children = await getUsersByIds([...parentGroupChildren]);
    children.forEach((child) => {
      child.parents.forEach((parent) => participantIds.add(parent.id));
    });
  }

  return [...participantIds];
}

async function buildRecipientOptionsForUser(user: User): Promise<RecipientOption[]> {
  if (user.role === UserRole.STUDENT) {
    return buildStudentRecipientOptions(user);
  }

  if (user.role === UserRole.PARENT) {
    return buildParentRecipientOptions(user);
  }

  if (user.role === UserRole.EDUCATOR) {
    return buildEducatorRecipientOptions(user);
  }

  return [];
}

async function buildAdminRecipientOptions(currentUser: User): Promise<RecipientOption[]> {
  const allUsers = await fetchUsers();
  const options = allUsers.filter((user) => user.id !== currentUser.id).map(createUserOption);
  return dedupeOptions(options);
}

function buildStudentRecipientOptions(user: User): RecipientOption[] {
  const options = [...user.parents, ...user.educators].map(createUserOption);
  return dedupeOptions(options);
}

async function buildParentRecipientOptions(user: User): Promise<RecipientOption[]> {
  const childOptions = user.children.map(createUserOption);
  const childIds = user.children.map((child) => child.id);
  const detailedChildren = childIds.length ? await getUsersByIds(childIds) : [];
  const educatorOptions = detailedChildren.flatMap((child) =>
    child.educators.map(createUserOption),
  );

  return dedupeOptions([...childOptions, ...educatorOptions]);
}

function buildEducatorRecipientOptions(user: User): RecipientOption[] {
  const studentOptions = user.students.map(createUserOption);
  const parentGroupOptions = user.students.map(createParentGroupOption);
  return dedupeOptions([...studentOptions, ...parentGroupOptions]);
}

function createUserOption(user: User): RecipientOption {
  return {
    label: user.getDisplayName(),
    value: user.id,
    role: user.role,
  };
}

function createParentGroupOption(student: User): RecipientOption {
  const name = student.getDisplayName();
  const needsApostrophe = name.endsWith('s');
  const suffix = needsApostrophe ? "'" : "'s";
  return {
    label: `${name}${suffix} parents`,
    value: `${PARENT_GROUP_PREFIX}${student.id}`,
    role: UserRole.PARENT,
  };
}

function dedupeOptions(options: RecipientOption[]): RecipientOption[] {
  const map = new Map<string, RecipientOption>();
  options.forEach((option) => {
    if (!map.has(option.value)) {
      map.set(option.value, option);
    }
  });
  return [...map.values()];
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'NewMessageDialog',
});
</script>
