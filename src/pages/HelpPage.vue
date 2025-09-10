<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg">
      <q-icon name="help" class="q-mr-sm" />
      Help & Support
    </div>

    <div class="row q-gutter-lg">
      <!-- FAQ Section -->
      <div class="col-12 col-lg-8">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Frequently Asked Questions</div>

            <q-list>
              <q-expansion-item
                icon="quiz"
                label="How do I start a new competency?"
                header-class="text-primary"
              >
                <q-card>
                  <q-card-section>
                    Navigate to the Competencies page and look for competencies marked as
                    "Unlocked". Click the "Start" button to begin working on that competency.
                  </q-card-section>
                </q-card>
              </q-expansion-item>

              <q-expansion-item
                icon="assessment"
                label="How are assessments graded?"
                header-class="text-primary"
              >
                <q-card>
                  <q-card-section>
                    Assessments are automatically graded based on your responses. You'll receive
                    immediate feedback and a score upon completion.
                  </q-card-section>
                </q-card>
              </q-expansion-item>

              <q-expansion-item
                icon="groups"
                label="What are the different user roles?"
                header-class="text-primary"
              >
                <q-card>
                  <q-card-section>
                    <p><strong>Student:</strong> Access learning materials and take assessments</p>
                    <p>
                      <strong>Educator:</strong> Create assessments and monitor student progress
                    </p>
                    <p><strong>Parent:</strong> View child's progress and achievements</p>
                    <p><strong>Admin:</strong> Manage users and platform settings</p>
                  </q-card-section>
                </q-card>
              </q-expansion-item>

              <q-expansion-item
                icon="settings"
                label="How do I change my account settings?"
                header-class="text-primary"
              >
                <q-card>
                  <q-card-section>
                    Go to Settings from the main navigation menu or click on your profile avatar in
                    the header to access account preferences.
                  </q-card-section>
                </q-card>
              </q-expansion-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Contact Support -->
      <div class="col-12 col-lg-4">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Contact Support</div>

            <q-list>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="email" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Email Support</q-item-label>
                  <q-item-label caption>support@competencyhub.com</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="phone" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Phone Support</q-item-label>
                  <q-item-label caption>1-800-COMPETENCY</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="schedule" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Support Hours</q-item-label>
                  <q-item-label caption>Mon-Fri 9AM-5PM EST</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <q-btn
              color="primary"
              icon="chat"
              label="Start Live Chat"
              class="full-width q-mt-md"
              @click="startChat"
            />
          </q-card-section>
        </q-card>

        <!-- Quick Links -->
        <q-card class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Quick Links</div>

            <q-list>
              <q-item clickable>
                <q-item-section avatar>
                  <q-icon name="book" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>User Guide</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable>
                <q-item-section avatar>
                  <q-icon name="video_library" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Video Tutorials</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable>
                <q-item-section avatar>
                  <q-icon name="bug_report" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Report a Bug</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable>
                <q-item-section avatar>
                  <q-icon name="lightbulb" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Feature Request</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
function startChat(): void {
  // TODO: Implement live chat functionality
  console.log('Starting live chat...');
}
</script>
