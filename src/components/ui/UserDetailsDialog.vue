<template>
  <base-dialog
    v-model="open"
    :title="t('admin.userDetails')"
    :persistent="true"
    :show-close="true"
    :use-form="false"
    @cancel="handleClose"
    size="md"
  >
    <q-card-section class="row items-center q-gutter-sm">
      <user-avatar v-if="user" :user="user" size="64px" />
      <div class="column">
        <div class="text-h6">{{ user?.name }}</div>
        <div class="text-body2 text-grey-7">{{ user?.email }}</div>
      </div>
    </q-card-section>
    <q-card-section v-if="user">
      <q-list dense>
        <q-item>
          <q-item-section>
            <div class="text-caption text-grey-7">{{ t('common.role') }}</div>
            <div>{{ user.role }}</div>
          </q-item-section>
        </q-item>
        <q-item v-if="user.contactInfo">
          <q-item-section>
            <div class="text-caption text-grey-7">{{ t('admin.contactInfo') }}</div>
            <div class="text-body2" style="white-space: pre-wrap">{{ user.contactInfo }}</div>
          </q-item-section>
        </q-item>
        <q-item v-if="user.lastActive">
          <q-item-section>
            <div class="text-caption text-grey-7">{{ t('admin.lastActive') }}</div>
            <div>{{ formatLastActive(user.lastActive) }}</div>
          </q-item-section>
        </q-item>
        <q-item v-if="user.createdAt">
          <q-item-section>
            <div class="text-caption text-grey-7">{{ t('admin.memberSince') }}</div>
            <div>{{ formatDate(user.createdAt) }}</div>
          </q-item-section>
        </q-item>
        <q-item v-if="user.picture">
          <q-img
            :src="picturePreview"
            :ratio="1"
            class="profile-picture-preview"
            spinner-color="primary"
            :alt="t('profile.uploadPhoto')"
          />
        </q-item>
        <q-item v-if="isStudent">
          <q-item-section>
            <div class="text-caption text-grey-7">{{ t('educator.educators') }}</div>
            <div class="chip-row q-mt-xs">
              <q-chip
                v-for="educator in educatorUsers"
                :key="educator.id"
                color="primary"
                text-color="white"
                :removable="canManageEducators"
                @remove="handleRemoveEducator(educator.id)"
              >
                {{ educator.name }}
              </q-chip>
              <div v-if="!educatorUsers.length" class="text-body2 text-grey-6">
                {{ t('educator.noEducatorsAssigned') }}
              </div>
            </div>
            <div class="row q-gutter-sm q-mt-sm">
              <q-btn
                v-if="canManageEducators"
                outline
                color="primary"
                icon="person_add"
                :label="t('educator.assignEducator')"
                :disable="availableEducatorOptions.length === 0"
                @click="openEducatorSelector"
              />
            </div>
          </q-item-section>
        </q-item>
        <q-item v-if="isStudent">
          <q-item-section>
            <div class="text-caption text-grey-7">{{ t('educator.parents') }}</div>
            <div class="chip-row q-mt-xs">
              <q-chip
                v-for="parent in parentUsers"
                :key="parent.id"
                color="secondary"
                text-color="white"
                :removable="canManageParents"
                @remove="handleRemoveParent(parent.id)"
              >
                {{ parent.name }}
              </q-chip>
              <div v-if="!parentUsers.length" class="text-body2 text-grey-6">
                {{ t('educator.noParentsAssigned') }}
              </div>
            </div>
            <q-btn
              v-if="canManageParents"
              class="q-mt-sm"
              outline
              color="primary"
              icon="person_add_alt"
              :label="t('educator.assignParent')"
              :disable="availableParentOptions.length === 0"
              @click="openParentSelector"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </base-dialog>

  <q-dialog v-model="parentSelectorOpen">
    <q-card style="min-width: 320px">
      <q-card-section>
        <div class="text-h6">{{ t('educator.parentSelectTitle') }}</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          {{ t('educator.parentSelectDescription') }}
        </div>
      </q-card-section>

      <q-card-section>
        <q-select
          v-model="selectedParentId"
          :options="availableParentOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          outlined
          dense
          :label="t('educator.parentSelectPlaceholder')"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat :label="t('common.cancel')" @click="parentSelectorOpen = false" />
        <q-btn
          color="primary"
          :label="t('educator.assignParentConfirm')"
          :disable="!selectedParentId"
          @click="confirmParentAssignment"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="educatorSelectorOpen">
    <q-card style="min-width: 320px">
      <q-card-section>
        <div class="text-h6">{{ t('educator.educatorSelectTitle') }}</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          {{ t('educator.educatorSelectDescription') }}
        </div>
      </q-card-section>

      <q-card-section>
        <q-select
          v-model="selectedEducatorId"
          :options="availableEducatorOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          outlined
          dense
          :label="t('educator.educatorSelectPlaceholder')"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat :label="t('common.cancel')" @click="educatorSelectorOpen = false" />
        <q-btn
          color="primary"
          :label="t('educator.assignEducatorConfirm')"
          :disable="!selectedEducatorId"
          @click="confirmEducatorAssignment"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import BaseDialog from 'src/components/ui/BaseDialog.vue';
