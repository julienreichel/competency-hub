<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>{{ t('app.title') }}</q-toolbar-title>

        <!-- User Menu -->
        <div v-if="isAuthenticated" class="q-gutter-sm row items-center no-wrap">
          <role-chip :role="displayRole" size="md" class="user-role-chip" />

          <q-btn-dropdown
            flat
            dense
            class="q-ml-sm user-menu__trigger"
            content-class="user-menu__dropdown"
          >
            <template #label>
              <div class="row items-center no-wrap q-gutter-xs">
                <q-avatar size="28px" class="user-menu__trigger-avatar">
                  <img v-if="menuAvatar" :src="menuAvatar" alt="" />
                  <span v-else>{{ userInitials }}</span>
                </q-avatar>
                <span class="user-menu__trigger-label">{{ userFullName }}</span>
              </div>
            </template>

            <q-list class="user-menu q-pt-md">
              <q-item class="q-">
                <q-item-section avatar>
                  <q-avatar size="lg">
                    <img v-if="menuAvatar" :src="menuAvatar" alt="" />
                    <span v-else>{{ userInitials }}</span>
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ userFullName }}</q-item-label>
                  <q-item-label caption>{{ userEmail }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator spaced />

              <q-item clickable v-close-popup @click="goToProfile">
                <q-item-section avatar>
                  <q-icon name="person" />
                </q-item-section>
                <q-item-section>{{ t('common.profile') }}</q-item-section>
              </q-item>

              <q-separator class="user-menu__separator" spaced />

              <q-item class="q-pt-md">
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
                    class="q-py-sm"
                  />
                </q-item-section>
              </q-item>

              <q-separator spaced />

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
            icon="assignment_turned_in"
            link="/educator/assessments"
          />

          <essential-link
            :title="t('navigation.educator.projects.title')"
            :caption="t('navigation.educator.projects.description')"
            icon="assignment"
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
            icon="admin_panel_settings"
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
import RoleChip, { type RoleChipRole } from 'src/components/ui/RoleChip.vue';
import { useUsers } from 'src/composables/useUsers';
import type { User } from 'src/models/User';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const $q = useQuasar();
const { t, locale } = useI18n();

const {
  isAuthenticated,
  userFullName,
  userRole,
  userAttributes,
  userId,
  handleSignOut: authSignOut,
  initAuth,
  hasRole,
} = useAuth();
const { getCurrentUser } = useUsers();

const LANGUAGE_STORAGE_KEY = 'preferred-locale';
const LANGUAGE_OPTIONS: Array<{ value: MessageLanguages; labelKey: string }> = [
  { value: 'en-US', labelKey: 'language.options.enUS' },
  { value: 'fr', labelKey: 'language.options.fr' },
];
const MAX_INITIALS = 2;

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
    if ($q.localStorage) {
      $q.localStorage.set(LANGUAGE_STORAGE_KEY, value);
    }
  },
});

const menuUser = ref<User | null>(null);

const roleMapping: Record<string, RoleChipRole> = {
  Admin: 'Admin',
  Educator: 'Educator',
  Parent: 'Parent',
  Student: 'Student',
};

const displayRole = computed<RoleChipRole>(() => roleMapping[userRole.value] ?? 'Unknown');

const userEmail = computed(
  () => userAttributes.value.email || userAttributes.value.preferred_username || '',
);

const menuAvatar = computed(() => menuUser.value?.avatar || null);

const userInitials = computed(() => {
  const name = userFullName.value.trim();
  if (!name) {
    return (userRole.value?.[0] ?? 'U').toUpperCase();
  }
  const parts = name.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, MAX_INITIALS)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return initials || (userRole.value?.[0] ?? 'U').toUpperCase();
});

const loadMenuUser = async (force = false): Promise<void> => {
  if (!isAuthenticated.value) {
    menuUser.value = null;
    return;
  }
  try {
    const user = await getCurrentUser(!force);
    menuUser.value = user ?? null;
  } catch {
    menuUser.value = null;
  }
};

const leftDrawerOpen = ref(false);

function toggleLeftDrawer(): void {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function goToProfile(): Promise<void> {
  await router.push('/profile');
}

async function handleSignOut(): Promise<void> {
  try {
    await authSignOut();

    $q.notify({
      type: 'positive',
      message: t('login.notifications.signOutSuccess'),
    });

    menuUser.value = null;
    await router.push('/login');
  } catch {
    $q.notify({
      type: 'negative',
      message: t('login.notifications.signOutError'),
    });
  }
}

watch(
  () => isAuthenticated.value,
  async (auth) => {
    if (!auth) {
      menuUser.value = null;
      return;
    }
    await loadMenuUser(true);
  },
);

watch(
  () => userId.value,
  async (current, previous) => {
    if (!current || current === 'undefined') {
      menuUser.value = null;
      return;
    }
    if (current !== previous) {
      await loadMenuUser(true);
    }
  },
);

onMounted(async () => {
  await initAuth();
  await loadMenuUser(false);
});
</script>
