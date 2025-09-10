<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg">
      <q-icon name="school" class="q-mr-sm" />
      My Classes
    </div>

    <!-- Class Search and Filters -->
    <div class="row q-gutter-md q-mb-lg">
      <div class="col-12 col-md-6">
        <q-input v-model="searchQuery" filled placeholder="Search classes..." debounce="300">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-3">
        <q-select v-model="statusFilter" filled :options="statusOptions" label="Status" clearable />
      </div>
      <div class="col-12 col-md-3">
        <q-select
          v-model="subjectFilter"
          filled
          :options="subjectOptions"
          label="Subject"
          clearable
        />
      </div>
    </div>

    <!-- Classes Grid -->
    <div class="row q-gutter-lg">
      <div
        v-for="classItem in filteredClasses"
        :key="classItem.id"
        class="col-12 col-md-6 col-lg-4"
      >
        <q-card class="class-card cursor-pointer" @click="openClass(classItem)">
          <q-card-section>
            <div class="row items-center">
              <div class="col">
                <div class="text-h6">{{ classItem.name }}</div>
                <div class="text-subtitle2 text-grey-6">{{ classItem.subject }}</div>
              </div>
              <div class="col-auto">
                <q-chip :color="getStatusColor(classItem.status)" text-color="white" size="sm">
                  {{ classItem.status }}
                </q-chip>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <div class="text-body2">{{ classItem.description }}</div>
          </q-card-section>

          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-icon name="person" size="sm" />
              <span class="text-caption">{{ classItem.instructor }}</span>
              <q-space />
              <q-icon name="schedule" size="sm" />
              <span class="text-caption">{{ classItem.schedule }}</span>
            </div>
          </q-card-section>

          <q-card-section>
            <q-linear-progress :value="classItem.progress / 100" color="primary" class="q-mb-xs" />
            <div class="text-caption text-right">{{ classItem.progress }}% Complete</div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              color="primary"
              :label="getActionLabel(classItem.status)"
              @click.stop="handleClassAction(classItem)"
            />
            <q-btn flat icon="more_vert">
              <q-menu>
                <q-list>
                  <q-item clickable @click="viewDetails(classItem)">
                    <q-item-section>View Details</q-item-section>
                  </q-item>
                  <q-item clickable @click="viewGrades(classItem)">
                    <q-item-section>View Grades</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable @click="dropClass(classItem)">
                    <q-item-section>Drop Class</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredClasses.length === 0" class="text-center q-mt-xl">
      <q-icon name="school" size="4em" color="grey-5" />
      <div class="text-h6 q-mt-md text-grey-6">No classes found</div>
      <div class="text-body2 text-grey-5">
        Try adjusting your search filters or enroll in new classes.
      </div>
      <q-btn
        color="primary"
        label="Browse Available Classes"
        class="q-mt-md"
        @click="browseClasses"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface Class {
  id: string;
  name: string;
  subject: string;
  description: string;
  instructor: string;
  schedule: string;
  status: 'Active' | 'Completed' | 'Upcoming' | 'Dropped';
  progress: number;
}

const searchQuery = ref('');
const statusFilter = ref<string | null>(null);
const subjectFilter = ref<string | null>(null);

const statusOptions = ['Active', 'Completed', 'Upcoming', 'Dropped'];
const subjectOptions = [
  'Mathematics',
  'Science',
  'Language Arts',
  'Social Studies',
  'Art',
  'Music',
];

// Mock data - replace with actual API call
const classes = ref<Class[]>([
  {
    id: '1',
    name: 'Advanced Mathematics',
    subject: 'Mathematics',
    description: 'Advanced topics in algebra and calculus',
    instructor: 'Dr. Smith',
    schedule: 'MWF 10:00-11:00',
    status: 'Active',
    progress: 75,
  },
  {
    id: '2',
    name: 'Biology Fundamentals',
    subject: 'Science',
    description: 'Introduction to biological sciences',
    instructor: 'Prof. Johnson',
    schedule: 'TTh 2:00-3:30',
    status: 'Active',
    progress: 60,
  },
  {
    id: '3',
    name: 'Creative Writing',
    subject: 'Language Arts',
    description: 'Develop your creative writing skills',
    instructor: 'Ms. Davis',
    schedule: 'MWF 1:00-2:00',
    status: 'Completed',
    progress: 100,
  },
]);

const filteredClasses = computed(() => {
  return classes.value.filter((classItem) => {
    const matchesSearch =
      !searchQuery.value ||
      classItem.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      classItem.subject.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      classItem.instructor.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesStatus = !statusFilter.value || classItem.status === statusFilter.value;
    const matchesSubject = !subjectFilter.value || classItem.subject === subjectFilter.value;

    return matchesSearch && matchesStatus && matchesSubject;
  });
});

function getStatusColor(status: string): string {
  switch (status) {
    case 'Active':
      return 'green';
    case 'Completed':
      return 'blue';
    case 'Upcoming':
      return 'orange';
    case 'Dropped':
      return 'red';
    default:
      return 'grey';
  }
}

function getActionLabel(status: string): string {
  switch (status) {
    case 'Active':
      return 'Continue';
    case 'Completed':
      return 'Review';
    case 'Upcoming':
      return 'Preview';
    case 'Dropped':
      return 'Re-enroll';
    default:
      return 'View';
  }
}

function openClass(classItem: Class): void {
  console.log('Opening class:', classItem.name);
  // TODO: Navigate to class details or learning materials
}

function handleClassAction(classItem: Class): void {
  console.log('Class action for:', classItem.name, 'Status:', classItem.status);
  // TODO: Handle different actions based on status
}

function viewDetails(classItem: Class): void {
  console.log('Viewing details for:', classItem.name);
  // TODO: Show class details modal or navigate to details page
}

function viewGrades(classItem: Class): void {
  console.log('Viewing grades for:', classItem.name);
  // TODO: Navigate to grades page for this class
}

function dropClass(classItem: Class): void {
  console.log('Dropping class:', classItem.name);
  // TODO: Implement class drop functionality with confirmation
}

function browseClasses(): void {
  console.log('Browsing available classes');
  // TODO: Navigate to class catalog or enrollment page
}
</script>

<style scoped>
.class-card {
  transition: transform 0.2s ease-in-out;
}

.class-card:hover {
  transform: translateY(-2px);
}
</style>