import UserAvatar from 'src/components/ui/UserAvatar.vue';
import { useUserFormatters } from 'src/composables/useUserFormatters';
import type { User } from 'src/models/User';
import { UserRole } from 'src/models/User';
import type { DeepReadonly } from 'vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
const open = defineModel<boolean>({ default: false });

type UserDetailsSnapshot = Pick<
  User,
  | 'id'
  | 'name'
  | 'email'
  | 'role'
  | 'avatar'
  | 'educators'
  | 'parents'
  | 'students'
  | 'children'
  | 'educatorIds'
  | 'parentIds'
  | 'studentIds'
> & {
  contactInfo?: string | null;
  createdAt?: string | undefined;
  lastActive?: string | undefined;
  picture?: string | null;
};

type UserDetailsUser = User | DeepReadonly<User> | UserDetailsSnapshot;

const props = defineProps<{
  modelValue: boolean;
  user: UserDetailsUser | null;
  allUsers?: UserDetailsUser[] | null;
  currentEducatorId?: string | null;
  canManageParents?: boolean;
  canManageEducators?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
  assignEducator: [studentId: string];
  unassignEducator: [studentId: string];
  addEducator: [{ studentId: string; educatorId: string }];
  removeEducator: [{ studentId: string; educatorId: string }];
  assignParent: [{ studentId: string; parentId: string }];
  removeParent: [{ studentId: string; parentId: string }];
}>();

const { formatLastActive, resolvePictureUrl } = useUserFormatters();
const { t } = useI18n();

const user = computed(() => props.user);
const isStudent = computed(() => user.value?.role === UserRole.STUDENT);
const educatorUsers = computed<UserDetailsUser[]>(() => {
  if (!isStudent.value) {
    return [];
  }
  const relations = user.value?.educators ?? [];
  return Array.from(relations) as UserDetailsUser[];
});

const parentUsers = computed<UserDetailsUser[]>(() => {
  if (!isStudent.value) {
    return [];
  }
  const relations = user.value?.parents ?? [];
  return Array.from(relations) as UserDetailsUser[];
});

const canManageEducators = computed(() => props.canManageEducators ?? false);
const canManageParents = computed(() => props.canManageParents ?? false);
const availableParentOptions = computed(() => {
  if (!canManageParents.value) {
    return [] as Array<{ label: string; value: string }>;
  }
  const assigned = new Set(parentUsers.value.map((parent) => parent.id));
  return (props.allUsers ?? [])
    .filter((candidate) => candidate.role === UserRole.PARENT && !assigned.has(candidate.id))
    .map((candidate) => ({ label: candidate.name, value: candidate.id }));
});

const availableEducatorOptions = computed(() => {
  if (!canManageEducators.value) {
    return [] as Array<{ label: string; value: string }>;
  }
  const assigned = new Set(educatorUsers.value.map((educator) => educator.id));
  return (props.allUsers ?? [])
    .filter((candidate) => candidate.role === UserRole.EDUCATOR && !assigned.has(candidate.id))
    .map((candidate) => ({ label: candidate.name, value: candidate.id }));
});

const parentSelectorOpen = ref(false);
const selectedParentId = ref<string | null>(null);
const educatorSelectorOpen = ref(false);
const selectedEducatorId = ref<string | null>(null);

const picturePreview = ref<string | undefined>();

watch(
  () => props.user?.picture,
  async (picture) => {
    const resolvedUrl = await resolvePictureUrl(picture ?? null);
    picturePreview.value = resolvedUrl || undefined;
  },
  { immediate: true },
);

watch(
  () => props.user?.id,
  () => {
    parentSelectorOpen.value = false;
    selectedParentId.value = null;
    educatorSelectorOpen.value = false;
    selectedEducatorId.value = null;
  },
);

function handleClose(): void {
  emit('update:modelValue', false);
  emit('close');
}

function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toLocaleDateString();
}

function handleRemoveParent(parentId: string): void {
  if (!user.value) return;
  emit('removeParent', { studentId: user.value.id, parentId });
}

function openParentSelector(): void {
  parentSelectorOpen.value = true;
}

function confirmParentAssignment(): void {
  if (!user.value || !selectedParentId.value) {
    return;
  }
  emit('assignParent', { studentId: user.value.id, parentId: selectedParentId.value });
  parentSelectorOpen.value = false;
  selectedParentId.value = null;
}

function handleRemoveEducator(educatorId: string): void {
  if (!user.value) return;
  emit('removeEducator', { studentId: user.value.id, educatorId });
}

function openEducatorSelector(): void {
  educatorSelectorOpen.value = true;
}

function confirmEducatorAssignment(): void {
  if (!user.value || !selectedEducatorId.value) {
    return;
  }
  emit('addEducator', { studentId: user.value.id, educatorId: selectedEducatorId.value });
  educatorSelectorOpen.value = false;
  selectedEducatorId.value = null;
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'UserDetailsDialog',
});
</script>

<style scoped>
.profile-picture-preview {
  border-radius: 12px;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
