<template>
  <q-page class="q-pa-lg">
    <div class="row justify-center">
      <div class="col-12 col-md-10">
        <div class="text-h4 q-mb-lg">
          <q-icon name="settings" class="q-mr-sm" />
          Settings
        </div>

        <div class="row q-gutter-lg">
          <!-- Account Settings -->
          <div class="col-12 col-md-6">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  <q-icon name="account_circle" class="q-mr-sm" />
                  Account Settings
                </div>

                <q-list>
                  <q-item clickable @click="$router.push('/profile')">
                    <q-item-section avatar>
                      <q-icon name="person" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Edit Profile</q-item-label>
                      <q-item-label caption>Update your personal information</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-icon name="chevron_right" />
                    </q-item-section>
                  </q-item>

                  <q-item clickable>
                    <q-item-section avatar>
                      <q-icon name="lock" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Change Password</q-item-label>
                      <q-item-label caption>Update your account password</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-icon name="chevron_right" />
                    </q-item-section>
                  </q-item>

                  <q-item clickable>
                    <q-item-section avatar>
                      <q-icon name="email" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Email Preferences</q-item-label>
                      <q-item-label caption>Manage notification settings</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-icon name="chevron_right" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>

          <!-- App Preferences -->
          <div class="col-12 col-md-6">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  <q-icon name="tune" class="q-mr-sm" />
                  App Preferences
                </div>

                <q-list>
                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="palette" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Theme</q-item-label>
                      <q-item-label caption>Choose your preferred theme</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-toggle v-model="darkMode" />
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="language" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Language</q-item-label>
                      <q-item-label caption>Select your language</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-select
                        v-model="selectedLanguage"
                        :options="languageOptions"
                        outlined
                        dense
                        style="min-width: 120px"
                      />
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="notifications" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Push Notifications</q-item-label>
                      <q-item-label caption>Receive app notifications</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-toggle v-model="notifications" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>

          <!-- Privacy & Security -->
          <div class="col-12">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  <q-icon name="security" class="q-mr-sm" />
                  Privacy & Security
                </div>

                <q-list>
                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="visibility" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Profile Visibility</q-item-label>
                      <q-item-label caption>Control who can see your profile</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-select
                        v-model="profileVisibility"
                        :options="visibilityOptions"
                        outlined
                        dense
                        style="min-width: 150px"
                      />
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="analytics" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Usage Analytics</q-item-label>
                      <q-item-label caption>Help improve the app</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-toggle v-model="analytics" />
                    </q-item-section>
                  </q-item>

                  <q-item clickable>
                    <q-item-section avatar>
                      <q-icon name="download" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Export Data</q-item-label>
                      <q-item-label caption>Download your data</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-icon name="chevron_right" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Settings state
const darkMode = ref(false);
const notifications = ref(true);
const analytics = ref(true);
const selectedLanguage = ref('English');
const profileVisibility = ref('Public');

// Options
const languageOptions = ['English', 'French', 'Spanish', 'German'];
const visibilityOptions = ['Public', 'Friends', 'Private'];
</script>
