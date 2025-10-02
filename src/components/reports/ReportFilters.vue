<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section>
      <div class="text-h6 q-mb-md">{{ $t('reports.filters.title') }}</div>

      <div class="row q-col-gutter-md">
        <!-- Period Selection -->
        <div class="col-12 col-md-6">
          <div class="text-subtitle2 q-mb-sm">{{ $t('reports.filters.period') }}</div>
          <div class="row q-gutter-sm">
            <q-input
              v-model="startDateInput"
              :label="$t('reports.filters.startDate')"
              type="date"
              outlined
              dense
              class="col"
              @update:model-value="updatePeriod"
            />
            <q-input
              v-model="endDateInput"
              :label="$t('reports.filters.endDate')"
              type="date"
              outlined
              dense
              class="col"
              @update:model-value="updatePeriod"
            />
          </div>
        </div>

        <!-- Domain Filter -->
        <div class="justify-end col-12 col-md-3">
          <div class="text-subtitle2 q-mb-sm">{{ $t('reports.filters.domain') }}</div>
          <q-select
            v-model="internalDomainFilter"
            :options="domainOptions"
            :label="$t('reports.filters.domain')"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            clearable
            outlined
            dense
            @update:model-value="$emit('update:domainFilter', $event)"
          />
        </div>

        <!-- Options -->
        <div class="col-12 col-md-3">
          <div class="text-subtitle2 q-mb-sm">{{ $t('reports.filters.options') }}</div>
          <q-checkbox
            v-model="internalIncludeDetails"
            :label="$t('reports.filters.includeDetails')"
            @update:model-value="$emit('update:includeDetails', $event)"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="row justify-end q-mt-md">
        <q-btn
          color="primary"
          :label="$t('reports.actions.generate')"
          icon="refresh"
          @click="$emit('generate')"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface ReportPeriod {
  startDate: Date;
  endDate: Date;
}

interface DomainOption {
  label: string;
  value: string;
}

const props = defineProps<{
  period: ReportPeriod;
  domainFilter?: string | null;
  includeDetails: boolean;
  domainOptions: DomainOption[];
}>();

const emit = defineEmits<{
  (e: 'update:period', value: ReportPeriod): void;
  (e: 'update:domainFilter', value: string | null): void;
  (e: 'update:includeDetails', value: boolean): void;
  (e: 'generate'): void;
}>();

// Date inputs (string format for HTML date inputs)
const startDateInput = ref(props.period.startDate.toISOString().split('T')[0]);
const endDateInput = ref(props.period.endDate.toISOString().split('T')[0]);

// Internal models for two-way binding
const internalDomainFilter = ref(props.domainFilter);
const internalIncludeDetails = ref(props.includeDetails);

// Watch for prop changes
watch(
  () => props.period,
  (newPeriod) => {
    startDateInput.value = newPeriod.startDate.toISOString().split('T')[0];
    endDateInput.value = newPeriod.endDate.toISOString().split('T')[0];
  },
);

watch(
  () => props.domainFilter,
  (newValue) => {
    internalDomainFilter.value = newValue;
  },
);

watch(
  () => props.includeDetails,
  (newValue) => {
    internalIncludeDetails.value = newValue;
  },
);

function updatePeriod(): void {
  if (!startDateInput.value || !endDateInput.value) return;

  const startDate = new Date(startDateInput.value);
  const endDate = new Date(endDateInput.value);

  if (startDate <= endDate) {
    emit('update:period', { startDate, endDate });
  }
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({ name: 'ReportFilters' });
</script>
