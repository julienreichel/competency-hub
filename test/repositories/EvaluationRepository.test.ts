import { beforeEach, describe, expect, it, vi } from 'vitest';
import { graphQLClient } from '../../src/models/base/GraphQLClient';
import { Evaluation, EvaluationFormat, EvaluationMode } from '../../src/models/Evaluation';
import { EvaluationRepository } from '../../src/models/repositories/EvaluationRepository';

const mockGraphQLClient = graphQLClient as unknown as {
  createEvaluation: ReturnType<typeof vi.fn>;
  getEvaluation: ReturnType<typeof vi.fn>;
  updateEvaluation: ReturnType<typeof vi.fn>;
  deleteEvaluation: ReturnType<typeof vi.fn>;
};

vi.mock('../../src/models/base/GraphQLClient', () => ({
  graphQLClient: {
    createEvaluation: vi.fn(),
    getEvaluation: vi.fn(),
    updateEvaluation: vi.fn(),
    deleteEvaluation: vi.fn(),
  },
}));

const rawEvaluation = {
  id: 'eval-1',
  subCompetencyId: 'sub-1',
  name: 'Quiz',
  mode: 'Solo',
  format: 'Experiment',
};

describe('EvaluationRepository', () => {
  let repository: EvaluationRepository;

  beforeEach(() => {
    repository = new EvaluationRepository();
    vi.clearAllMocks();
  });

  it('creates evaluation and returns model', async () => {
    mockGraphQLClient.createEvaluation.mockResolvedValue(rawEvaluation);

    const result = await repository.create({
      subCompetencyId: 'sub-1',
      name: 'Quiz',
      mode: EvaluationMode.SOLO,
      format: EvaluationFormat.EXPERIMENT,
    });

    expect(mockGraphQLClient.createEvaluation).toHaveBeenCalledWith({
      subCompetencyId: 'sub-1',
      name: 'Quiz',
      mode: 'Solo',
      format: 'Experiment',
    });
    expect(result).toBeInstanceOf(Evaluation);
  });

  it('throws when creation fails', async () => {
    mockGraphQLClient.createEvaluation.mockResolvedValue(null);
    await expect(
      repository.create({
        subCompetencyId: 'sub-1',
        name: 'Quiz',
        mode: EvaluationMode.SOLO,
        format: EvaluationFormat.EXPERIMENT,
      }),
    ).rejects.toThrow('Failed to create evaluation');
  });

  it('finds evaluation by id', async () => {
    mockGraphQLClient.getEvaluation.mockResolvedValue(rawEvaluation);

    const result = await repository.findById('eval-1');

    expect(mockGraphQLClient.getEvaluation).toHaveBeenCalledWith('eval-1');
    expect(result).toBeInstanceOf(Evaluation);
  });

  it('returns null when evaluation not found', async () => {
    mockGraphQLClient.getEvaluation.mockResolvedValue(null);

    const result = await repository.findById('missing');

    expect(result).toBeNull();
  });

  it('updates evaluation and returns model', async () => {
    mockGraphQLClient.updateEvaluation.mockResolvedValue({ ...rawEvaluation, name: 'Updated' });

    const result = await repository.update('eval-1', { name: 'Updated' });

    expect(mockGraphQLClient.updateEvaluation).toHaveBeenCalledWith({
      id: 'eval-1',
      name: 'Updated',
    });
    expect(result.name).toBe('Updated');
  });

  it('throws when update returns null', async () => {
    mockGraphQLClient.updateEvaluation.mockResolvedValue(null);
    await expect(repository.update('eval-1', { name: 'Updated' })).rejects.toThrow(
      'Failed to update evaluation eval-1',
    );
  });

  it('deletes evaluation and returns model', async () => {
    mockGraphQLClient.deleteEvaluation.mockResolvedValue(rawEvaluation);

    const result = await repository.delete('eval-1');

    expect(mockGraphQLClient.deleteEvaluation).toHaveBeenCalledWith('eval-1');
    expect(result).toBeInstanceOf(Evaluation);
  });

  it('throws when delete returns null', async () => {
    mockGraphQLClient.deleteEvaluation.mockResolvedValue(null);
    await expect(repository.delete('eval-1')).rejects.toThrow('Failed to delete evaluation eval-1');
  });
});
