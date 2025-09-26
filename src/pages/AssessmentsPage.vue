<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg">
      <q-icon name="quiz" class="q-mr-sm" />
      Assessments
    </div>

    <!-- Quick Stats -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-lg-3">
        <q-card class="bg-blue-1">
          <q-card-section>
            <div class="text-h6 text-blue-8">Available</div>
            <div class="text-h4 text-blue-10">5</div>
            <div class="text-caption text-blue-7">New assessments</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <q-card class="bg-orange-1">
          <q-card-section>
            <div class="text-h6 text-orange-8">In Progress</div>
            <div class="text-h4 text-orange-10">2</div>
            <div class="text-caption text-orange-7">Started assessments</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <q-card class="bg-green-1">
          <q-card-section>
            <div class="text-h6 text-green-8">Completed</div>
            <div class="text-h4 text-green-10">12</div>
            <div class="text-caption text-green-7">Finished assessments</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <q-card class="bg-purple-1">
          <q-card-section>
            <div class="text-h6 text-purple-8">Average</div>
            <div class="text-h4 text-purple-10">87%</div>
            <div class="text-caption text-purple-7">Overall score</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Filter Tabs -->
    <q-tabs
      v-model="activeTab"
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="justify"
      narrow-indicator
    >
      <q-tab name="available" label="Available" />
      <q-tab name="in-progress" label="In Progress" />
      <q-tab name="completed" label="Completed" />
    </q-tabs>

    <q-separator />

    <!-- Assessment Lists -->
    <q-tab-panels v-model="activeTab" animated>
      <!-- Available Assessments -->
      <q-tab-panel name="available">
        <div class="row q-gutter-md">
          <div
            v-for="assessment in availableAssessments"
            :key="assessment.id"
            class="col-12 col-md-6"
          >
            <q-card>
              <q-card-section>
                <div class="row items-center">
                  <div class="col">
                    <div class="text-h6">{{ assessment.title }}</div>
                    <div class="text-subtitle2 text-grey-7">{{ assessment.competency }}</div>
                  </div>
                  <div class="col-auto">
                    <q-chip color="blue" text-color="white" icon="schedule">
                      {{ assessment.duration }} min
                    </q-chip>
                  </div>
                </div>

                <p class="text-body2 q-mt-md">{{ assessment.description }}</p>

                <div class="row items-center q-mt-md">
                  <div class="col">
                    <div class="text-caption text-grey-6">
                      {{ assessment.questions }} questions • Due {{ assessment.dueDate }}
                    </div>
                  </div>
                </div>
              </q-card-section>

              <q-card-actions align="right">
                <q-btn
                  color="primary"
                  label="Start Assessment"
                  @click="startAssessment(assessment)"
                />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <!-- In Progress Assessments -->
      <q-tab-panel name="in-progress">
        <div class="row q-gutter-md">
          <div
            v-for="assessment in inProgressAssessments"
            :key="assessment.id"
            class="col-12 col-md-6"
          >
            <q-card>
              <q-card-section>
                <div class="row items-center">
                  <div class="col">
                    <div class="text-h6">{{ assessment.title }}</div>
                    <div class="text-subtitle2 text-grey-7">{{ assessment.competency }}</div>
                  </div>
                  <div class="col-auto">
                    <q-chip color="orange" text-color="white" icon="schedule">
                      {{ assessment.timeRemaining }}
                    </q-chip>
                  </div>
                </div>

                <div class="q-mt-md">
                  <div class="text-caption text-grey-6 q-mb-xs">Progress</div>
                  <q-linear-progress
                    :value="(assessment.progress || 0) / 100"
                    color="orange"
                    size="8px"
                    rounded
                  />
                  <div class="text-caption text-right q-mt-xs">
                    {{ assessment.currentQuestion }}/{{ assessment.totalQuestions }} questions
                  </div>
                </div>
              </q-card-section>

              <q-card-actions align="right">
                <q-btn color="orange" label="Continue" @click="continueAssessment(assessment)" />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <!-- Completed Assessments -->
      <q-tab-panel name="completed">
        <div class="row q-gutter-md">
          <div
            v-for="assessment in completedAssessments"
            :key="assessment.id"
            class="col-12 col-md-6"
          >
            <q-card>
              <q-card-section>
                <div class="row items-center">
                  <div class="col">
                    <div class="text-h6">{{ assessment.title }}</div>
                    <div class="text-subtitle2 text-grey-7">{{ assessment.competency }}</div>
                  </div>
                  <div class="col-auto">
                    <q-chip
                      :color="getScoreColor(assessment.score || 0)"
                      text-color="white"
                      icon="grade"
                    >
                      {{ assessment.score }}%
                    </q-chip>
                  </div>
                </div>

                <div class="q-mt-md">
                  <div class="text-caption text-grey-6">
                    Completed on {{ assessment.completedDate }}
                  </div>
                  <div class="text-caption text-grey-6">
                    {{ assessment.feedback }}
                  </div>
                </div>
              </q-card-section>

              <q-card-actions align="right">
                <q-btn flat color="primary" label="View Results" @click="viewResults(assessment)" />
                <q-btn color="primary" label="Retake" @click="retakeAssessment(assessment)" />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref } from 'vue';

