<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg">
      <q-icon name="settings" class="q-mr-sm" />
      System Settings
    </div>

    <div class="row q-gutter-lg">
      <!-- General Settings -->
      <div class="col-12 col-lg-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">General Settings</div>

            <q-form class="q-gutter-md">
              <q-input
                v-model="settings.general.siteName"
                filled
                label="Site Name"
                @blur="saveSettings"
              />

              <q-input
                v-model="settings.general.siteDescription"
                filled
                type="textarea"
                label="Site Description"
                rows="3"
                @blur="saveSettings"
              />

              <q-select
                v-model="settings.general.defaultLanguage"
                filled
                :options="languageOptions"
                label="Default Language"
                @update:model-value="saveSettings"
              />

              <q-select
                v-model="settings.general.timezone"
                filled
                :options="timezoneOptions"
                label="System Timezone"
                @update:model-value="saveSettings"
              />

              <q-toggle
                v-model="settings.general.maintenanceMode"
                label="Maintenance Mode"
                @update:model-value="saveSettings"
              />
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Authentication Settings -->
      <div class="col-12 col-lg-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Authentication Settings</div>

            <q-form class="q-gutter-md">
              <q-toggle
                v-model="settings.auth.requireEmailVerification"
                label="Require Email Verification"
                @update:model-value="saveSettings"
              />

              <q-toggle
                v-model="settings.auth.enableMFA"
                label="Enable Multi-Factor Authentication"
                @update:model-value="saveSettings"
              />

              <q-input
                v-model.number="settings.auth.sessionTimeout"
                filled
                type="number"
                label="Session Timeout (minutes)"
                suffix="minutes"
                @blur="saveSettings"
              />

              <q-input
                v-model.number="settings.auth.passwordMinLength"
                filled
                type="number"
                label="Minimum Password Length"
                @blur="saveSettings"
              />

              <q-toggle
                v-model="settings.auth.requirePasswordComplexity"
                label="Require Password Complexity"
                @update:model-value="saveSettings"
              />
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Notification Settings -->
      <div class="col-12 col-lg-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Notification Settings</div>

            <q-form class="q-gutter-md">
              <q-toggle
                v-model="settings.notifications.emailNotifications"
                label="Enable Email Notifications"
                @update:model-value="saveSettings"
              />

              <q-toggle
                v-model="settings.notifications.smsNotifications"
                label="Enable SMS Notifications"
                @update:model-value="saveSettings"
              />

              <q-input
                v-model="settings.notifications.fromEmail"
                filled
                type="email"
                label="From Email Address"
                @blur="saveSettings"
              />

              <q-input
                v-model="settings.notifications.fromName"
                filled
                label="From Name"
                @blur="saveSettings"
              />

              <q-select
                v-model="settings.notifications.defaultFrequency"
                filled
                :options="frequencyOptions"
                label="Default Notification Frequency"
                @update:model-value="saveSettings"
              />
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- System Limits -->
      <div class="col-12 col-lg-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">System Limits</div>

            <q-form class="q-gutter-md">
              <q-input
                v-model.number="settings.limits.maxUsers"
                filled
                type="number"
                label="Maximum Users"
                @blur="saveSettings"
              />

              <q-input
                v-model.number="settings.limits.maxFileSize"
                filled
                type="number"
                label="Maximum File Size (MB)"
                suffix="MB"
                @blur="saveSettings"
              />

              <q-input
                v-model.number="settings.limits.maxAssessmentQuestions"
                filled
                type="number"
                label="Max Questions per Assessment"
                @blur="saveSettings"
              />

              <q-input
                v-model.number="settings.limits.maxStudentsPerClass"
                filled
                type="number"
                label="Max Students per Class"
                @blur="saveSettings"
              />

              <q-input
                v-model.number="settings.limits.dataRetentionDays"
                filled
                type="number"
                label="Data Retention (days)"
                suffix="days"
                @blur="saveSettings"
              />
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Feature Flags -->
      <div class="col-12 col-lg-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Feature Flags</div>

            <q-form class="q-gutter-md">
              <q-toggle
                v-model="settings.features.enableCompetencyMapping"
                label="Enable Competency Mapping"
                @update:model-value="saveSettings"
              />

              <q-toggle
                v-model="settings.features.enableAdvancedAnalytics"
                label="Enable Advanced Analytics"
                @update:model-value="saveSettings"
              />

              <q-toggle
                v-model="settings.features.enableAIRecommendations"
                label="Enable AI Recommendations"
                @update:model-value="saveSettings"
              />

              <q-toggle
                v-model="settings.features.enableGamification"
                label="Enable Gamification"
                @update:model-value="saveSettings"
              />

              <q-toggle
                v-model="settings.features.enableIntegrations"
                label="Enable Third-party Integrations"
                @update:model-value="saveSettings"
              />
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Backup & Maintenance -->
      <div class="col-12 col-lg-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Backup & Maintenance</div>

            <q-form class="q-gutter-md">
              <q-toggle
                v-model="settings.backup.autoBackup"
                label="Enable Automatic Backups"
                @update:model-value="saveSettings"
              />

              <q-select
                v-model="settings.backup.backupFrequency"
                filled
                :options="backupFrequencyOptions"
                label="Backup Frequency"
                :disable="!settings.backup.autoBackup"
                @update:model-value="saveSettings"
              />

              <q-input
                v-model.number="settings.backup.retentionDays"
                filled
                type="number"
                label="Backup Retention (days)"
                suffix="days"
                :disable="!settings.backup.autoBackup"
                @blur="saveSettings"
              />

              <div class="q-mt-md">
                <q-btn
                  color="primary"
                  icon="backup"
                  label="Create Backup Now"
                  @click="createBackup"
                />
                <q-btn
                  flat
                  color="primary"
                  icon="restore"
                  label="View Backups"
                  class="q-ml-sm"
                  @click="viewBackups"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- System Status -->
    <q-card class="q-mt-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">System Status</div>

        <div class="row q-gutter-md">
          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <q-icon name="storage" size="2em" :color="systemStatus.database.color" />
                <div class="text-subtitle1 q-mt-sm">Database</div>
                <div class="text-caption">{{ systemStatus.database.status }}</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <q-icon name="cloud" size="2em" :color="systemStatus.storage.color" />
                <div class="text-subtitle1 q-mt-sm">File Storage</div>
                <div class="text-caption">{{ systemStatus.storage.usage }}% used</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <q-icon name="memory" size="2em" :color="systemStatus.memory.color" />
                <div class="text-subtitle1 q-mt-sm">Memory</div>
                <div class="text-caption">{{ systemStatus.memory.usage }}% used</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <q-icon name="schedule" size="2em" :color="systemStatus.uptime.color" />
                <div class="text-subtitle1 q-mt-sm">Uptime</div>
                <div class="text-caption">{{ systemStatus.uptime.value }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Settings {
  general: {
    siteName: string;
    siteDescription: string;
    defaultLanguage: string;
    timezone: string;
    maintenanceMode: boolean;
  };
  auth: {
    requireEmailVerification: boolean;
    enableMFA: boolean;
    sessionTimeout: number;
    passwordMinLength: number;
    requirePasswordComplexity: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    fromEmail: string;
    fromName: string;
    defaultFrequency: string;
  };
  limits: {
    maxUsers: number;
    maxFileSize: number;
    maxAssessmentQuestions: number;
    maxStudentsPerClass: number;
    dataRetentionDays: number;
  };
  features: {
    enableCompetencyMapping: boolean;
    enableAdvancedAnalytics: boolean;
    enableAIRecommendations: boolean;
    enableGamification: boolean;
    enableIntegrations: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionDays: number;
  };
}

const settings = ref<Settings>({
  general: {
    siteName: 'Competency Hub',
    siteDescription:
      'A comprehensive learning management system focused on competency-based education.',
    defaultLanguage: 'English',
    timezone: 'UTC-5 (Eastern Time)',
    maintenanceMode: false,
  },
  auth: {
    requireEmailVerification: true,
    enableMFA: false,
    sessionTimeout: 480,
    passwordMinLength: 8,
    requirePasswordComplexity: true,
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    fromEmail: 'noreply@competencyhub.com',
    fromName: 'Competency Hub',
    defaultFrequency: 'Daily',
  },
  limits: {
    maxUsers: 10000,
    maxFileSize: 50,
    maxAssessmentQuestions: 100,
    maxStudentsPerClass: 30,
    dataRetentionDays: 365,
  },
  features: {
    enableCompetencyMapping: true,
    enableAdvancedAnalytics: true,
    enableAIRecommendations: false,
    enableGamification: true,
    enableIntegrations: true,
  },
  backup: {
    autoBackup: true,
    backupFrequency: 'Daily',
    retentionDays: 30,
  },
});

const languageOptions = ['English', 'Spanish', 'French', 'German', 'Chinese'];
const timezoneOptions = [
  'UTC-8 (Pacific Time)',
  'UTC-7 (Mountain Time)',
  'UTC-6 (Central Time)',
  'UTC-5 (Eastern Time)',
  'UTC+0 (Greenwich Mean Time)',
  'UTC+1 (Central European Time)',
];
const frequencyOptions = ['Immediate', 'Hourly', 'Daily', 'Weekly', 'Monthly'];
const backupFrequencyOptions = ['Hourly', 'Daily', 'Weekly', 'Monthly'];

const systemStatus = ref({
  database: {
    status: 'Connected',
    color: 'green',
  },
  storage: {
    usage: 67,
    color: 'orange',
  },
  memory: {
    usage: 45,
    color: 'green',
  },
  uptime: {
    value: '15 days',
    color: 'green',
  },
});

function saveSettings(): void {
  console.log('Saving settings:', settings.value);
  // TODO: Implement API call to save settings
}

function createBackup(): void {
  console.log('Creating system backup...');
  // TODO: Implement backup creation
}

function viewBackups(): void {
  console.log('Viewing backup history...');
  // TODO: Navigate to backup management page
}
</script>
