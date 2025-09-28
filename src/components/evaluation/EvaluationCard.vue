<template>
  <q-card flat bordered>
    <q-card-section class="row items-start justify-between q-gutter-sm">
      <div class="column q-gutter-xs">
        <div class="row items-center q-gutter-sm">
          <template v-if="isStudentVariant">
            <q-icon :name="statusIcon" :color="statusColor" size="22px" />
          </template>
          <div class="text-subtitle2 text-grey-7">
            {{ evaluation.mode }} • {{ evaluation.format }}
          </div>
        </div>
        <div class="text-subtitle1">{{ evaluation.name }}</div>
        <div v-if="subCompetency" class="text-caption text-grey-6">
          <span v-if="subCompetency?.competency?.domain?.name">
            {{ subCompetency?.competency?.domain?.name }}
          </span>
          <span v-if="subCompetency?.competency?.domain?.name && subCompetency?.competency?.name">
            •
          </span>
          <span v-if="subCompetency?.competency?.name">
            {{ subCompetency?.competency?.name }}
          </span>
          <span
            v-if="
              (subCompetency?.competency?.name || subCompetency?.competency?.domain?.name) &&
              subCompetency?.name
            "
          >
            •
          </span>
          <span v-if="subCompetency?.name">{{ subCompetency?.name }}</span>
        </div>
        <div v-if="evaluation.description" class="text-caption text-grey-7">
          {{ evaluation.description }}
        </div>
        <div class="text-caption text-grey-6">
          <span v-if="evaluation.durationMin">
            {{ evaluation.durationMin }} {{ $t('evaluations.minutesShort') }}
          </span>
          <span v-else>{{ $t('evaluations.noDuration') }}</span>
        </div>
      </div>
      <div class="row q-gutter-xs">
        <template v-if="isStudentVariant">
          <q-btn
            v-if="status === 'NotStarted' && studentActionsAllowed"
            color="primary"
            dense
            class="q-px-sm"
            :disable="busy"
            :loading="busy && pendingAction === 'start'"
            @click="emitStart"
          >
            {{ $t('evaluations.actions.start') }}
          </q-btn>
          <q-btn
            v-if="status === 'InProgress'"
            color="positive"
            dense
            class="q-px-sm"
            :disable="busy"
            :loading="busy && pendingAction === 'complete'"
            @click="emitComplete"
          >
            {{ $t('evaluations.actions.complete') }}
          </q-btn>
          <q-btn
            color="primary"
            dense
            flat
            icon="open_in_new"
            :disable="!canStudentOpen || busy"
            :loading="busy && pendingAction === 'open'"
            @click="handleOpen"
          />
        </template>
        <template v-else>
          <q-btn
            flat
            dense
            color="primary"
            icon="open_in_new"
            :disable="!canOpen"
            @click="handleOpen"
          />
          <q-btn
            v-if="showActions"
            flat
            dense
            color="secondary"
            icon="edit"
            @click="$emit('edit', evaluation)"
          />
          <q-btn
            v-if="showActions"
            flat
            dense
            color="negative"
            icon="delete"
            @click="$emit('delete', evaluation.id)"
          />
        </template>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { Evaluation } from 'src/models/Evaluation';
import type { EvaluationAttempt } from 'src/models/EvaluationAttempt';
import type { SubCompetency } from 'src/models/SubCompetency';
import { computed } from 'vue';

const props = defineProps<{
  evaluation: Evaluation;
  showActions?: boolean;
  variant?: 'manager' | 'student';
  attempt?: EvaluationAttempt | null;
  busy?: boolean;
  pendingAction?: 'start' | 'open' | 'complete' | null;
  studentActionsAllowed?: boolean | undefined;
  subCompetency?: SubCompetency | null | undefined;
}>();

const emit = defineEmits<{
  (e: 'open', evaluation: Evaluation): void;
  (e: 'edit', evaluation: Evaluation): void;
  (e: 'delete', id: string): void;
  (e: 'start', evaluation: Evaluation): void;
  (e: 'complete', evaluation: Evaluation): void;
}>();

const isStudentVariant = computed(() => props.variant === 'student');
const showActions = computed(() => props.showActions === true);
const status = computed<'NotStarted' | 'InProgress' | 'Completed'>(
  () => props.attempt?.status ?? 'NotStarted',
);

const canOpen = computed(() => Boolean(props.evaluation.url || props.evaluation.fileKey));
const canStudentOpen = computed(() => status.value !== 'NotStarted' && canOpen.value);

const busy = computed(() => props.busy === true);
const pendingAction = computed(() => props.pendingAction ?? null);
const studentActionsAllowed = computed(() =>
  isStudentVariant.value ? props.studentActionsAllowed !== false : false,
);
const subCompetency = computed(() => props.subCompetency ?? null);

const statusIcon = computed(() => {
  switch (status.value) {
    case 'Completed':
      return 'check_circle';
    case 'InProgress':
      return 'play_circle';
    default:
      return 'hourglass_empty';
  }
});

const statusColor = computed(() => {
  switch (status.value) {
    case 'Completed':
      return 'positive';
    case 'InProgress':
      return 'primary';
    default:
      return 'grey-5';
  }
});

function handleOpen(): void {
  if (isStudentVariant.value && (!studentActionsAllowed.value || !canStudentOpen.value)) {
    return;
  }
  if (!isStudentVariant.value && !canOpen.value) return;
  emit('open', props.evaluation);
}

function emitStart(): void {
  if (busy.value || !studentActionsAllowed.value) return;
  emit('start', props.evaluation);
}

function emitComplete(): void {
  if (busy.value || !studentActionsAllowed.value) return;
  emit('complete', props.evaluation);
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'EvaluationCard',
});
</script>
