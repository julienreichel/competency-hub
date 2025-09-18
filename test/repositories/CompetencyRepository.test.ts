import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Competency } from '../../src/models/Competency';
import { graphQLClient } from '../../src/models/base/GraphQLClient';
import { CompetencyRepository } from '../../src/models/repositories/CompetencyRepository';

const mockGraphQLClient = graphQLClient as unknown as {
  createCompetency: ReturnType<typeof vi.fn>;
  getCompetency: ReturnType<typeof vi.fn>;
  getCompetencyWithDetails: ReturnType<typeof vi.fn>;
  listCompetencies: ReturnType<typeof vi.fn>;
  updateCompetency: ReturnType<typeof vi.fn>;
  deleteCompetency: ReturnType<typeof vi.fn>;
};

vi.mock('../../src/models/base/GraphQLClient', () => ({
  graphQLClient: {
    createCompetency: vi.fn(),
    getCompetency: vi.fn(),
    getCompetencyWithDetails: vi.fn(),
    listCompetencies: vi.fn(),
    updateCompetency: vi.fn(),
    deleteCompetency: vi.fn(),
  },
}));

describe('CompetencyRepository', () => {
  let repository: CompetencyRepository;

  const rawCompetency = {
    id: 'comp-1',
    domainId: 'domain-1',
    name: 'Foundations',
    description: 'Fundamental knowledge',
    objectives: 'Understand basics',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    subCompetencies: [
      {
        id: 'sub-1',
        competencyId: 'comp-1',
        name: 'Stage 1',
        description: 'First stage',
        objectives: 'Cover introduction',
        order: 1,
        resources: [
          {
            id: 'res-1',
            subCompetencyId: 'sub-1',
            type: 'Link',
            title: 'Overview video',
            url: 'https://example.com/video',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
          },
        ],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    repository = new CompetencyRepository();
    vi.clearAllMocks();
  });

  it('creates a competency', async () => {
    mockGraphQLClient.createCompetency.mockResolvedValue(rawCompetency);

    const result = await repository.create({
      domainId: 'domain-1',
      name: 'Foundations',
      description: 'Fundamental knowledge',
      objectives: 'Understand basics',
    });

    expect(mockGraphQLClient.createCompetency).toHaveBeenCalledWith({
      domainId: 'domain-1',
      name: 'Foundations',
      description: 'Fundamental knowledge',
      objectives: 'Understand basics',
    });
    expect(result).toBeInstanceOf(Competency);
    expect(result.subCompetencies).toHaveLength(1);
  });

  it('retrieves competency by id without details', async () => {
    mockGraphQLClient.getCompetency.mockResolvedValue(rawCompetency);

    const result = await repository.findById('comp-1');

    expect(mockGraphQLClient.getCompetency).toHaveBeenCalledWith('comp-1');
    expect(result?.name).toBe('Foundations');
    expect(result?.subCompetencies).toHaveLength(1);
  });

  it('retrieves competency with nested details', async () => {
    mockGraphQLClient.getCompetencyWithDetails.mockResolvedValue(rawCompetency);

    const result = await repository.findById('comp-1', { includeDetails: true });

    expect(mockGraphQLClient.getCompetencyWithDetails).toHaveBeenCalledWith('comp-1');
    expect(result?.subCompetencies[0]?.resources[0]?.title).toBe('Overview video');
  });

  it('returns null when competency not found', async () => {
    mockGraphQLClient.getCompetency.mockResolvedValue(null);

    const result = await repository.findById('missing');

    expect(result).toBeNull();
  });

  it('lists competencies with optional filter', async () => {
    mockGraphQLClient.listCompetencies.mockResolvedValue([rawCompetency]);

    const result = await repository.findAll({ domainId: { eq: 'domain-1' } });

    expect(mockGraphQLClient.listCompetencies).toHaveBeenCalledWith({
      domainId: { eq: 'domain-1' },
    });
    expect(result).toHaveLength(1);
  });

  it('updates a competency', async () => {
    mockGraphQLClient.updateCompetency.mockResolvedValue({
      ...rawCompetency,
      description: 'Updated description',
    });

    const result = await repository.update('comp-1', { description: 'Updated description' });

    expect(mockGraphQLClient.updateCompetency).toHaveBeenCalledWith({
      id: 'comp-1',
      description: 'Updated description',
    });
    expect(result.description).toBe('Updated description');
  });

  it('deletes a competency', async () => {
    mockGraphQLClient.deleteCompetency.mockResolvedValue(rawCompetency);

    const result = await repository.delete('comp-1');

    expect(mockGraphQLClient.deleteCompetency).toHaveBeenCalledWith('comp-1');
    expect(result.id).toBe('comp-1');
  });

  it('finds competencies by domain', async () => {
    mockGraphQLClient.listCompetencies.mockResolvedValue([rawCompetency]);

    const result = await repository.findByDomain('domain-1');

    expect(mockGraphQLClient.listCompetencies).toHaveBeenCalledWith({
      domainId: { eq: 'domain-1' },
    });
    expect(result[0]?.domainId).toBe('domain-1');
  });
});
