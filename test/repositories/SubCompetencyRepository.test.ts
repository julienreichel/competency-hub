import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubCompetency } from '../../src/models/SubCompetency';
import { graphQLClient } from '../../src/models/base/GraphQLClient';
import { SubCompetencyRepository } from '../../src/models/repositories/SubCompetencyRepository';

const mockGraphQLClient = graphQLClient as unknown as {
  createSubCompetency: ReturnType<typeof vi.fn>;
  getSubCompetency: ReturnType<typeof vi.fn>;
  getSubCompetencyWithDetails: ReturnType<typeof vi.fn>;
  listSubCompetencies: ReturnType<typeof vi.fn>;
  updateSubCompetency: ReturnType<typeof vi.fn>;
  deleteSubCompetency: ReturnType<typeof vi.fn>;
};

vi.mock('../../src/models/base/GraphQLClient', () => ({
  graphQLClient: {
    createSubCompetency: vi.fn(),
    getSubCompetency: vi.fn(),
    getSubCompetencyWithDetails: vi.fn(),
    listSubCompetencies: vi.fn(),
    updateSubCompetency: vi.fn(),
    deleteSubCompetency: vi.fn(),
  },
}));

describe('SubCompetencyRepository', () => {
  let repository: SubCompetencyRepository;

  const rawSubCompetency = {
    id: 'sub-1',
    competencyId: 'comp-1',
    name: 'Stage 1',
    description: 'First stage',
    objectives: 'Cover basics',
    level: 1,
    resources: [],
  };

  beforeEach(() => {
    repository = new SubCompetencyRepository();
    vi.clearAllMocks();
  });

  it('creates a sub-competency', async () => {
    mockGraphQLClient.createSubCompetency.mockResolvedValue(rawSubCompetency);

    const result = await repository.create({
      competencyId: 'comp-1',
      name: 'Stage 1',
      description: 'First stage',
      level: 1,
    });

    expect(mockGraphQLClient.createSubCompetency).toHaveBeenCalledWith({
      competencyId: 'comp-1',
      name: 'Stage 1',
      description: 'First stage',
      level: 1,
    });
    expect(result).toBeInstanceOf(SubCompetency);
  });

  it('throws when create returns null', async () => {
    mockGraphQLClient.createSubCompetency.mockResolvedValue(null);

    await expect(repository.create({ competencyId: 'comp-1', name: 'Stage 1' })).rejects.toThrow(
      'Failed to create sub-competency',
    );
  });

  it('finds a sub-competency by id', async () => {
    mockGraphQLClient.getSubCompetency.mockResolvedValue(rawSubCompetency);

    const result = await repository.findById('sub-1');

    expect(mockGraphQLClient.getSubCompetency).toHaveBeenCalledWith('sub-1');
    expect(result?.name).toBe('Stage 1');
  });

  it('finds a sub-competency with details', async () => {
    mockGraphQLClient.getSubCompetencyWithDetails.mockResolvedValue(rawSubCompetency);

    const result = await repository.findById('sub-1', true);

    expect(mockGraphQLClient.getSubCompetencyWithDetails).toHaveBeenCalledWith('sub-1');
    expect(result).toBeInstanceOf(SubCompetency);
  });

  it('lists sub-competencies by competency id', async () => {
    mockGraphQLClient.listSubCompetencies.mockResolvedValue([rawSubCompetency]);

    const result = await repository.findAll({ competencyId: { eq: 'comp-1' } });

    expect(mockGraphQLClient.listSubCompetencies).toHaveBeenCalledWith({
      competencyId: { eq: 'comp-1' },
    });
    expect(result).toHaveLength(1);
  });

  it('filters out null entries when listing sub-competencies', async () => {
    mockGraphQLClient.listSubCompetencies.mockResolvedValue([rawSubCompetency, null]);

    const result = await repository.findAll();

    expect(mockGraphQLClient.listSubCompetencies).toHaveBeenCalledWith(undefined);
    expect(result).toHaveLength(1);
  });

  it('updates a sub-competency', async () => {
    mockGraphQLClient.updateSubCompetency.mockResolvedValue({
      ...rawSubCompetency,
      description: 'Updated',
    });

    const result = await repository.update('sub-1', { description: 'Updated' });

    expect(mockGraphQLClient.updateSubCompetency).toHaveBeenCalledWith({
      id: 'sub-1',
      description: 'Updated',
    });
    expect(result.description).toBe('Updated');
  });

  it('throws when update returns null', async () => {
    mockGraphQLClient.updateSubCompetency.mockResolvedValue(null);

    await expect(repository.update('sub-1', { name: 'Updated' })).rejects.toThrow(
      'Failed to update sub-competency sub-1',
    );
  });

  it('deletes a sub-competency', async () => {
    mockGraphQLClient.deleteSubCompetency.mockResolvedValue(rawSubCompetency);

    const result = await repository.delete('sub-1');

    expect(mockGraphQLClient.deleteSubCompetency).toHaveBeenCalledWith('sub-1');
    expect(result.id).toBe('sub-1');
  });

  it('throws when delete returns null', async () => {
    mockGraphQLClient.deleteSubCompetency.mockResolvedValue(null);

    await expect(repository.delete('sub-1')).rejects.toThrow(
      'Failed to delete sub-competency sub-1',
    );
  });
});
