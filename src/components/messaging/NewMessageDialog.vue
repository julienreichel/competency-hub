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
      <div v-if="isBodyOnly" class="column q-gutter-xs">
        <div class="text-caption text-grey-6">
          {{ t('messaging.dialog.newMessage.fields.title') }}
        </div>
        <div class="text-subtitle1 text-weight-medium">
          {{ displayTitle }}
        </div>
      </div>
      <q-input
        v-else
        v-model="title"
        outlined
        :label="t('messaging.dialog.newMessage.fields.title')"
        :placeholder="placeholderLabel"
        :disable="submitting"
        :rules="[requiredRule]"
      />

      <div v-if="isBodyOnly && selectedRecipientLabels.length" class="column q-gutter-xs">
        <div class="text-caption text-grey-6">
          {{ t('messaging.dialog.newMessage.fields.recipients') }}
        </div>
        <div class="row q-gutter-xs flex-wrap">
          <q-chip v-for="label in selectedRecipientLabels" :key="label" outline dense>
            {{ label }}
          </q-chip>
        </div>
      </div>
      <q-select
        v-else
        v-model="selectedRecipients"
        outlined
        use-input
        fill-input
        input-debounce="200"
        use-chips
        multiple
        emit-value
        map-options
        :options="recipientOptions"
        :label="t('messaging.dialog.newMessage.fields.recipients')"
        :disable="submitting || recipientsLoading"
        :loading="recipientsLoading"
        :rules="[recipientRule]"
        @filter="handleRecipientFilter"
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
import type { MessageKind } from 'src/models/Message';
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
    initialTitle?: string;
    mode?: 'full' | 'body-only';
    kind?: MessageKind;
  }>(),
  {
    initialTargets: () => [],
    titlePlaceholderKey: 'messaging.dialog.newMessage.titlePlaceholder',
    initialTitle: '',
    mode: 'full',
    kind: 'Message',
  },
);

const open = defineModel<boolean>({ default: false });

const emit = defineEmits<{
  (
    e: 'create',
    payload: {
      title: string;
      body: string;
      participantIds: string[];
      kind?: MessageKind;
    },
  ): void;
}>();

const { t } = useI18n();
const { getCurrentUser, getUsersByIds, fetchUsers } = useUsers();

const title = ref(props.initialTitle ?? '');
const body = ref('');
const selectedRecipients = ref<string[]>([...props.initialTargets]);
const submitting = ref(false);
const recipientsLoading = ref(false);
const errorMessage = ref<string | null>(null);
const rawRecipientOptions = ref<RecipientOption[]>([]);
const filteredRecipientOptions = ref<RecipientOption[]>([]);
const filterTerm = ref('');

const placeholderLabel = computed(() => t(props.titlePlaceholderKey));
const recipientOptions = computed(() => filteredRecipientOptions.value);
const isBodyOnly = computed(() => props.mode === 'body-only');
const displayTitle = computed(() => props.initialTitle || '');
const selectedRecipientLabels = computed(() => {
  const map = new Map(rawRecipientOptions.value.map((option) => [option.value, option.label]));
  return selectedRecipients.value
    .map((id) => map.get(id) ?? id)
    .filter((label) => label && label.trim().length > 0);
});

watch(
  () => props.initialTargets,
  (value) => {
    selectedRecipients.value = [...value];
    void ensureInitialTargetsIncluded();
  },
);

watch(
  () => props.initialTitle,
  (value) => {
    if (!open.value) {
      title.value = value ?? '';
    }
  },
);

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen && rawRecipientOptions.value.length === 0) {
      void loadRecipients();
    }
    if (isOpen) {
      title.value = props.initialTitle ?? '';
    }
  },
  { immediate: true },
);

watch(rawRecipientOptions, () => {
  applyRecipientFilter();
});

function requiredRule(value: string): boolean | string {
  return value.trim().length > 0 || t('validation.required');
}

function recipientRule(value: string[]): boolean | string {
  return value.length > 0 || t('messaging.dialog.newMessage.errors.recipientRequired');
}

function resetForm(): void {
  title.value = props.initialTitle ?? '';
  body.value = '';
  selectedRecipients.value = [...props.initialTargets];
  errorMessage.value = null;
  filterTerm.value = '';
  applyRecipientFilter();
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

  if (!isBodyOnly.value && !title.value.trim()) {
    errorMessage.value = t('validation.required');
    return;
  }
  if (!selectedRecipients.value.length) {
    errorMessage.value = t('messaging.dialog.newMessage.errors.recipientRequired');
    return;
  }
  if (!body.value.trim()) {
    errorMessage.value = t('validation.required');
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

    const titleValue = isBodyOnly.value ? displayTitle.value : title.value.trim();

    emit('create', {
      title: titleValue,
      body: body.value.trim(),
      participantIds,
      kind: props.kind,
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
    applyRecipientFilter();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('common.unknown');
    rawRecipientOptions.value = await includeInitialTargets([]);
    applyRecipientFilter();
  } finally {
    recipientsLoading.value = false;
  }
}

async function ensureInitialTargetsIncluded(): Promise<void> {
  rawRecipientOptions.value = await includeInitialTargets(rawRecipientOptions.value);
  applyRecipientFilter();
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

function handleRecipientFilter(val: string, update: (callback: () => void) => void): void {
  filterTerm.value = val;
  update(() => {
    applyRecipientFilter();
  });
}

function applyRecipientFilter(): void {
  const needle = filterTerm.value.trim().toLowerCase();

  if (!needle) {
    filteredRecipientOptions.value = [...rawRecipientOptions.value];
    return;
  }

  filteredRecipientOptions.value = rawRecipientOptions.value.filter((option) =>
    option.label.toLowerCase().includes(needle),
  );
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
