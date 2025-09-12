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

            <div v-else class="q-gutter-md">
              <!-- Profile Avatar -->
              <div class="text-center q-mb-lg">
                <q-avatar size="120px" color="primary" text-color="white">
                  <q-icon name="person" size="60px" />
                </q-avatar>
                <div class="text-h6 q-mt-md">{{ userFullName }}</div>
                <q-chip
                  :color="getRoleColor(userRole)"
                  text-color="white"
                  :icon="getRoleIcon(userRole)"
                >
                  {{ userRole }}
                </q-chip>
              </div>

              <!-- Profile Information -->
              <q-form @submit="handleSave" class="q-gutter-md">
                <div class="row q-gutter-md">
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="profileForm.givenName"
                      label="First Name"
                      outlined
                      :disable="!editMode"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="profileForm.familyName"
                      label="Last Name"
                      outlined
                      :disable="!editMode"
                    />
                  </div>
                </div>

                <q-input
                  v-model="profileForm.email"
                  label="Email Address"
                  type="email"
                  outlined
                  disable
                />

                <div class="row q-gutter-md q-mt-md">
                  <div class="col">
                    <q-btn
                      v-if="!editMode"
                      color="primary"
                      icon="edit"
                      label="Edit Profile"
                      @click="editMode = true"
                    />
                    <div v-else class="q-gutter-sm">
                      <q-btn
                        color="primary"
                        icon="save"
                        label="Save Changes"
                        type="submit"
                        :loading="saving"
                      />
                      <q-btn color="grey" icon="cancel" label="Cancel" flat @click="cancelEdit" />
                    </div>
                  </div>
                </div>
              </q-form>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { onMounted, reactive, ref } from 'vue';
import { useAuth } from '../composables/useAuth';

const $q = useQuasar();
const { userFullName, userRole, userAttributes, isLoading, refreshUserAttributes } = useAuth();

const editMode = ref(false);
const saving = ref(false);

const profileForm = reactive({
  givenName: '',
  familyName: '',
  email: '',
});

/**
 * Get role-specific color
 */
function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    Student: 'blue',
    Educator: 'green',
    Parent: 'orange',
    Admin: 'purple',
  };
  return colors[role] || 'grey';
}

/**
 * Get role-specific icon
 */
function getRoleIcon(role: string): string {
  const icons: Record<string, string> = {
    Student: 'school',
    Educator: 'psychology',
    Parent: 'family_restroom',
    Admin: 'admin_panel_settings',
  };
  return icons[role] || 'person';
}

/**
 * Load user profile data
 */
function loadProfile(): void {
  profileForm.givenName = userAttributes.value.given_name || userAttributes.value.givenName || '';
  profileForm.familyName =
    userAttributes.value.family_name || userAttributes.value.familyName || '';
  profileForm.email = userAttributes.value.email || '';
}

/**
 * Handle form submission
 */
async function handleSave(): Promise<void> {
  try {
    saving.value = true;

    // TODO: Implement profile update API call
    // await updateUserAttributes({
    //   given_name: profileForm.givenName,
    //   family_name: profileForm.familyName,
    // });

    await refreshUserAttributes();
    editMode.value = false;

    $q.notify({
      type: 'positive',
      message: 'Profile updated successfully!',
      position: 'top',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to update profile. Please try again.',
      position: 'top',
    });
  } finally {
    saving.value = false;
  }
}

/**
 * Cancel editing
 */
function cancelEdit(): void {
  editMode.value = false;
  loadProfile(); // Reset form to original values
}

/**
 * Initialize component
 */
onMounted(() => {
  loadProfile();
});
</script>
