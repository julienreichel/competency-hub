<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg">
      <q-icon name="analytics" class="q-mr-sm" />
      {{ t('reportsPage.title') }}
    </div>

    <!-- Report Filters -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">{{ t('reportsPage.filters.title') }}</div>
        <div class="row q-gutter-md">
          <div class="col-12 col-md-3">
            <q-select
              v-model="selectedReportType"
              outlined
              :options="reportTypes"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              :label="t('reportsPage.filters.reportType')"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="selectedTimeRange"
              outlined
              :options="timeRanges"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              :label="t('reportsPage.filters.timeRange')"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="selectedSubject"
              outlined
              :options="subjects"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              :label="t('reportsPage.filters.subject')"
              clearable
            />
          </div>
          <div class="col-12 col-md-3">
            <q-btn
              color="primary"
              icon="refresh"
              :label="t('reportsPage.actions.update')"
              @click="updateReport"
            />
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
            <div class="text-subtitle2">{{ t('reportsPage.summary.completedAssessments') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section class="text-center">
            <q-icon name="trending_up" size="3em" color="blue" />
            <div class="text-h4 q-mt-sm">{{ summaryStats.averageScore }}%</div>
            <div class="text-subtitle2">{{ t('reportsPage.summary.averageScore') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section class="text-center">
            <q-icon name="school" size="3em" color="purple" />
            <div class="text-h4 q-mt-sm">{{ summaryStats.competenciesMastered }}</div>
            <div class="text-subtitle2">{{ t('reportsPage.summary.competenciesMastered') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card>
          <q-card-section class="text-center">
            <q-icon name="schedule" size="3em" color="orange" />
            <div class="text-h4 q-mt-sm">{{ summaryStats.studyTimeHours }}h</div>
            <div class="text-subtitle2">{{ t('reportsPage.summary.studyTime') }}</div>
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
            <div class="text-h6 q-mb-md">{{ t('reportsPage.charts.progressOverTime') }}</div>
            <div class="chart-placeholder">
              <q-icon name="show_chart" size="4em" color="grey-5" />
              <div class="text-body2 text-grey-6 q-mt-sm">
                {{ t('reportsPage.charts.placeholderPrimary') }}
              </div>
              <div class="text-caption text-grey-5">
                {{ t('reportsPage.charts.placeholderSecondary') }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Subject Performance -->
      <div class="col-12 col-lg-4">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">{{ t('reportsPage.charts.subjectPerformance') }}</div>
            <q-list>
              <q-item v-for="subject in subjectPerformance" :key="subject.name">
                <q-item-section>
                  <q-item-label>{{ subjectLabel(subject.name) }}</q-item-label>
                  <q-item-label caption>{{
                    t('reportsPage.subjectAverage', { score: subject.score })
                  }}</q-item-label>
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
        <div class="text-h6 q-mb-md">{{ t('reportsPage.table.title') }}</div>
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
              {{ statusLabel(props.value) }}
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
          :label="t('reportsPage.actions.exportPdf')"
          @click="exportReport('pdf')"
        />
        <q-btn
          outline
          color="primary"
          icon="file_download"
          :label="t('reportsPage.actions.exportCsv')"
          @click="exportReport('csv')"
        />
        <q-btn
          outline
          color="primary"
          icon="share"
          :label="t('reportsPage.actions.share')"
          @click="shareReport"
        />
      </q-btn-group>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface ReportData {
  id: string;
  assessment: string;
  subject: string;
  date: string;
  score: number;
  status: 'Completed' | 'In Progress' | 'Not Started';
  timeSpent: number;
}

const { t } = useI18n();

const selectedReportType = ref('progress');
const selectedTimeRange = ref('last_month');
const selectedSubject = ref<string | null>(null);

const REPORT_TYPE_VALUES = ['progress', 'assessments', 'competencies', 'time'] as const;
const TIME_RANGE_VALUES = ['last_week', 'last_month', 'last_quarter', 'last_year'] as const;
const SUBJECT_VALUES = [
  'Mathematics',
  'Science',
  'Language Arts',
  'Social Studies',
  'Art',
  'Music',
] as const;

const reportTypes = computed(() =>
  REPORT_TYPE_VALUES.map((value) => ({
    value,
    label: t(`reportsPage.reportTypes.${value}`),
  })),
);

const timeRanges = computed(() =>
  TIME_RANGE_VALUES.map((value) => ({
    value,
    label: t(`reportsPage.timeRanges.${value}`),
  })),
);

const SUBJECT_LABEL_KEYS: Record<(typeof SUBJECT_VALUES)[number], string> = {
  Mathematics: 'mathematics',
  Science: 'science',
  'Language Arts': 'languageArts',
  'Social Studies': 'socialStudies',
  Art: 'art',
  Music: 'music',
};

const subjects = computed(() =>
  SUBJECT_VALUES.map((value) => ({
    value,
    label: t(`reportsPage.subjects.${SUBJECT_LABEL_KEYS[value]}`),
  })),
);

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

const STATUS_LABEL_KEYS: Record<ReportData['status'], string> = {
  Completed: 'completed',
  'In Progress': 'inProgress',
  'Not Started': 'notStarted',
};

const tableColumns = computed(() => [
  {
    name: 'assessment',
    label: t('reportsPage.table.columns.assessment'),
    field: 'assessment',
    align: 'left' as const,
  },
  {
    name: 'subject',
    label: t('reportsPage.table.columns.subject'),
    field: 'subject',
    align: 'left' as const,
  },
  {
    name: 'date',
    label: t('reportsPage.table.columns.date'),
    field: 'date',
    align: 'left' as const,
  },
  {
    name: 'score',
    label: t('reportsPage.table.columns.score'),
    field: 'score',
    align: 'center' as const,
  },
  {
    name: 'status',
    label: t('reportsPage.table.columns.status'),
    field: 'status',
    align: 'center' as const,
  },
  {
    name: 'timeSpent',
    label: t('reportsPage.table.columns.timeSpent'),
    field: 'timeSpent',
    align: 'center' as const,
  },
]);

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

const statusLabel = (status: ReportData['status']): string =>
  t(`reportsPage.statusLabels.${STATUS_LABEL_KEYS[status]}`);

const subjectLabel = (subject: string): string => {
  const key = SUBJECT_LABEL_KEYS[subject as keyof typeof SUBJECT_LABEL_KEYS];
  return key ? t(`reportsPage.subjects.${key}`) : subject;
};

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