interface Assessment {
  id: string;
  title: string;
  competency: string;
  description: string;
  duration?: number;
  questions?: number;
  dueDate?: string;
  score?: number;
  completedDate?: string;
  feedback?: string;
  progress?: number;
  currentQuestion?: number;
  totalQuestions?: number;
  timeRemaining?: string;
}

const $q = useQuasar();

const activeTab = ref('available');

// Mock data - replace with actual API calls
const availableAssessments = ref<Assessment[]>([
  {
    id: '1',
    title: 'Algebra Fundamentals',
    competency: 'Mathematics - Algebra',
    description: 'Test your understanding of basic algebraic concepts and equation solving.',
    duration: 45,
    questions: 20,
    dueDate: 'Sep 15, 2025',
  },
  {
    id: '2',
    title: 'Essay Writing Skills',
    competency: 'Language Arts - Writing',
    description: 'Demonstrate your ability to write clear, persuasive essays.',
    duration: 60,
    questions: 5,
    dueDate: 'Sep 20, 2025',
  },
]);

const inProgressAssessments = ref<Assessment[]>([
  {
    id: '3',
    title: 'Physics Motion Laws',
    competency: 'Science - Physics',
    description: "Understanding Newton's laws of motion",
    duration: 30,
    progress: 65,
    currentQuestion: 13,
    totalQuestions: 20,
    timeRemaining: '12 min left',
  },
]);

const completedAssessments = ref<Assessment[]>([
  {
    id: '4',
    title: 'Basic Geometry',
    competency: 'Mathematics - Geometry',
    description: 'Shapes, angles, and area calculations',
    score: 92,
    completedDate: 'Sep 5, 2025',
    feedback: 'Excellent work! Strong understanding demonstrated.',
  },
  {
    id: '5',
    title: 'Reading Comprehension',
    competency: 'Language Arts - Reading',
    description: 'Analyze and interpret written texts',
    score: 78,
    completedDate: 'Sep 3, 2025',
    feedback: 'Good performance. Focus on inference questions.',
  },
]);

// Constants
const SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 80,
  FAIR: 70,
} as const;

// Methods
function getScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'green';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'light-green';
  if (score >= SCORE_THRESHOLDS.FAIR) return 'orange';
  return 'red';
}

function startAssessment(assessment: Assessment): void {
  $q.dialog({
    title: 'Start Assessment',
    message: `Are you ready to start "${assessment.title}"? This assessment will take approximately ${assessment.duration} minutes to complete.`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    console.log('Starting assessment:', assessment.id);
    // Navigate to assessment interface
  });
}

function continueAssessment(assessment: Assessment): void {
  console.log('Continuing assessment:', assessment.id);
  // Navigate to assessment interface at current question
}

function viewResults(assessment: Assessment): void {
  console.log('Viewing results for:', assessment.id);
  // Navigate to results page
}

function retakeAssessment(assessment: Assessment): void {
  $q.dialog({
    title: 'Retake Assessment',
    message: `Do you want to retake "${assessment.title}"? Your previous score was ${assessment.score}%.`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    console.log('Retaking assessment:', assessment.id);
    // Start assessment again
  });
}
</script>
