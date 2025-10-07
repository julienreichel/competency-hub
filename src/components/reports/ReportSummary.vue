<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-h6 q-mb-md">{{ $t('reports.summary.title') }}</div>

      <div class="row q-col-gutter-md">
        <!-- Summary Stats -->
        <div class="col-6 col-sm-3">
          <dashboard-stat-card
            :title="$t('reports.summary.domainsCovered')"
            :value="summary.totalDomainsCovered"
            icon="folder"
            icon-color="primary"
          />
        </div>

        <div class="col-6 col-sm-3">
          <dashboard-stat-card
            :title="$t('reports.summary.competenciesAdvanced')"
            :value="summary.competenciesAdvanced"
            icon="trending_up"
            icon-color="positive"
          />
        </div>

        <div class="col-6 col-sm-3">
          <dashboard-stat-card
            :title="$t('reports.summary.competenciesAcquired')"
            :value="summary.competenciesAcquired"
            icon="check_circle"
            icon-color="positive"
          />
        </div>

        <div class="col-6 col-sm-3">
          <dashboard-stat-card
            :title="$t('reports.summary.totalActivity')"
            :value="summary.totalActivity"
            icon="psychology"
            icon-color="info"
          />
        </div>
      </div>

      <!-- Period Info -->
      <div class="q-mt-md text-body2 text-grey-7">
        {{
          $t('reports.summary.periodInfo', {
            start: formatDate(summary.periodStartDate),
            end: formatDate(summary.periodEndDate),
          })
        }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import DashboardStatCard from 'src/components/dashboard/DashboardStatCard.vue';
import { useI18n } from 'vue-i18n';

interface ReportSummary {
  totalDomainsCovered: number;
  competenciesAdvanced: number;
  competenciesAcquired: number;
  totalActivity: number;
  periodStartDate: Date;
  periodEndDate: Date;
}

defineProps<{
  summary: ReportSummary;
}>();

const { d } = useI18n();

function formatDate(date: Date): string {
  return d(date, 'short');
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({ name: 'ReportSummary' });
</script>

<style scoped>
@media print {
  .q-card {
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 1rem !important;
  }

  .stat-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .text-h6 {
    font-size: 14pt !important;
    font-weight: bold !important;
  }

  .text-body2 {
    font-size: 11pt !important;
  }
}
</style>
