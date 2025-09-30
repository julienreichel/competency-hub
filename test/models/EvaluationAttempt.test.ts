import { describe, expect, it } from 'vitest';
import { EvaluationFormat, EvaluationMode } from '../../src/models/Evaluation';
import {
  EvaluationAttempt,
  type AmplifyEvaluationAttempt,
} from '../../src/models/EvaluationAttempt';

describe('EvaluationAttempt model', () => {
  const base = {
    id: 'attempt-1',
    studentId: 'student-1',
    evaluationId: 'eval-1',
    status: 'InProgress' as const,
    completionMode: 'Manual' as const,
    startedAt: '2024-01-01T08:00:00.000Z',
    completedAt: null,
  };

  it('constructs with defaults when optional fields missing', () => {
    const attempt = new EvaluationAttempt({
      id: base.id,
      studentId: base.studentId,
      evaluationId: base.evaluationId,
    });
    expect(attempt.status).toBe('NotStarted');
    expect(attempt.completionMode).toBe('Manual');
    expect(attempt.startedAt).toBeNull();
  });

  it('throws when required fields missing', () => {
    expect(
      () =>
        new EvaluationAttempt({
          ...base,
          studentId: '',
        }),
    ).toThrow('studentId is required');

    expect(
      () =>
        new EvaluationAttempt({
          ...base,
          evaluationId: '',
        }),
    ).toThrow('evaluationId is required');
  });

  it('parses amplify payload including nested evaluation', () => {
    const raw = {
      ...base,
      evaluation: {
        id: 'eval-1',
        subCompetencyId: 'sub-1',
        name: 'Quiz',
        mode: EvaluationMode.SOLO,
        format: EvaluationFormat.EXPERIMENT,
      },
    } as unknown as AmplifyEvaluationAttempt;

    const attempt = EvaluationAttempt.fromAmplify(raw);
    expect(attempt).toBeInstanceOf(EvaluationAttempt);
    expect(attempt.evaluation?.name).toBe('Quiz');
  });

  it('clones evaluation attempts preserving nested evaluation', () => {
    const original = new EvaluationAttempt({
      ...base,
      evaluation: {
        id: 'eval-1',
        subCompetencyId: 'sub-1',
        name: 'Quiz',
        mode: EvaluationMode.SOLO,
        format: EvaluationFormat.EXPERIMENT,
      },
    });

    const copy = original.clone();
    expect(copy).not.toBe(original);
    expect(copy.evaluation?.name).toBe(original.evaluation?.name);
  });
});
