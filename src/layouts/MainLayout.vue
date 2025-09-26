<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Competency Hub </q-toolbar-title>

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
                <q-item-section>Profile</q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable v-close-popup @click="handleSignOut">
                <q-item-section avatar>
                  <q-icon name="logout" color="negative" />
                </q-item-section>
                <q-item-section>Sign Out</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-if="isAuthenticated" v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Navigation </q-item-label>

        <!-- Dashboard -->
        <essential-link
          title="Dashboard"
          caption="Overview and quick actions"
          icon="dashboard"
          link="/"
        />

        <!-- Role-specific menu items -->
        <template v-if="hasRole('Student')">
          <essential-link
            title="My Competencies"
            caption="Track your learning progress"
            icon="psychology"
            link="/me/competencies"
          />
        </template>

        <!-- template v-if="hasAnyRole(['Student', 'Parent'])">
          <essential-link
            title="Assessments"
            caption="View and take assessments"
            icon="quiz"
            link="/assessments"
          />
        </!-->

        <template v-if="hasRole('Student')">
          <essential-link
            title="Domains"
            caption="Browse domains"
            icon="category"
            link="/domains"
          />
        </template>

        <template v-if="hasRole('Educator')">
          <essential-link
            title="My Students"
            caption="Manage assigned students"
            icon="groups"
            link="/educator/students"
          />

          <!--essential-link
            title="My Classes"
            caption="Manage your students"
            icon="school"
            link="/classes"
          /-->

          <!--essential-link
            title="Assessments"
            caption="Create and grade assessments"
            icon="assignment"
            link="/educator/assessments"
          /-->

          <!-- essential-link
            title="Reports"
            caption="Student progress reports"
            icon="assessment"
            link="/reports"
          /-->

          <essential-link
            title="Domains"
            caption="Manage competency domains"
            icon="category"
            link="/domains"
          />
        </template>

        <template v-if="hasRole('Parent')">
          <essential-link
            title="My Children"
            caption="Monitor your children's progress"
            icon="family_restroom"
            link="/children"
          />
        </template>

        <template v-if="hasRole('Admin')">
          <essential-link
            title="User Management"
            caption="Manage platform users"
            icon="people"
            link="/admin/users"
          />

          <essential-link
            title="Domains"
            caption="Manage competencies"
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
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const $q = useQuasar();

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
      message: 'Successfully signed out',
      position: 'top',
    });

    await router.push('/login');
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Sign out failed. Please try again.',
      position: 'top',
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
