import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompetencyResource, ResourceType } from '../../src/models/Competency';
import { graphQLClient } from '../../src/models/base/GraphQLClient';
import { ResourceRepository } from '../../src/models/repositories/ResourceRepository';

const mockGraphQLClient = graphQLClient as unknown as {
  createResource: ReturnType<typeof vi.fn>;
  getResource: ReturnType<typeof vi.fn>;
  listResources: ReturnType<typeof vi.fn>;
  updateResource: ReturnType<typeof vi.fn>;
  deleteResource: ReturnType<typeof vi.fn>;
};

vi.mock('../../src/models/base/GraphQLClient', () => ({
  graphQLClient: {
    createResource: vi.fn(),
    getResource: vi.fn(),
    listResources: vi.fn(),
    updateResource: vi.fn(),
    deleteResource: vi.fn(),
  },
}));

describe('ResourceRepository', () => {
  let repository: ResourceRepository;

  const rawResource = {
    id: 'res-1',
    subCompetencyId: 'sub-1',
    type: 'Link',
    name: 'Overview video',
    description: 'Watch before class',
    url: 'https://example.com/video',
  };

  beforeEach(() => {
    repository = new ResourceRepository();
    vi.clearAllMocks();
  });

  it('creates a resource', async () => {
    mockGraphQLClient.createResource.mockResolvedValue(rawResource);

    const result = await repository.create({
      subCompetencyId: 'sub-1',
      type: ResourceType.LINK,
      name: 'Overview video',
      description: 'Watch before class',
      url: 'https://example.com/video',
    });

    expect(mockGraphQLClient.createResource).toHaveBeenCalledWith({
      subCompetencyId: 'sub-1',
      type: ResourceType.LINK,
      name: 'Overview video',
      description: 'Watch before class',
      url: 'https://example.com/video',
    });
    expect(result).toBeInstanceOf(CompetencyResource);
  });

  it('finds a resource by id', async () => {
    mockGraphQLClient.getResource.mockResolvedValue(rawResource);

    const resource = await repository.findById('res-1');

    expect(mockGraphQLClient.getResource).toHaveBeenCalledWith('res-1');
    expect(resource?.name).toBe('Overview video');
  });

  it('lists resources by sub-competency id', async () => {
    mockGraphQLClient.listResources.mockResolvedValue([rawResource]);

    const resources = await repository.findAll({ subCompetencyId: { eq: 'sub-1' } });

    expect(mockGraphQLClient.listResources).toHaveBeenCalledWith({
      subCompetencyId: { eq: 'sub-1' },
    });
    expect(resources).toHaveLength(1);
  });

  it('updates a resource', async () => {
    mockGraphQLClient.updateResource.mockResolvedValue({
      ...rawResource,
      name: 'Updated name',
    });

    const resource = await repository.update('res-1', { name: 'Updated name' });

    expect(mockGraphQLClient.updateResource).toHaveBeenCalledWith({
      id: 'res-1',
      name: 'Updated name',
    });
    expect(resource.name).toBe('Updated name');
  });

  it('deletes a resource', async () => {
    mockGraphQLClient.deleteResource.mockResolvedValue(rawResource);

    const resource = await repository.delete('res-1');

    expect(mockGraphQLClient.deleteResource).toHaveBeenCalledWith('res-1');
    expect(resource.id).toBe('res-1');
  });
});
