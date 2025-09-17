<template>
  <q-page class="q-pa-lg">
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <q-card class="q-pa-lg">
          <q-card-section>
            <div class="text-h5 q-mb-md">
              <q-icon name="person" class="q-mr-sm" />
              User Profile
            </div>
          </q-card-section>

          <q-card-section>
            <div v-if="isLoading" class="text-center">
              <q-spinner color="primary" size="3em" />
              <div class="q-mt-md">Loading profile...</div>
            </div>

            <div v-else class="q-gutter-lg">
              <div class="text-center q-mb-md">
                <user-avatar :user="avatarUser" size="120px" />
                <div class="text-h6 q-mt-md">{{ displayName }}</div>
                <role-chip :role="displayRole" />
              </div>

              <user-profile-form v-model="profileForm" :disabled="!editMode" :enable-role="false" />

              <div class="row q-gutter-sm">
                <q-btn
                  v-if="!editMode"
                  color="primary"
                  icon="edit"
                  label="Edit Profile"
                  class="col-auto"
                  :disable="saving"
                  @click="startEdit"
                />
                <template v-else>
                  <q-btn
                    color="primary"
                    icon="save"
                    label="Save Changes"
                    class="col-auto"
                    :loading="saving"
                    :disable="saving"
                    @click="handleSave"
                  />
                  <q-btn
                    color="grey"
                    icon="cancel"
                    label="Cancel"
                    class="col-auto"
                    flat
                    :disable="saving"
                    @click="cancelEdit"
                  />
                </template>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import RoleChip from 'src/components/ui/RoleChip.vue';
import UserAvatar from 'src/components/ui/UserAvatar.vue';
import UserProfileForm, {
  type UserProfileFormModel,
} from 'src/components/user/UserProfileForm.vue';
import { useAuth } from 'src/composables/useAuth';
import { useUsers } from 'src/composables/useUsers';
import type { User, UserRole } from 'src/models/User';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const $q = useQuasar();
const { userId, refreshUserAttributes, initAuth } = useAuth();
const { getUserById, updateUser } = useUsers();

type ProfileUserSnapshot = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  contactInfo?: string | null;
};

const profileUser = ref<ProfileUserSnapshot | null>(null);
const isLoading = ref(true);
const editMode = ref(false);
const saving = ref(false);

const emptyForm = (): UserProfileFormModel => ({
  name: '',
  email: '',
  role: '' as UserRole | '',
  contactInfo: '',
  avatar: null,
});

const profileForm = ref<UserProfileFormModel>(emptyForm());

const displayName = computed(() => {
  const source = editMode.value ? profileForm.value.name : profileUser.value?.name;
  return source?.trim() || 'User';
});

const displayRole = computed(() => profileUser.value?.role ?? 'Unknown');

const avatarUrl = computed(() => {
  if (editMode.value) {
    return profileForm.value.avatar;
  }
  return profileUser.value?.avatar ?? null;
});

const avatarUser = computed(() => {
  if (avatarUrl.value) {
    return { name: displayName.value, avatar: avatarUrl.value };
  }
  return { name: displayName.value };
});

function toFormModel(user: ProfileUserSnapshot | null): UserProfileFormModel {
  if (!user) {
    return emptyForm();
  }
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    contactInfo: user.contactInfo ?? '',
    avatar: user.avatar ?? null,
  };
}

function toSnapshot(user: User | null): ProfileUserSnapshot | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar ?? null,
    contactInfo: user.contactInfo ?? '',
  };
}

async function loadProfile(): Promise<void> {
  await initAuth();
  const id = userId.value;
  console.log('id', id);
  if (!id) {
    profileUser.value = null;
    profileForm.value = emptyForm();
    isLoading.value = false;
    editMode.value = false;
    return;
  }

  isLoading.value = true;
  try {
    const userRecord = await getUserById(id);
    profileUser.value = toSnapshot(userRecord);
    profileForm.value = toFormModel(profileUser.value);
    editMode.value = false;
  } finally {
    isLoading.value = false;
  }
}

function startEdit(): void {
  if (!profileUser.value) {
    return;
  }
  profileForm.value = toFormModel(profileUser.value);
  editMode.value = true;
}

function cancelEdit(): void {
  profileForm.value = toFormModel(profileUser.value);
  editMode.value = false;
}

async function handleSave(): Promise<void> {
  const id = userId.value;
  if (!id) {
    return;
  }

  const trimmedName = profileForm.value.name.trim();
  if (!trimmedName) {
    $q.notify({
      type: 'negative',
      message: t('validation.nameRequired'),
      position: 'top',
    });
    return;
  }

  try {
    saving.value = true;
    const updated = await updateUser(id, {
      name: trimmedName,
      avatar: profileForm.value.avatar,
      contactInfo: profileForm.value.contactInfo.trim() || null,
    });

    if (!updated) {
      throw new Error('Failed to update profile');
    }

    profileUser.value = toSnapshot(updated);
    profileForm.value = toFormModel(profileUser.value);
    editMode.value = false;

    await refreshUserAttributes();

    $q.notify({
      type: 'positive',
      message: 'Profile updated successfully!',
      position: 'top',
    });
  } catch (error) {
    console.error('Failed to update profile', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to update profile. Please try again.',
      position: 'top',
    });
  } finally {
    saving.value = false;
  }
}

watch(
  userId,
  () => {
    void loadProfile();
  },
  { immediate: true },
);
</script>
