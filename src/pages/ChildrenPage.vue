<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg">
      <q-icon name="family_restroom" class="q-mr-sm" />
      My Children
    </div>

    <!-- Add Child Button -->
    <div class="row justify-end q-mb-lg">
      <q-btn color="primary" icon="add" label="Add Child" @click="showAddChildDialog = true" />
    </div>

    <!-- Children Cards -->
    <div class="row q-gutter-lg">
      <div v-for="child in children" :key="child.id" class="col-12 col-md-6 col-lg-4">
        <q-card class="child-card">
          <q-card-section>
            <div class="row items-center">
              <q-avatar size="60px" color="primary" text-color="white">
                <q-img v-if="child.avatar" :src="child.avatar" :alt="child.name" />
                <span v-else>{{ getInitials(child.name) }}</span>
              </q-avatar>
              <div class="q-ml-md">
                <div class="text-h6">{{ child.name }}</div>
                <div class="text-subtitle2 text-grey-6">
                  Grade {{ child.grade }} • Age {{ child.age }}
                </div>
                <div class="text-caption text-grey-5">
                  {{ child.school }}
                </div>
              </div>
            </div>
          </q-card-section>

          <!-- Progress Overview -->
          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">Recent Progress</div>
            <div class="row q-gutter-sm">
              <div class="col">
                <div class="text-caption">Assessments</div>
                <div class="text-h6 text-green">{{ child.stats.completedAssessments }}</div>
              </div>
              <div class="col">
                <div class="text-caption">Avg Score</div>
                <div class="text-h6 text-blue">{{ child.stats.averageScore }}%</div>
              </div>
              <div class="col">
                <div class="text-caption">Study Time</div>
                <div class="text-h6 text-purple">{{ child.stats.studyHours }}h</div>
              </div>
            </div>
          </q-card-section>

          <!-- Subject Progress -->
          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">Subject Progress</div>
            <div v-for="subject in child.subjects" :key="subject.name" class="q-mb-xs">
              <div class="row items-center justify-between">
                <span class="text-caption">{{ subject.name }}</span>
                <span class="text-caption">{{ subject.progress }}%</span>
              </div>
              <q-linear-progress
                :value="subject.progress / 100"
                :color="getProgressColor(subject.progress)"
                size="8px"
              />
            </div>
          </q-card-section>

          <!-- Quick Actions -->
          <q-card-actions>
            <q-btn
              flat
              color="primary"
              icon="analytics"
              label="View Reports"
              @click="viewChildReports(child)"
            />
            <q-btn
              flat
              color="primary"
              icon="school"
              label="Competencies"
              @click="viewChildCompetencies(child)"
            />
            <q-btn flat icon="more_vert">
              <q-menu>
                <q-list>
                  <q-item clickable @click="editChild(child)">
                    <q-item-section>Edit Profile</q-item-section>
                  </q-item>
                  <q-item clickable @click="viewDetailedProgress(child)">
                    <q-item-section>Detailed Progress</q-item-section>
                  </q-item>
                  <q-item clickable @click="contactTeachers(child)">
                    <q-item-section>Contact Teachers</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable @click="removeChild(child)">
                    <q-item-section>Remove Child</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="children.length === 0" class="text-center q-mt-xl">
      <q-icon name="family_restroom" size="4em" color="grey-5" />
      <div class="text-h6 q-mt-md text-grey-6">No children added yet</div>
      <div class="text-body2 text-grey-5">
        Add your children to monitor their learning progress.
      </div>
      <q-btn
        color="primary"
        label="Add Your First Child"
        class="q-mt-md"
        @click="showAddChildDialog = true"
      />
    </div>

    <!-- Add Child Dialog -->
    <q-dialog v-model="showAddChildDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add Child</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="addChild" class="q-gutter-md">
            <q-input
              v-model="newChild.name"
              filled
              label="Full Name *"
              :rules="[(val) => !!val || 'Name is required']"
            />

            <q-input
              v-model.number="newChild.age"
              filled
              type="number"
              label="Age *"
              :rules="[(val) => !!val || 'Age is required']"
            />

            <q-select
              v-model="newChild.grade"
              filled
              :options="gradeOptions"
              label="Grade Level *"
              :rules="[(val) => !!val || 'Grade is required']"
            />

            <q-input v-model="newChild.school" filled label="School" />

            <q-input
              v-model="newChild.studentId"
              filled
              label="Student ID"
              hint="If your child is already registered in the system"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showAddChildDialog = false" />
          <q-btn color="primary" label="Add Child" @click="addChild" :disable="!isNewChildValid" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface Child {
  id: string;
  name: string;
  age: number;
  grade: string;
  school: string;
  avatar?: string;
  stats: {
    completedAssessments: number;
    averageScore: number;
    studyHours: number;
  };
  subjects: Array<{
    name: string;
    progress: number;
  }>;
}

