<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg">
      <q-icon name="assignment" class="q-mr-sm" />
      Assessment Management
    </div>

    <!-- Action Bar -->
    <div class="row justify-between items-center q-mb-lg">
      <div class="row q-gutter-md">
        <q-input
          v-model="searchQuery"
          filled
          placeholder="Search assessments..."
          debounce="300"
          style="width: 300px"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-select
          v-model="statusFilter"
          filled
          :options="statusOptions"
          label="Status"
          clearable
          style="width: 150px"
        />
        <q-select
          v-model="subjectFilter"
          filled
          :options="subjectOptions"
          label="Subject"
          clearable
          style="width: 150px"
        />
      </div>
      <q-btn color="primary" icon="add" label="Create Assessment" @click="createAssessment" />
    </div>

    <!-- Assessments Table -->
    <q-table
      :rows="filteredAssessments"
      :columns="columns"
      row-key="id"
      :pagination="{ rowsPerPage: 10 }"
      flat
      bordered
    >
      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-chip :color="getStatusColor(props.value)" text-color="white" size="sm">
            {{ props.value }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-students="props">
        <q-td :props="props">
          <div class="text-center">
            {{ props.row.submissions }} / {{ props.row.totalStudents }}
            <q-tooltip
              >{{ props.row.submissions }} submissions out of
              {{ props.row.totalStudents }} students</q-tooltip
            >
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn-group flat>
            <q-btn flat icon="visibility" size="sm" @click="viewAssessment(props.row)">
              <q-tooltip>View Assessment</q-tooltip>
            </q-btn>
            <q-btn flat icon="edit" size="sm" @click="editAssessment(props.row)">
              <q-tooltip>Edit Assessment</q-tooltip>
            </q-btn>
            <q-btn flat icon="analytics" size="sm" @click="viewResults(props.row)">
              <q-tooltip>View Results</q-tooltip>
            </q-btn>
            <q-btn flat icon="more_vert" size="sm">
              <q-menu>
                <q-list>
                  <q-item clickable @click="duplicateAssessment(props.row)">
                    <q-item-section>Duplicate</q-item-section>
                  </q-item>
                  <q-item clickable @click="shareAssessment(props.row)">
                    <q-item-section>Share</q-item-section>
                  </q-item>
                  <q-item clickable @click="exportResults(props.row)">
                    <q-item-section>Export Results</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable @click="deleteAssessment(props.row)">
                    <q-item-section>Delete</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-btn-group>
        </q-td>
      </template>
    </q-table>

    <!-- Quick Stats Cards -->
    <div class="row q-gutter-md q-mt-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section class="text-center">
            <q-icon name="assignment" size="2em" color="blue" />
            <div class="text-h5 q-mt-sm">{{ stats.totalAssessments }}</div>
            <div class="text-subtitle2">Total Assessments</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section class="text-center">
            <q-icon name="pending" size="2em" color="orange" />
            <div class="text-h5 q-mt-sm">{{ stats.activeAssessments }}</div>
            <div class="text-subtitle2">Active Assessments</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section class="text-center">
            <q-icon name="groups" size="2em" color="green" />
            <div class="text-h5 q-mt-sm">{{ stats.totalSubmissions }}</div>
            <div class="text-subtitle2">Total Submissions</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section class="text-center">
            <q-icon name="trending_up" size="2em" color="purple" />
            <div class="text-h5 q-mt-sm">{{ stats.averageScore }}%</div>
            <div class="text-subtitle2">Average Score</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface Assessment {
  id: string;
  title: string;
  subject: string;
  type: string;
  status: 'Draft' | 'Active' | 'Completed' | 'Archived';
  dueDate: string;
  submissions: number;
  totalStudents: number;
  averageScore?: number;
  createdDate: string;
}

const searchQuery = ref('');
const statusFilter = ref<string | null>(null);
const subjectFilter = ref<string | null>(null);

const statusOptions = ['Draft', 'Active', 'Completed', 'Archived'];
const subjectOptions = [
  'Mathematics',
  'Science',
  'Language Arts',
  'Social Studies',
  'Art',
  'Music',
];

const columns = [
  {
    name: 'title',
    label: 'Assessment Title',
    field: 'title',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'subject',
    label: 'Subject',
    field: 'subject',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'type',
    label: 'Type',
    field: 'type',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'dueDate',
    label: 'Due Date',
    field: 'dueDate',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'students',
    label: 'Submissions',
    field: 'students',
    align: 'center' as const,
  },
  {
    name: 'averageScore',
    label: 'Avg Score',
    field: 'averageScore',
    align: 'center' as const,
    format: (val: number | undefined): string => (val ? `${val}%` : 'N/A'),
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'center' as const,
  },
];

// Mock data - replace with actual API call
const assessments = ref<Assessment[]>([
  {
    id: '1',
    title: 'Algebra Fundamentals Quiz',
    subject: 'Mathematics',
    type: 'Quiz',
    status: 'Active',
    dueDate: '2024-02-15',
    submissions: 18,
    totalStudents: 25,
    averageScore: 87,
    createdDate: '2024-01-20',
  },
  {
    id: '2',
    title: 'Cell Biology Test',
    subject: 'Science',
    type: 'Test',
    status: 'Active',
    dueDate: '2024-02-20',
    submissions: 12,
    totalStudents: 25,
    averageScore: 92,
    createdDate: '2024-01-25',
  },
  {
    id: '3',
    title: 'Essay Writing Assignment',
    subject: 'Language Arts',
    type: 'Assignment',
    status: 'Draft',
    dueDate: '2024-02-25',
    submissions: 0,
    totalStudents: 25,
    createdDate: '2024-01-30',
  },
  {
    id: '4',
    title: 'History Timeline Project',
    subject: 'Social Studies',
    type: 'Project',
    status: 'Completed',
    dueDate: '2024-01-31',
    submissions: 25,
    totalStudents: 25,
    averageScore: 85,
    createdDate: '2024-01-15',
  },
]);

const stats = ref({
  totalAssessments: 24,
  activeAssessments: 8,
  totalSubmissions: 156,
  averageScore: 88,
});

const filteredAssessments = computed(() => {
  return assessments.value.filter((assessment) => {
    const matchesSearch =
      !searchQuery.value ||
      assessment.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      assessment.subject.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesStatus = !statusFilter.value || assessment.status === statusFilter.value;
    const matchesSubject = !subjectFilter.value || assessment.subject === subjectFilter.value;

    return matchesSearch && matchesStatus && matchesSubject;
  });
});

function getStatusColor(status: string): string {
  switch (status) {
    case 'Active':
      return 'green';
    case 'Draft':
      return 'grey';
    case 'Completed':
      return 'blue';
    case 'Archived':
      return 'orange';
    default:
      return 'grey';
  }
}

function createAssessment(): void {
  console.log('Creating new assessment');
  // TODO: Navigate to assessment creation page
}

function viewAssessment(assessment: Assessment): void {
  console.log('Viewing assessment:', assessment.title);
  // TODO: Navigate to assessment view page
}

function editAssessment(assessment: Assessment): void {
  console.log('Editing assessment:', assessment.title);
  // TODO: Navigate to assessment edit page
}

function viewResults(assessment: Assessment): void {
  console.log('Viewing results for:', assessment.title);
  // TODO: Navigate to results analysis page
}

function duplicateAssessment(assessment: Assessment): void {
  console.log('Duplicating assessment:', assessment.title);
  // TODO: Implement duplication logic
}

function shareAssessment(assessment: Assessment): void {
  console.log('Sharing assessment:', assessment.title);
  // TODO: Implement sharing functionality
}

function exportResults(assessment: Assessment): void {
  console.log('Exporting results for:', assessment.title);
  // TODO: Implement export functionality
}

function deleteAssessment(assessment: Assessment): void {
  console.log('Deleting assessment:', assessment.title);
  // TODO: Show confirmation dialog and delete
}
</script>
