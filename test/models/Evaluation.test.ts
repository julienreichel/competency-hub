import { describe, expect, it } from 'vitest';
import {
  Evaluation,
  EvaluationFormat,
  EvaluationMode,
  type AmplifyEvaluation,
  type EvaluationInit,
} from '../../src/models/Evaluation';

describe('Evaluation model', () => {
  const baseInit: EvaluationInit = {
    id: 'eval-1',
    subCompetencyId: 'sub-1',
    name: 'Practical assessment',
    description: 'Hands-on experiment',
    mode: EvaluationMode.SOLO,
    format: EvaluationFormat.EXPERIMENT,
    durationMin: 45,
    url: 'https://example.com',
    fileKey: 'files/eval.pdf',
  };

  it('constructs with defaults', () => {
    const evaluation = new Evaluation({ ...baseInit, durationMin: null, fileKey: null });
    expect(evaluation.durationMin).toBeNull();
    expect(evaluation.fileKey).toBeNull();
  });

  it('throws on invalid mode or format', () => {
    expect(
      () =>
        new Evaluation({
          ...baseInit,
          mode: 'Invalid' as EvaluationMode,
        }),
    ).toThrow('Invalid evaluation mode');

    expect(
      () =>
        new Evaluation({
          ...baseInit,
          format: 'Unknown' as EvaluationFormat,
        }),
    ).toThrow('Invalid evaluation format');
  });

  it('creates from amplify payload', () => {
    const raw = {
      ...baseInit,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    } as unknown as AmplifyEvaluation;

    const evaluation = Evaluation.fromAmplify(raw);
    expect(evaluation).toBeInstanceOf(Evaluation);
    expect(evaluation.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(evaluation.mode).toBe(EvaluationMode.SOLO);
  });

  it('clones and preserves data', () => {
    const original = new Evaluation(baseInit);
    const copy = original.clone();
    expect(copy).not.toBe(original);
    expect(copy.toJSON()).toEqual(original.toJSON());
  });
});
