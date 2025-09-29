import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

import { useEvaluationStudentActions } from 'src/composables/useEvaluationStudentActions';
import { Evaluation, EvaluationFormat, EvaluationMode } from 'src/models/Evaluation';
import { EvaluationAttempt } from 'src/models/EvaluationAttempt';
import {
  evaluationAttemptRepository,
  type CreateEvaluationAttemptInput,
  type UpdateEvaluationAttemptInput,
} from 'src/models/repositories/EvaluationAttemptRepository';

vi.mock('src/models/repositories/EvaluationAttemptRepository', () => {
  return {
    evaluationAttemptRepository: {
      create: vi.fn(),
      update: vi.fn(),
    },
  };
});
vi.mock('vue-i18n', () => {
  return {
    useI18n: (): object => ({
      t: vi.fn((s: string): string => s),
    }),
  };
});
const notify = vi.fn();
vi.mock('quasar', () => {
  return {
    useQuasar: (): object => ({
      notify,
    }),
  };
});

describe('useEvaluationStudentActions', () => {
  const createEvaluation = (): Evaluation =>
    new Evaluation({
      id: 'eval-1',
      subCompetencyId: 'sub-1',
      name: 'Evaluation One',
      mode: EvaluationMode.SOLO,
      format: EvaluationFormat.EXPERIMENT,
    });

  beforeEach(() => {
    vi.resetAllMocks();
    notify.mockClear();
  });

  const repoMock = vi.mocked(evaluationAttemptRepository);

  it('initializes busy map and attempts when evaluations change', () => {
    const evaluation = createEvaluation();
    evaluation.attempts = [
      new EvaluationAttempt({
        id: 'attempt-1',
        evaluationId: evaluation.id,
        studentId: 'student-1',
        status: 'InProgress',
        completionMode: 'Manual',
        startedAt: '2024-01-01T00:00:00Z',
        completedAt: null,
      }),
    ];

    const evaluations = ref([evaluation]);
    const studentId = computed(() => 'student-1');
    const actionsAllowed = computed(() => true);

    const { busyMap, attemptsByEvaluation } = useEvaluationStudentActions({
      evaluations,
      studentId,
      actionsAllowed,
    });

    expect(busyMap[evaluation.id]).toEqual({ busy: false, pending: null });
    expect(attemptsByEvaluation[evaluation.id]?.id).toBe('attempt-1');
  });

  it('creates a new attempt when starting evaluation', async () => {
    const evaluation = createEvaluation();
    evaluation.resolveFileUrl = vi.fn().mockResolvedValue('https://example.com');

    const createResponse = new EvaluationAttempt({
      id: 'attempt-2',
      evaluationId: evaluation.id,
      studentId: 'student-2',
      status: 'InProgress',
      completionMode: 'Manual',
      startedAt: '2024-02-02T00:00:00Z',
      completedAt: null,
    });

    repoMock.create.mockResolvedValue(createResponse);

    const evaluations = ref([evaluation]);
    const studentId = computed(() => 'student-2');
    const actionsAllowed = computed(() => true);

    const { startEvaluation, busyMap } = useEvaluationStudentActions({
      evaluations,
      studentId,
      actionsAllowed,
    });

    await startEvaluation(evaluation);

    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining<CreateEvaluationAttemptInput>({
        studentId: 'student-2',
        evaluationId: evaluation.id,
        status: 'InProgress',
      }),
    );
    expect(busyMap[evaluation.id]).toEqual({ busy: false, pending: null });
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'positive' }));
  });

  it('marks evaluation as completed', async () => {
    const evaluation = createEvaluation();
    const attempt = new EvaluationAttempt({
      id: 'attempt-3',
      evaluationId: evaluation.id,
      studentId: 'student-3',
      status: 'InProgress',
      completionMode: 'Manual',
      startedAt: '2024-03-03T00:00:00Z',
      completedAt: null,
    });
    evaluation.attempts = [attempt];

    const updateResponse = new EvaluationAttempt({
      ...attempt,
      status: 'Completed',
      completedAt: '2024-03-03T01:00:00Z',
    });

    repoMock.update.mockResolvedValue(updateResponse);

    const evaluations = ref([evaluation]);
    const studentId = computed(() => 'student-3');
    const actionsAllowed = computed(() => true);
    const onAttemptUpdated = vi.fn();

    const { completeEvaluation, ensureEvaluationAttempt } = useEvaluationStudentActions({
      evaluations,
      studentId,
      actionsAllowed,
      onAttemptUpdated,
    });

    await completeEvaluation(evaluation);

    expect(repoMock.update).toHaveBeenCalledWith(
      attempt.id,
      expect.objectContaining<UpdateEvaluationAttemptInput>({
        status: 'Completed',
      }),
    );
    expect(onAttemptUpdated).toHaveBeenCalledWith(updateResponse);
    ensureEvaluationAttempt(evaluation, updateResponse);
    expect(evaluation.attempts?.find((entry) => entry.id === updateResponse.id)?.status).toBe(
      'Completed',
    );
  });
});
