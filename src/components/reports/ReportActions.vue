<template>
  <q-card flat bordered class="no-print">
    <q-card-section>
      <div class="text-h6 q-mb-md">{{ $t('reports.actions.title') }}</div>

      <div class="row q-gutter-md">
        <q-btn
          color="primary"
          icon="print"
          :label="$t('reports.actions.print')"
          @click="handlePrint"
        />

        <q-btn
          color="secondary"
          icon="file_download"
          :label="$t('reports.actions.exportPdf')"
          @click="handleExportPdf"
        />

        <q-btn
          flat
          color="grey-7"
          icon="refresh"
          :label="$t('reports.actions.regenerate')"
          @click="$emit('regenerate')"
        />
      </div>

      <!-- Report Info -->
      <q-separator class="q-my-md" />

      <div class="text-body2 text-grey-7">
        <div>
          {{
            $t('reports.info.generatedAt', {
              time: formatDateTime(report.generatedAt),
            })
          }}
        </div>
        <div v-if="report.generatedBy">
          {{
            $t('reports.info.generatedBy', {
              name: report.generatedBy.name,
            })
          }}
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import type { User } from 'src/models/User';
import { useI18n } from 'vue-i18n';

interface ReportPeriod {
  startDate: Date;
  endDate: Date;
}

interface ReportSummary {
  totalDomainsCovered: number;
  competenciesAdvanced: number;
  competenciesAcquired: number;
  totalActivity: number;
  periodStartDate: Date;
  periodEndDate: Date;
}

interface DomainProgress {
  domainId: string;
  domainName: string;
  domainColor?: string | null;
  competencies: unknown[];
  overallProgress: number;
  progressDelta: number;
  itemsChanged: number;
}

interface ReportData {
  student: User;
  period: ReportPeriod;
  summary: ReportSummary;
  domains: DomainProgress[];
  generatedAt: Date;
  generatedBy: User | null;
}

defineProps<{
  report: ReportData;
}>();

const { t, d } = useI18n();
const $q = useQuasar();

function handlePrint(): void {
  window.print();
}

function handleExportPdf(): void {
  // For now, just trigger print dialog
  // In a real implementation, you might use a library like jsPDF or html2pdf
  $q.notify({
    type: 'info',
    message: t('reports.actions.pdfExportInfo'),
  });
  window.print();
}

function formatDateTime(date: Date): string {
  return d(date, 'long');
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({ name: 'ReportActions' });
</script>
