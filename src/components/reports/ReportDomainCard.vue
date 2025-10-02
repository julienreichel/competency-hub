<template>
  <q-expansion-item
    :icon="domainIcon"
    :label="domain.domainName"
    :caption="domainCaption"
    :header-style="headerStyle"
    expand-separator
  >
    <template #header>
      <q-item-section avatar>
        <q-icon :name="domainIcon" :color="iconColor" />
      </q-item-section>

      <q-item-section>
        <q-item-label class="text-weight-medium">{{ domain.domainName }}</q-item-label>
        <q-item-label caption>{{ domainCaption }}</q-item-label>
      </q-item-section>

      <q-item-section side>
        <div class="text-right">
          <div class="text-h6">{{ Math.round(domain.overallProgress) }}%</div>
          <div class="text-caption" :class="progressDeltaClass">
            {{ progressDeltaText }}
          </div>
        </div>
      </q-item-section>
    </template>

    <q-card flat>
      <q-card-section v-if="includeDetails">
        <!-- Competency Table -->
        <q-table
          :rows="competencyRows"
          :columns="tableColumns"
          flat
          hide-pagination
          :rows-per-page-options="[0]"
          class="competency-table"
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip
                :label="$t(`progressStatus.${props.value}`)"
                :color="getStatusColor(props.value)"
                text-color="white"
                size="sm"
              />
            </q-td>
          </template>

          <template #body-cell-progress="props">
            <q-td :props="props">
              <div class="progress-cell">
                <q-linear-progress
                  :value="props.value / 100"
                  :color="getProgressColor(props.value)"
                  size="8px"
                  class="q-mb-xs"
                />
                <div class="text-caption">{{ Math.round(props.value) }}%</div>
              </div>
            </q-td>
          </template>

          <template #body-cell-delta="props">
            <q-td :props="props">
              <div :class="getDeltaClass(props.value)">
                {{ props.value > 0 ? '+' : '' }}{{ Math.round(props.value) }}%
              </div>
            </q-td>
          </template>

          <template #body-cell-lastEvidence="props">
            <q-td :props="props">
              <div v-if="props.value" class="text-caption">
                {{ formatDate(props.value) }}
              </div>
              <div v-else class="text-caption text-grey">
                {{ $t('reports.noEvidence') }}
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface SubCompetencyProgress {
  subCompetency: {
    id: string;
    name: string;
    competency?: {
      name: string;
    } | null;
  };
  currentStatus: string;
  currentPercentage: number;
  progressDelta: number;
  lastEvidenceDate?: Date | null;
  newlyAcquired: boolean;
  hasActivity: boolean;
}

interface CompetencyProgress {
  competencyId: string;
  competencyName: string;
  subCompetencies: SubCompetencyProgress[];
  progressDelta: number;
  completionPercentage: number;
}

interface DomainProgress {
  domainId: string;
  domainName: string;
  domainColor?: string | null;
  competencies: CompetencyProgress[];
  overallProgress: number;
  progressDelta: number;
  itemsChanged: number;
}

const props = defineProps<{
  domain: DomainProgress;
  includeDetails: boolean;
}>();

const { t, d } = useI18n();

const domainIcon = computed(() => 'folder');

const iconColor = computed(() => {
  if (props.domain.domainColor) {
    return props.domain.domainColor;
  }
  return 'primary';
});

const headerStyle = computed(() => {
  if (props.domain.domainColor) {
    return { borderLeft: `4px solid ${props.domain.domainColor}` };
  }
  return {};
});

const domainCaption = computed(() => {
  const count = props.domain.competencies.length;
  return t('reports.domain.competenciesCount', { count });
});

const progressDeltaText = computed(() => {
  const delta = props.domain.progressDelta;
  if (Math.abs(delta) < 1) {
    return t('reports.noChange');
  }
  return `${delta > 0 ? '+' : ''}${Math.round(delta)}%`;
});

const progressDeltaClass = computed(() => {
  const delta = props.domain.progressDelta;
  if (delta > 0) return 'text-positive';
  if (delta < 0) return 'text-negative';
  return 'text-grey';
});

const tableColumns = computed(() => [
  {
    name: 'competency',
    label: t('reports.table.competency'),
    field: 'competencyName',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'subCompetency',
    label: t('reports.table.subCompetency'),
    field: 'subCompetencyName',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'status',
    label: t('reports.table.status'),
    field: 'status',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'progress',
    label: t('reports.table.progress'),
    field: 'progress',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'delta',
    label: t('reports.table.change'),
    field: 'delta',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'lastEvidence',
    label: t('reports.table.lastEvidence'),
    field: 'lastEvidence',
    align: 'center' as const,
    sortable: true,
  },
]);

const competencyRows = computed(() => {
  const rows: Array<{
    competencyName: string;
    subCompetencyName: string;
    status: string;
    progress: number;
    delta: number;
    lastEvidence: Date | null;
    newlyAcquired: boolean;
  }> = [];

  props.domain.competencies.forEach((competency) => {
    competency.subCompetencies.forEach((sub) => {
      rows.push({
        competencyName: competency.competencyName,
        subCompetencyName: sub.subCompetency.name,
        status: sub.currentStatus,
        progress: sub.currentPercentage,
        delta: sub.progressDelta,
        lastEvidence: sub.lastEvidenceDate ?? null,
        newlyAcquired: sub.newlyAcquired,
      });
    });
  });

  return rows;
});

function getStatusColor(status: string): string {
  switch (status) {
    case 'Validated':
      return 'positive';
    case 'InProgress':
      return 'info';
    case 'PendingValidation':
      return 'warning';
    case 'NotStarted':
      return 'grey';
    case 'Locked':
      return 'grey-7';
    default:
      return 'grey';
  }
}

// Progress thresholds for color coding
const EXCELLENT_PROGRESS_THRESHOLD = 80;
const GOOD_PROGRESS_THRESHOLD = 60;
const FAIR_PROGRESS_THRESHOLD = 40;

function getProgressColor(progress: number): string {
  if (progress >= EXCELLENT_PROGRESS_THRESHOLD) return 'positive';
  if (progress >= GOOD_PROGRESS_THRESHOLD) return 'info';
  if (progress >= FAIR_PROGRESS_THRESHOLD) return 'warning';
  return 'negative';
}

function getDeltaClass(delta: number): string {
  if (delta > 0) return 'text-positive text-weight-medium';
  if (delta < 0) return 'text-negative text-weight-medium';
  return 'text-grey';
}

function formatDate(date: Date): string {
  return d(date, 'short');
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({ name: 'ReportDomainCard' });
</script>

<style scoped>
.competency-table :deep(.q-table__top) {
  padding: 0;
}

.progress-cell {
  min-width: 80px;
}

@media print {
  .q-card {
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 1rem !important;
  }

  .q-expansion-item :deep(.q-expansion-item__container) {
    box-shadow: none;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .q-expansion-item :deep(.q-expansion-item__toggle-icon) {
    display: none;
  }

  .q-table {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .text-h6 {
    font-size: 14pt !important;
    font-weight: bold !important;
  }

  .text-body1,
  .text-body2 {
    font-size: 11pt !important;
  }
}
</style>
