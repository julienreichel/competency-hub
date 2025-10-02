<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg row items-center q-gutter-sm print-title">
      <q-icon name="assessment" class="no-print" />
      <span>{{ $t('reports.title') }}</span>
    </div>

    <q-banner v-if="error" class="bg-negative text-white q-mb-md">
      {{ error }}
    </q-banner>

    <!-- Student Header -->
    <div v-if="reportData?.student" class="q-mb-md">
      <q-card flat bordered>
        <q-card-section horizontal>
          <q-avatar size="64px" class="q-mr-md">
            <img
              v-if="reportData.student.avatar"
              :src="reportData.student.avatar"
              :alt="reportData.student.name"
            />
            <q-icon v-else name="person" size="32px" />
          </q-avatar>
          <div class="column">
            <div class="text-h6">{{ reportData.student.name }}</div>
            <div class="text-body2 text-grey-7">{{ reportData.student.email }}</div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Filters -->
    <report-filters
      v-model:period="reportPeriod"
      v-model:domain-filter="domainFilter"
      v-model:include-details="includeDetails"
      :domain-options="domainOptions"
      class="no-print"
      @generate="handleGenerate"
    />

    <!-- Summary -->
    <report-summary v-if="reportData" :summary="reportData.summary" class="q-mb-lg" />

    <!-- Domain Reports -->
    <div v-if="reportData?.domains.length" class="q-mb-lg">
      <report-domain-card
        v-for="domain in reportData.domains"
        :key="domain.domainId"
        :domain="domain"
        :include-details="includeDetails"
        class="q-mb-md"
      />
    </div>

    <!-- Actions -->
    <report-actions v-if="reportData" :report="reportData" />

    <!-- Empty State -->
    <div v-if="!loading && !reportData" class="text-center q-mt-xl">
      <q-icon name="assessment" size="80px" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">{{ $t('reports.emptyState.title') }}</div>
      <div class="text-body2 text-grey-6">{{ $t('reports.emptyState.subtitle') }}</div>
    </div>

    <q-inner-loading :showing="loading">
      <q-spinner-tail color="primary" size="64px" />
    </q-inner-loading>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import ReportActions from 'src/components/reports/ReportActions.vue';
import ReportDomainCard from 'src/components/reports/ReportDomainCard.vue';
import ReportFilters from 'src/components/reports/ReportFilters.vue';
import ReportSummary from 'src/components/reports/ReportSummary.vue';
import { useReportData } from 'src/composables/useReportData';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const { t } = useI18n();
const $q = useQuasar();
const route = useRoute();
const { loading, error, reportData, generateReport } = useReportData();

// Time constants for report period calculation
const DAYS_IN_DEFAULT_PERIOD = 30;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;

// Filters
const reportPeriod = ref({
  startDate: new Date(
    Date.now() -
      DAYS_IN_DEFAULT_PERIOD *
        HOURS_PER_DAY *
        MINUTES_PER_HOUR *
        SECONDS_PER_MINUTE *
        MILLISECONDS_PER_SECOND,
  ), // 30 days ago
  endDate: new Date(),
});
const domainFilter = ref<string | null>(null);
const includeDetails = ref(true);

const domainOptions = computed(() => {
  if (!reportData.value) return [];

  const domains = new Set<string>();
  reportData.value.domains.forEach((domain) => {
    domains.add(domain.domainName);
  });

  return Array.from(domains).map((domain) => ({
    label: domain,
    value: domain,
  }));
});

async function handleGenerate(): Promise<void> {
  const studentId = route.params.studentId as string;
  if (!studentId) {
    $q.notify({
      type: 'negative',
      message: t('reports.errors.noStudentId'),
    });
    return;
  }

  const result = await generateReport(studentId, reportPeriod.value, {
    domainFilter: domainFilter.value,
    includeDetails: includeDetails.value,
  });

  if (result) {
    $q.notify({
      type: 'positive',
      message: t('reports.messages.generated'),
    });
  }
}

onMounted(() => {
  void handleGenerate();
});
</script>

<style scoped>
@media print {
  .q-page {
    padding: 1rem !important;
    margin: 0 !important;
  }

  .no-print {
    display: none !important;
  }

  .print-title {
    text-align: center !important;
    justify-content: center !important;
    margin-bottom: 2rem !important;
  }

  /* Ensure proper page breaks */
  .q-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Remove unnecessary spacing for print */
  .q-mb-lg {
    margin-bottom: 1rem !important;
  }

  .q-mb-md {
    margin-bottom: 0.5rem !important;
  }
}
</style>
