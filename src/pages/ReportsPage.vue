<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg">
      <q-icon name="analytics" class="q-mr-sm" />
      Reports & Analytics
    </div>

    <!-- Report Filters -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">Report Filters</div>
        <div class="row q-gutter-md">
          <div class="col-12 col-md-3">
            <q-select
              v-model="selectedReportType"
              outlined
              :options="reportTypes"
              label="Report Type"
              emit-value
              map-options
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="selectedTimeRange"
              outlined
              :options="timeRanges"
              label="Time Range"
              emit-value
              map-options
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="selectedSubject"
              outlined
              :options="subjects"
              label="Subject"
              clearable
            />
          </div>
          <div class="col-12 col-md-3">
            <q-btn color="primary" icon="refresh" label="Update Report" @click="updateReport" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Summary Cards -->
    <div class="row q-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section class="text-center">
            <q-icon name="assignment_turned_in" size="3em" color="green" />
            <div class="text-h4 q-mt-sm">{{ summaryStats.completedAssessments }}</div>
            <div class="text-subtitle2">Completed Assessments</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section class="text-center">
            <q-icon name="trending_up" size="3em" color="blue" />
            <div class="text-h4 q-mt-sm">{{ summaryStats.averageScore }}%</div>
            <div class="text-subtitle2">Average Score</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section class="text-center">
            <q-icon name="school" size="3em" color="purple" />
            <div class="text-h4 q-mt-sm">{{ summaryStats.competenciesMastered }}</div>
            <div class="text-subtitle2">Competencies Mastered</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section class="text-center">
            <q-icon name="schedule" size="3em" color="orange" />
            <div class="text-h4 q-mt-sm">{{ summaryStats.studyTimeHours }}h</div>
            <div class="text-subtitle2">Study Time</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="row q-gutter-lg">
      <!-- Progress Over Time Chart -->
      <div class="col-12 col-lg-8">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Progress Over Time</div>
            <div class="chart-placeholder">
              <q-icon name="show_chart" size="4em" color="grey-5" />
              <div class="text-body2 text-grey-6 q-mt-sm">Chart will be displayed here</div>
              <div class="text-caption text-grey-5">
                Progress tracking chart showing performance trends
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Subject Performance -->
      <div class="col-12 col-lg-4">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Subject Performance</div>
            <q-list>
              <q-item v-for="subject in subjectPerformance" :key="subject.name">
                <q-item-section>
                  <q-item-label>{{ subject.name }}</q-item-label>
                  <q-item-label caption>{{ subject.score }}% average</q-item-label>
                  <q-linear-progress
                    :value="subject.score / 100"
                    :color="getPerformanceColor(subject.score)"
                    class="q-mt-xs"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Detailed Reports Table -->
    <q-card class="q-mt-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">Detailed Report Data</div>
        <q-table
          :rows="reportData"
          :columns="tableColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
          flat
          bordered
        >
          <template v-slot:body-cell-score="props">
            <q-td :props="props">
              <q-chip :color="getScoreColor(props.value)" text-color="white" size="sm">
                {{ props.value }}%
              </q-chip>
            </q-td>
          </template>
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-icon
                :name="getStatusIcon(props.value)"
                :color="getStatusColor(props.value)"
                size="sm"
              />
              {{ props.value }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Export Options -->
    <div class="text-center q-mt-lg">
      <q-btn-group>
        <q-btn
          outline
          color="primary"
          icon="file_download"
          label="Export PDF"
          @click="exportReport('pdf')"
        />
        <q-btn
          outline
          color="primary"
          icon="file_download"
          label="Export CSV"
          @click="exportReport('csv')"
        />
        <q-btn outline color="primary" icon="share" label="Share Report" @click="shareReport" />
      </q-btn-group>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface ReportData {
  id: string;
  assessment: string;
  subject: string;
  date: string;
  score: number;
  status: 'Completed' | 'In Progress' | 'Not Started';
  timeSpent: number;
}

const selectedReportType = ref('progress');
const selectedTimeRange = ref('last_month');
const selectedSubject = ref<string | null>(null);

const reportTypes = [
  { label: 'Progress Report', value: 'progress' },
  { label: 'Assessment Results', value: 'assessments' },
  { label: 'Competency Mastery', value: 'competencies' },
  { label: 'Time Analytics', value: 'time' },
];

const timeRanges = [
  { label: 'Last Week', value: 'last_week' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Last Quarter', value: 'last_quarter' },
  { label: 'Last Year', value: 'last_year' },
];

const subjects = ['Mathematics', 'Science', 'Language Arts', 'Social Studies', 'Art', 'Music'];

const summaryStats = ref({
  completedAssessments: 24,
  averageScore: 87,
  competenciesMastered: 12,
  studyTimeHours: 156,
});

const subjectPerformance = ref([
  { name: 'Mathematics', score: 92 },
  { name: 'Science', score: 88 },
  { name: 'Language Arts', score: 85 },
  { name: 'Social Studies', score: 90 },
]);

const tableColumns = [
  { name: 'assessment', label: 'Assessment', field: 'assessment', align: 'left' as const },
  { name: 'subject', label: 'Subject', field: 'subject', align: 'left' as const },
  { name: 'date', label: 'Date', field: 'date', align: 'left' as const },
  { name: 'score', label: 'Score', field: 'score', align: 'center' as const },
  { name: 'status', label: 'Status', field: 'status', align: 'center' as const },
  { name: 'timeSpent', label: 'Time (min)', field: 'timeSpent', align: 'center' as const },
];

const reportData = ref<ReportData[]>([
  {
    id: '1',
    assessment: 'Algebra Fundamentals',
    subject: 'Mathematics',
    date: '2024-01-15',
    score: 94,
    status: 'Completed',
    timeSpent: 45,
  },
  {
    id: '2',
    assessment: 'Cell Biology Quiz',
    subject: 'Science',
    date: '2024-01-14',
    score: 88,
    status: 'Completed',
    timeSpent: 30,
  },
  {
    id: '3',
    assessment: 'Essay Writing',
    subject: 'Language Arts',
    date: '2024-01-13',
    score: 76,
    status: 'Completed',
    timeSpent: 60,
  },
]);

// Constants
const SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 80,
  FAIR: 70,
} as const;

function getPerformanceColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'green';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'blue';
  if (score >= SCORE_THRESHOLDS.FAIR) return 'orange';
  return 'red';
}

function getScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'green';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'blue';
  if (score >= SCORE_THRESHOLDS.FAIR) return 'orange';
  return 'red';
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'Completed':
      return 'check_circle';
    case 'In Progress':
      return 'hourglass_empty';
    case 'Not Started':
      return 'radio_button_unchecked';
    default:
      return 'help';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Completed':
      return 'green';
    case 'In Progress':
      return 'orange';
    case 'Not Started':
      return 'grey';
    default:
      return 'grey';
  }
}

function updateReport(): void {
  console.log('Updating report with filters:', {
    type: selectedReportType.value,
    timeRange: selectedTimeRange.value,
    subject: selectedSubject.value,
  });
  // TODO: Fetch updated report data based on filters
}

function exportReport(format: 'pdf' | 'csv'): void {
  console.log(`Exporting report as ${format.toUpperCase()}`);
  // TODO: Implement export functionality
}

function shareReport(): void {
  console.log('Sharing report');
  // TODO: Implement share functionality
}
</script>

<style scoped>
.chart-placeholder {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 8px;
}
</style>
