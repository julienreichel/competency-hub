<template>
  <q-page class="q-pa-lg">
    <!-- Welcome Header -->
    <div class="row q-mb-lg">
      <div class="col">
        <h4 class="text-primary q-my-none">Welcome back, {{ userFullName }}!</h4>
        <p class="text-grey-7 q-mb-none">Here's your learning dashboard as a {{ userRole }}</p>
      </div>
      <div class="col-auto">
        <q-chip
          :color="getRoleColor(userRole)"
          text-color="white"
          :icon="getRoleIcon(userRole)"
          size="lg"
        >
          {{ userRole }}
        </q-chip>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="row q-gutter-md q-mb-lg">
      <div class="col-12 col-md-3">
        <q-card class="bg-blue-1">
          <q-card-section>
            <div class="text-h6 text-blue-8">
              <q-icon name="psychology" class="q-mr-sm" />
              Competencies
            </div>
            <div class="text-h4 text-blue-10">12</div>
            <div class="text-caption text-blue-7">Active learning paths</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-green-1">
          <q-card-section>
            <div class="text-h6 text-green-8">
              <q-icon name="check_circle" class="q-mr-sm" />
              Completed
            </div>
            <div class="text-h4 text-green-10">8</div>
            <div class="text-caption text-green-7">Assessments passed</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-orange-1">
          <q-card-section>
            <div class="text-h6 text-orange-8">
              <q-icon name="schedule" class="q-mr-sm" />
              In Progress
            </div>
            <div class="text-h4 text-orange-10">4</div>
            <div class="text-caption text-orange-7">Current activities</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-purple-1">
          <q-card-section>
            <div class="text-h6 text-purple-8">
              <q-icon name="star" class="q-mr-sm" />
              Achievement
            </div>
            <div class="text-h4 text-purple-10">85%</div>
            <div class="text-caption text-purple-7">Overall progress</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Role-specific Content -->
    <div class="row q-gutter-md">
      <!-- Recent Activities -->
      <div class="col-12 col-lg-8">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="timeline" class="q-mr-sm" />
              Recent Activities
            </div>

            <q-list separator>
              <q-item>
                <q-item-section avatar>
                  <q-avatar color="green" text-color="white" icon="check" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Completed "Mathematics Fundamentals" assessment</q-item-label>
                  <q-item-label caption>2 hours ago</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="green" label="95%" />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-avatar color="blue" text-color="white" icon="play_arrow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Started "Critical Thinking" competency</q-item-label>
                  <q-item-label caption>1 day ago</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="blue" label="In Progress" />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-avatar color="orange" text-color="white" icon="feedback" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Received feedback on "Communication Skills"</q-item-label>
                  <q-item-label caption>3 days ago</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="orange" label="Needs Review" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Quick Actions -->
      <div class="col-12 col-lg-4">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="bolt" class="q-mr-sm" />
              Quick Actions
            </div>

            <div class="column q-gutter-sm">
              <q-btn
                color="primary"
                icon="add"
                label="Start New Assessment"
                class="full-width"
                @click="startNewAssessment"
              />

              <q-btn
                color="secondary"
                icon="psychology"
                label="Browse Competencies"
                class="full-width"
                @click="browseCompetencies"
              />

              <q-btn
                color="accent"
                icon="assessment"
                label="View Progress Report"
                class="full-width"
                @click="viewProgressReport"
              />

              <q-btn
                color="info"
                icon="help"
                label="Get Help"
                class="full-width"
                @click="getHelp"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { userFullName, userRole } = useAuth();

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
 * Quick action handlers
 */
async function startNewAssessment(): Promise<void> {
  await router.push('/assessments');
}

async function browseCompetencies(): Promise<void> {
  if (userRole.value === 'Student') {
    await router.push('/me/competencies');
    return;
  }

  if (userRole.value === 'Educator') {
    await router.push('/educator/students');
    return;
  }

  if (userRole.value === 'Parent') {
    await router.push('/children');
    return;
  }

  await router.push('/domains');
}

async function viewProgressReport(): Promise<void> {
  await router.push('/reports');
}

async function getHelp(): Promise<void> {
  await router.push('/help');
}
</script>
