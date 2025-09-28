import { beforeEach, describe, expect, it, vi } from 'vitest';
import { graphQLClient } from '../../src/models/base/GraphQLClient';
import { EvaluationAttemptRepository } from '../../src/models/repositories/EvaluationAttemptRepository';
import { EvaluationAttempt } from '../../src/models/EvaluationAttempt';

const mockGraphQLClient = graphQLClient as unknown as {
  createEvaluationAttempt: ReturnType<typeof vi.fn>;
  updateEvaluationAttempt: ReturnType<typeof vi.fn>;
};

vi.mock('../../src/models/base/GraphQLClient', () => ({
  graphQLClient: {
    createEvaluationAttempt: vi.fn(),
    updateEvaluationAttempt: vi.fn(),
  },
}));

const rawAttempt = {
  id: 'attempt-1',
  studentId: 'student-1',
  evaluationId: 'eval-1',
  status: 'InProgress',
  completionMode: 'Manual',
};

describe('EvaluationAttemptRepository', () => {
  let repository: EvaluationAttemptRepository;

  beforeEach(() => {
    repository = new EvaluationAttemptRepository();
    vi.clearAllMocks();
  });

  it('creates evaluation attempt and returns model', async () => {
    mockGraphQLClient.createEvaluationAttempt.mockResolvedValue(rawAttempt);

    const result = await repository.create({ studentId: 'student-1', evaluationId: 'eval-1' });

    expect(mockGraphQLClient.createEvaluationAttempt).toHaveBeenCalledWith({
      studentId: 'student-1',
      evaluationId: 'eval-1',
    });
    expect(result).toBeInstanceOf(EvaluationAttempt);
  });

  it('throws when creation returns null', async () => {
    mockGraphQLClient.createEvaluationAttempt.mockResolvedValue(null);
    await expect(
      repository.create({ studentId: 'student-1', evaluationId: 'eval-1' }),
    ).rejects.toThrow('Failed to create evaluation attempt');
  });

  it('updates evaluation attempt and returns model', async () => {
    mockGraphQLClient.updateEvaluationAttempt.mockResolvedValue({
      ...rawAttempt,
      status: 'Completed',
    });

    const result = await repository.update('attempt-1', { status: 'Completed' });

    expect(mockGraphQLClient.updateEvaluationAttempt).toHaveBeenCalledWith({
      id: 'attempt-1',
      status: 'Completed',
    });
    expect(result.status).toBe('Completed');
  });

  it('throws when update returns null', async () => {
    mockGraphQLClient.updateEvaluationAttempt.mockResolvedValue(null);
    await expect(repository.update('attempt-1', { status: 'Completed' })).rejects.toThrow(
      'Failed to update evaluation attempt attempt-1',
    );
  });
});
