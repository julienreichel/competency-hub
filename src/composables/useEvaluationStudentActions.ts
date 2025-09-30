import { useQuasar } from 'quasar';
import type { Evaluation } from 'src/models/Evaluation';
import type { EvaluationAttempt } from 'src/models/EvaluationAttempt';
import {
  evaluationAttemptRepository,
  type CreateEvaluationAttemptInput,
  type UpdateEvaluationAttemptInput,
} from 'src/models/repositories/EvaluationAttemptRepository';
import type { ComputedRef, Ref } from 'vue';
import { computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';

export interface EvaluationBusyEntry {
  busy: boolean;
  pending: 'start' | 'open' | 'complete' | null;
}

export interface UseEvaluationStudentActionsOptions {
  evaluations: Ref<Evaluation[]>;
  studentId: ComputedRef<string>;
  actionsAllowed: ComputedRef<boolean>;
  onAttemptUpdated?: (attempt: EvaluationAttempt) => void;
}

interface UseEvaluationStudentActionsReturn {
  busyMap: Record<string, EvaluationBusyEntry>;
  attemptsByEvaluation: Record<string, EvaluationAttempt | null>;
  actionsEnabled: ComputedRef<boolean>;
  syncEvaluations: () => void;
  findAttempt: (evaluation: Evaluation) => EvaluationAttempt | null;
  openEvaluation: (evaluation: Evaluation) => Promise<void>;
  startEvaluation: (evaluation: Evaluation) => Promise<void>;
  completeEvaluation: (evaluation: Evaluation) => Promise<void>;
  ensureEvaluationAttempt: (evaluation: Evaluation, attempt: EvaluationAttempt) => void;
}

function ensureEvaluationAttemptOnEvaluation(
  evaluation: Evaluation,
  attempt: EvaluationAttempt,
): void {
  if (!Array.isArray(evaluation.attempts)) {
    evaluation.attempts = [attempt];
    return;
  }
  const index = evaluation.attempts.findIndex((entry) => entry.id === attempt.id);
  if (index === -1) {
    evaluation.attempts.push(attempt);
  } else {
    evaluation.attempts.splice(index, 1, attempt);
  }
}

function findAttemptForStudent(
  evaluation: Evaluation,
  studentIdentifier: string,
): EvaluationAttempt | null {
  if (!studentIdentifier) return null;
  const attempts = Array.isArray(evaluation.attempts) ? evaluation.attempts : [];
  return attempts.find((attempt) => attempt.studentId === studentIdentifier) ?? null;
}

async function openEvaluationResource(evaluation: Evaluation): Promise<void> {
  if (evaluation.url) {
    window.open(evaluation.url, '_blank', 'noopener');
    return;
  }
  if (!evaluation.fileKey) return;
  const resolved = await evaluation.resolveFileUrl();
  if (!resolved) {
    throw new Error('Failed to resolve evaluation file URL');
  }
  window.open(resolved, '_blank', 'noopener');
}

export function useEvaluationStudentActions({
  evaluations,
  studentId,
  actionsAllowed,
  onAttemptUpdated,
}: UseEvaluationStudentActionsOptions): UseEvaluationStudentActionsReturn {
  const { t } = useI18n();
  const { notify } = useQuasar();

  const busyMap = reactive<Record<string, EvaluationBusyEntry>>({});
  const attemptsByEvaluation = reactive<Record<string, EvaluationAttempt | null>>({});

  const hasStudent = computed(() => Boolean(studentId.value));
  const studentActionsEnabled = computed(() => hasStudent.value && actionsAllowed.value);

  const findAttempt = (evaluation: Evaluation): EvaluationAttempt | null =>
    hasStudent.value ? findAttemptForStudent(evaluation, studentId.value) : null;

  function syncEvaluations(): void {
    evaluations.value.forEach((evaluation) => {
      if (!busyMap[evaluation.id]) {
        busyMap[evaluation.id] = { busy: false, pending: null };
      }
      attemptsByEvaluation[evaluation.id] = findAttempt(evaluation);
    });
  }
  syncEvaluations();

  function setBusy(id: string, pending: EvaluationBusyEntry['pending'], value: boolean): void {
    busyMap[id] = {
      busy: value,
      pending: value ? pending : null,
    };
  }

  async function handleStart(evaluation: Evaluation): Promise<void> {
    if (!studentActionsEnabled.value || !hasStudent.value) return;

    setBusy(evaluation.id, 'start', true);
    try {
      const timestamp = new Date().toISOString();
      let attempt = attemptsByEvaluation[evaluation.id];

      if (!attempt) {
        const payload: CreateEvaluationAttemptInput = {
          studentId: studentId.value,
          evaluationId: evaluation.id,
          status: 'InProgress',
          startedAt: timestamp,
        };
        attempt = await evaluationAttemptRepository.create(payload);
      } else {
        const updates: UpdateEvaluationAttemptInput = {
          status: 'InProgress',
          startedAt: timestamp,
        };
        attempt = await evaluationAttemptRepository.update(attempt.id, updates);
      }

      attemptsByEvaluation[evaluation.id] = attempt;
      ensureEvaluationAttemptOnEvaluation(evaluation, attempt);
      onAttemptUpdated?.(attempt);
      await evaluation.resolveFileUrl();
      notify({ type: 'positive', message: t('evaluations.actions.startSuccess') });
    } catch (error) {
      console.error('Failed to start evaluation', error);
      notify({ type: 'negative', message: t('evaluations.actions.startError') });
    } finally {
      setBusy(evaluation.id, null, false);
    }
  }

  async function handleComplete(evaluation: Evaluation): Promise<void> {
    if (!studentActionsEnabled.value || !hasStudent.value) return;
    const attempt = attemptsByEvaluation[evaluation.id];
    if (!attempt || attempt.status !== 'InProgress') return;

    setBusy(evaluation.id, 'complete', true);
    try {
      const timestamp = new Date().toISOString();
      const updated = await evaluationAttemptRepository.update(attempt.id, {
        status: 'Completed',
        completedAt: timestamp,
      });
      attemptsByEvaluation[evaluation.id] = updated;
      ensureEvaluationAttemptOnEvaluation(evaluation, updated);
      onAttemptUpdated?.(updated);
      notify({
        type: 'positive',
        message: t('evaluations.actions.completeSuccess'),
      });
    } catch (error) {
      console.error('Failed to mark evaluation completed', error);
      notify({ type: 'negative', message: t('evaluations.actions.completeError') });
    } finally {
      setBusy(evaluation.id, null, false);
    }
  }

  return {
    busyMap,
    attemptsByEvaluation,
    actionsEnabled: studentActionsEnabled,
    syncEvaluations,
    findAttempt,
    openEvaluation: openEvaluationResource,
    startEvaluation: handleStart,
    completeEvaluation: handleComplete,
    ensureEvaluationAttempt: ensureEvaluationAttemptOnEvaluation,
  };
}