interface NewChild {
  name: string;
  age: number | null;
  grade: string;
  school: string;
  studentId: string;
}

const showAddChildDialog = ref(false);

const newChild = ref<NewChild>({
  name: '',
  age: null,
  grade: '',
  school: '',
  studentId: '',
});

const gradeOptions = [
  'Pre-K',
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
];

// Mock data - replace with actual API call
const children = ref<Child[]>([
  {
    id: '1',
    name: 'Emma Johnson',
    age: 12,
    grade: '7th Grade',
    school: 'Lincoln Middle School',
    stats: {
      completedAssessments: 18,
      averageScore: 92,
      studyHours: 45,
    },
    subjects: [
      { name: 'Mathematics', progress: 85 },
      { name: 'Science', progress: 92 },
      { name: 'Language Arts', progress: 88 },
      { name: 'Social Studies', progress: 90 },
    ],
  },
  {
    id: '2',
    name: 'Alex Johnson',
    age: 9,
    grade: '4th Grade',
    school: 'Riverside Elementary',
    stats: {
      completedAssessments: 12,
      averageScore: 87,
      studyHours: 32,
    },
    subjects: [
      { name: 'Mathematics', progress: 78 },
      { name: 'Science', progress: 85 },
      { name: 'Language Arts', progress: 90 },
      { name: 'Art', progress: 95 },
    ],
  },
]);

const isNewChildValid = computed(() => {
  return newChild.value.name && newChild.value.age && newChild.value.grade;
});

// Constants
const MAX_INITIALS = 2;
const PROGRESS_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 80,
  FAIR: 70,
} as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, MAX_INITIALS);
}

function getProgressColor(progress: number): string {
  if (progress >= PROGRESS_THRESHOLDS.EXCELLENT) return 'green';
  if (progress >= PROGRESS_THRESHOLDS.GOOD) return 'blue';
  if (progress >= PROGRESS_THRESHOLDS.FAIR) return 'orange';
  return 'red';
}

function viewChildReports(child: Child): void {
  console.log('Viewing reports for:', child.name);
  // TODO: Navigate to child-specific reports page
}

function viewChildCompetencies(child: Child): void {
  console.log('Viewing competencies for:', child.name);
  // TODO: Navigate to child-specific competencies page
}

function editChild(child: Child): void {
  console.log('Editing child:', child.name);
  // TODO: Open edit dialog with child's current information
}

function viewDetailedProgress(child: Child): void {
  console.log('Viewing detailed progress for:', child.name);
  // TODO: Navigate to detailed progress page
}

function contactTeachers(child: Child): void {
  console.log('Contacting teachers for:', child.name);
  // TODO: Open teacher contact interface
}

function removeChild(child: Child): void {
  console.log('Removing child:', child.name);
  // TODO: Show confirmation dialog and remove child
}

function addChild(): void {
  if (!isNewChildValid.value) return;

  console.log('Adding new child:', newChild.value);
  // TODO: Implement API call to add child

  // Reset form
  newChild.value = {
    name: '',
    age: null,
    grade: '',
    school: '',
    studentId: '',
  };
  showAddChildDialog.value = false;
}
</script>

<style scoped>
.child-card {
  height: 100%;
  transition: transform 0.2s ease-in-out;
}

.child-card:hover {
  transform: translateY(-2px);
}
</style>
