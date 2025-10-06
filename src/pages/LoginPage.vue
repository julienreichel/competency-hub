<template>
  <q-page class="flex flex-center bg-grey-1">
    <div class="column q-gutter-md" style="min-width: 400px; max-width: 500px">
      <!-- Header -->
      <div class="text-center q-mb-lg">
        <h4 class="text-primary q-my-none">Competency Hub</h4>
        <p class="text-grey-7">{{ t('login.headerSubtitle') }}</p>
      </div>

      <!-- Authentication Component -->
      <q-card v-if="!isAuthenticated" class="q-pa-lg">
        <authenticator
          :login-mechanisms="['email']"
          :sign-up-attributes="signUpAttributes"
          :form-fields="formFields"
        >
          <template #header>
            <div class="text-center q-mb-md">
              <q-avatar size="80px" color="primary" text-color="white" icon="school" />
              <h5 class="q-mt-md q-mb-none text-weight-medium">{{ t('login.welcomeBack') }}</h5>
              <p class="text-grey-6 q-mb-none">{{ t('login.enterCredentials') }}</p>
            </div>
          </template>

          <template #sign-in-header>
            <div class="text-center q-mb-md">
              <h6 class="q-my-none text-weight-medium">{{ t('login.signIn') }}</h6>
              <p class="text-grey-6 text-caption">{{ t('login.accessDashboard') }}</p>
            </div>
          </template>

          <template #sign-up-header>
            <div class="text-center q-mb-md">
              <h6 class="q-my-none text-weight-medium">{{ t('login.createAccount') }}</h6>
              <p class="text-grey-6 text-caption">{{ t('login.joinPlatform') }}</p>
            </div>
          </template>

          <template #footer>
            <div class="text-center q-mt-md">
              <p class="text-caption text-grey-6">
                {{ t('login.termsAndPrivacy') }}
              </p>
            </div>
          </template>
        </authenticator>
      </q-card>
      <q-card v-else class="q-pa-lg text-center">
        <q-icon name="check_circle" color="positive" size="48px" class="q-mb-md" />
        <h5 class="q-my-none text-weight-medium">{{ t('login.success') }}</h5>
        <p class="text-grey-7">{{ t('login.signedIn') }}</p>
      </q-card>

      <!-- Role Selection Dialog -->
      <q-dialog v-model="showRoleSelection" persistent>
        <q-card style="min-width: 350px">
          <q-card-section>
            <div class="text-h6">{{ t('login.roleSelection.title') }}</div>
            <div class="text-subtitle2 text-grey-7">
              {{ t('login.roleSelection.subtitle') }}
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div class="q-gutter-sm">
              <q-btn
                v-for="role in availableRoles"
                :key="role.value"
                :label="role.label"
                :icon="role.icon"
                :color="selectedRole === role.value ? 'primary' : 'grey-3'"
                :text-color="selectedRole === role.value ? 'white' : 'grey-8'"
                class="full-width q-py-md"
                stack
                @click="setSelectedRole(role.value)"
              >
                <div class="text-caption q-mt-xs">{{ role.description }}</div>
              </q-btn>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { Authenticator } from '@aws-amplify/ui-vue';
import { Hub } from 'aws-amplify/utils';
import { useQuasar } from 'quasar';
import { userRepository } from 'src/models/repositories/UserRepository';
import { UserRole } from 'src/models/User';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useUsers } from '../composables/useUsers';

import '@aws-amplify/ui-vue/styles.css';

interface Role {
  value: string;
  label: string;
  icon: string;
  description: string;
}

const router = useRouter();
const route = useRoute();
const { initAuth, isAuthenticated, userAttributes } = useAuth();
const { getCurrentUser } = useUsers();
const { t } = useI18n();
const $q = useQuasar();

// Auth listener cleanup function
let hubUnsubscribe: (() => void) | null = null;

// Constants
const REDIRECT_DELAY_MS = 500; // Small delay to prevent race conditions with router guards
const USER_RETRY_DELAY_MS = 1000; // Wait time before retrying user fetch

// Role selection state
const showRoleSelection = ref(false);

const selectedRole = ref<UserRole | ''>('');
async function setSelectedRole(role: string): Promise<void> {
  selectedRole.value = role as UserRole;
  await handleRoleConfirm();
}

const roleDisplayName = (role: UserRole): string => {
  switch (role) {
    case UserRole.STUDENT:
      return t('login.roles.student.label');
    case UserRole.PARENT:
      return t('login.roles.parent.label');
    case UserRole.EDUCATOR:
      return t('login.roles.educator.label');
    case UserRole.ADMIN:
      return t('login.roles.admin.label');
    default:
      return t('login.roles.unknown');
  }
};

