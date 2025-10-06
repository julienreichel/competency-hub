<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>{{ t('app.title') }}</q-toolbar-title>

        <!-- User Menu -->
        <div v-if="isAuthenticated" class="q-gutter-sm row items-center no-wrap">
          <q-chip
            :color="getRoleColor(userRole)"
            text-color="white"
            :icon="getRoleIcon(userRole)"
            dense
          >
            {{ userRole }}
          </q-chip>

          <q-btn-dropdown
            flat
            round
            dense
            :icon="'account_circle'"
            :label="userFullName"
            class="q-ml-sm"
          >
            <q-list>
              <q-item-label header>{{ userFullName }}</q-item-label>
              <q-item-label caption>{{ userAttributes.email }}</q-item-label>

              <q-separator />

              <q-item clickable v-close-popup @click="goToProfile">
                <q-item-section avatar>
                  <q-icon name="person" />
                </q-item-section>
                <q-item-section>{{ t('common.profile') }}</q-item-section>
              </q-item>

              <q-separator />

              <q-item class="q-px-sm">
                <q-item-section avatar>
                  <q-icon name="language" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t('language.label') }}</q-item-label>
                  <q-option-group
                    v-model="selectedLocale"
                    :options="languageOptions"
                    color="primary"
                    dense
                    type="radio"
                    class="q-mt-xs"
                  />
                </q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable v-close-popup @click="handleSignOut">
                <q-item-section avatar>
                  <q-icon name="logout" color="negative" />
                </q-item-section>
                <q-item-section>{{ t('login.actions.signOut') }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-if="isAuthenticated" v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>{{ t('navigation.header') }}</q-item-label>

        <!-- Dashboard -->
        <essential-link
          :title="t('navigation.dashboard.title')"
          :caption="t('navigation.dashboard.description')"
          icon="dashboard"
          link="/"
        />

        <!-- Role-specific menu items -->
        <template v-if="hasRole('Student')">
          <essential-link
            :title="t('navigation.student.competencies.title')"
            :caption="t('navigation.student.competencies.description')"
            icon="psychology"
            link="/me/competencies"
          />
        </template>

        <template v-if="hasRole('Student')">
          <essential-link
            :title="t('navigation.student.assessments.title')"
            :caption="t('navigation.student.assessments.description')"
            icon="quiz"
            link="/me/assessments"
          />
        </template>

        <template v-if="hasRole('Student')">
          <essential-link
            :title="t('navigation.student.projects.title')"
            :caption="t('navigation.student.projects.description')"
            icon="assignment"
            link="/me/projects"
          />
        </template>

        <template v-if="hasRole('Student')">
          <essential-link
            :title="t('navigation.common.domains.title')"
            :caption="t('navigation.student.domains.description')"
            icon="category"
            link="/domains"
          />
        </template>

        <template v-if="hasRole('Educator')">
          <essential-link
            :title="t('navigation.educator.students.title')"
            :caption="t('navigation.educator.students.description')"
            icon="groups"
            link="/educator/students"
          />

          <!--essential-link
            title="My Classes"
            caption="Manage your students"
            icon="school"
            link="/classes"
          /-->

          <essential-link
            :title="t('navigation.educator.assessments.title')"
            :caption="t('navigation.educator.assessments.description')"
            icon="assignment"
            link="/educator/assessments"
          />

          <essential-link
            :title="t('navigation.educator.projects.title')"
            :caption="t('navigation.educator.projects.description')"
            icon="folder"
            link="/educator/projects"
          />

          <!-- essential-link
            title="Reports"
            caption="Student progress reports"
            icon="assessment"
            link="/reports"
          /-->

          <essential-link
            :title="t('navigation.common.domains.title')"
            :caption="t('navigation.educator.domains.description')"
            icon="category"
            link="/domains"
          />
        </template>

        <template v-if="hasRole('Parent')">
          <essential-link
            :title="t('navigation.parent.children.title')"
            :caption="t('navigation.parent.children.description')"
            icon="family_restroom"
            link="/children"
          />
        </template>

        <template v-if="hasRole('Admin')">
          <essential-link
            :title="t('navigation.admin.users.title')"
            :caption="t('navigation.admin.users.description')"
            icon="people"
            link="/admin/users"
          />

          <essential-link
            :title="t('navigation.common.domains.title')"
            :caption="t('navigation.admin.domains.description')"
            icon="category"
            link="/domains"
          />
        </template>

        <q-separator class="q-my-md" />

        <!-- Common links -->
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import EssentialLink from 'components/EssentialLink.vue';
import { useQuasar } from 'quasar';
import type { MessageLanguages } from 'src/boot/i18n';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const $q = useQuasar();
const { t, locale } = useI18n();

const LANGUAGE_STORAGE_KEY = 'preferred-locale';
const LANGUAGE_OPTIONS: Array<{ value: MessageLanguages; labelKey: string }> = [
  { value: 'en-US', labelKey: 'language.options.enUS' },
  { value: 'fr', labelKey: 'language.options.fr' },
];

const languageOptions = computed(() =>
  LANGUAGE_OPTIONS.map(({ value, labelKey }) => ({
    value,
    label: t(labelKey),
  })),
);

const selectedLocale = computed<MessageLanguages>({
  get: () => locale.value as MessageLanguages,
  set: (value) => {
    if (locale.value !== value) {
      locale.value = value;
    }
    console.log(value);

    $q.localStorage.set(LANGUAGE_STORAGE_KEY, value);
  },
});

const {
  isAuthenticated,
  userFullName,
  userRole,
  userAttributes,
  handleSignOut: authSignOut,
  initAuth,
  hasRole,
} = useAuth();

const leftDrawerOpen = ref(false);

/**
 * Toggle left drawer
 */
function toggleLeftDrawer(): void {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

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
 * Navigate to profile page
 */
async function goToProfile(): Promise<void> {
  await router.push('/profile');
}

/**
 * Handle user sign out
 */
async function handleSignOut(): Promise<void> {
  try {
    await authSignOut();

    $q.notify({
      type: 'positive',
      message: t('login.notifications.signOutSuccess'),
    });

    await router.push('/login');
  } catch {
    $q.notify({
      type: 'negative',
      message: t('login.notifications.signOutError'),
    });
  }
}

/**
 * Initialize layout
 */
onMounted(async () => {
  await initAuth();
  // Router guard already handles authentication redirects
});
</script>