// Available roles for new users
// Only allow Student and Parent for self-selection
const availableRoles = computed<Role[]>(() => [
  {
    value: UserRole.STUDENT,
    label: t('login.roles.student.label'),
    icon: 'school',
    description: t('login.roles.student.description'),
  },
  {
    value: UserRole.PARENT,
    label: t('login.roles.parent.label'),
    icon: 'family_restroom',
    description: t('login.roles.parent.description'),
  },
]);

// Sign up attributes configuration
const signUpAttributes = ['given_name', 'family_name', 'email'];

// Form fields configuration
const formFields = computed(() => ({
  signUp: {
    given_name: {
      label: t('login.forms.firstName'),
      placeholder: t('login.forms.firstNamePlaceholder'),
      isRequired: true,
    },
    family_name: {
      label: t('login.forms.lastName'),
      placeholder: t('login.forms.lastNamePlaceholder'),
      isRequired: true,
    },
    email: {
      label: t('login.forms.email'),
      placeholder: t('login.forms.emailPlaceholder'),
      isRequired: true,
    },
    password: {
      label: t('login.forms.password'),
      placeholder: t('login.forms.passwordPlaceholder'),
      isRequired: true,
    },
    confirm_password: {
      label: t('login.forms.confirmPassword'),
      placeholder: t('login.forms.confirmPasswordPlaceholder'),
      isRequired: true,
    },
  },
  signIn: {
    username: {
      label: t('login.forms.email'),
      placeholder: t('login.forms.signInEmailPlaceholder'),
    },
    password: {
      label: t('login.forms.password'),
      placeholder: t('login.forms.signInPasswordPlaceholder'),
    },
  },
}));

/**
 * Redirect user after successful authentication
 * Handles redirect query parameter and role-based routing
 */
function redirectAfterLogin(): void {
  const targetRoute = (route.query.redirect as string) || '/';

  // Small delay to ensure authentication state is fully settled
  // and prevent race conditions with router guards
  setTimeout(() => {
    void router.push(targetRoute);
  }, REDIRECT_DELAY_MS);
}

/**
 * Handle successful authentication
 * This function is called when authentication state changes to authenticated
 */
async function handleAuthenticated(): Promise<void> {
  try {
    await initAuth();

    // Fetch user from backend by Cognito sub (id), retry once after 1s if not found
    let user = await getCurrentUser();
    if (!user) {
      await new Promise((resolve) => setTimeout(resolve, USER_RETRY_DELAY_MS));
      user = await getCurrentUser();
    }
    if (!user) {
      $q.notify({
        type: 'negative',
        message: t('login.notifications.userNotFound'),
      });
      return;
    }

    // If user role is UNKNOWN, show role selection dialog
    if (user.role === UserRole.UNKNOWN) {
      showRoleSelection.value = true;
    } else {
      // Update lastActive on login
      await userRepository.update(user.id, { lastActive: new Date().toISOString() });
      redirectAfterLogin();
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: t('login.notifications.authFailed'),
    });
  }
}

/**
 * Handle role selection confirmation
 */
async function handleRoleConfirm(): Promise<void> {
  if (!selectedRole.value) return;
  try {
    const userId = String(userAttributes.value.sub);
    await userRepository.addUserToGroup(userId, selectedRole.value);
    await userRepository.update(userId, { lastActive: new Date().toISOString() });
    await initAuth();
    // make sure to reload the user now that the role has been updated
    await getCurrentUser(false);
    showRoleSelection.value = false;
    redirectAfterLogin();
    $q.notify({
      type: 'positive',
      message: t('login.notifications.assignSuccess', {
        role: roleDisplayName(selectedRole.value),
      }),
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: t('login.notifications.assignError'),
    });
  }
}
/**
 * Initialize component
 */
onMounted(async () => {
  // Check if user is already authenticated
  await initAuth();
  if (isAuthenticated.value) {
    redirectAfterLogin();
  }

  // Listen for authentication state changes using AWS Amplify Hub
  hubUnsubscribe = Hub.listen('auth', (data) => {
    const { payload } = data;
    console.log('Auth event:', payload.event);

    if (payload.event === 'signedIn') {
      void handleAuthenticated();
    }
  });
});

/**
 * Cleanup listeners on unmount
 */
onUnmounted(() => {
  if (hubUnsubscribe) {
    hubUnsubscribe();
  }
});
</script>

<style scoped>
.q-page {
  min-height: 100vh;
}

/* Custom styles for Authenticator */
:deep(.amplify-authenticator) {
  --amplify-colors-brand-primary-80: #1976d2;
  --amplify-colors-brand-primary-90: #1565c0;
  --amplify-colors-brand-primary-100: #0d47a1;
}

:deep(.amplify-button--primary) {
  background-color: var(--q-primary);
}

:deep(.amplify-input) {
  border-radius: 4px;
}

:deep(.amplify-tabs-item) {
  color: var(--q-primary);
}
</style>
