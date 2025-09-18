import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Domain } from '../../src/models/Domain';
import { graphQLClient } from '../../src/models/base/GraphQLClient';
import { DomainRepository } from '../../src/models/repositories/DomainRepository';

const mockGraphQLClient = graphQLClient as unknown as {
  createDomain: ReturnType<typeof vi.fn>;
  getDomain: ReturnType<typeof vi.fn>;
  getDomainWithHierarchy: ReturnType<typeof vi.fn>;
  listDomains: ReturnType<typeof vi.fn>;
  updateDomain: ReturnType<typeof vi.fn>;
  deleteDomain: ReturnType<typeof vi.fn>;
};

vi.mock('../../src/models/base/GraphQLClient', () => ({
  graphQLClient: {
    createDomain: vi.fn(),
    getDomain: vi.fn(),
    getDomainWithHierarchy: vi.fn(),
    listDomains: vi.fn(),
    updateDomain: vi.fn(),
    deleteDomain: vi.fn(),
  },
}));

describe('DomainRepository', () => {
  let repository: DomainRepository;

  const rawDomain = {
    id: 'domain-1',
    name: 'Mathematics',
    colorCode: '#FF0000',
    competencies: [],
  };

  beforeEach(() => {
    repository = new DomainRepository();
    vi.clearAllMocks();
  });

  it('creates a new domain', async () => {
    mockGraphQLClient.createDomain.mockResolvedValue(rawDomain);

    const result = await repository.create({ name: 'Mathematics', colorCode: '#FF0000' });

    expect(mockGraphQLClient.createDomain).toHaveBeenCalledWith({
      name: 'Mathematics',
      colorCode: '#FF0000',
    });
    expect(result).toBeInstanceOf(Domain);
    expect(result.name).toBe('Mathematics');
  });

  it('finds a domain by id', async () => {
    mockGraphQLClient.getDomain.mockResolvedValue(rawDomain);

    const domain = await repository.findById('domain-1');

    expect(mockGraphQLClient.getDomain).toHaveBeenCalledWith('domain-1');
    expect(domain?.name).toBe('Mathematics');
  });

  it('fetches domain hierarchy when requested', async () => {
    const domainWithCompetencies = {
      ...rawDomain,
      competencies: [
        {
          id: 'comp-1',
          domainId: 'domain-1',
          name: 'Algebra',
          subCompetencies: [],
        },
      ],
    };
    mockGraphQLClient.getDomainWithHierarchy.mockResolvedValue(domainWithCompetencies);

    const domain = await repository.findById('domain-1', true);

    expect(mockGraphQLClient.getDomainWithHierarchy).toHaveBeenCalledWith('domain-1');
    expect(domain?.competencies).toHaveLength(1);
  });

  it('lists all domains', async () => {
    mockGraphQLClient.listDomains.mockResolvedValue([rawDomain]);

    const domains = await repository.findAll();

    expect(mockGraphQLClient.listDomains).toHaveBeenCalledWith(undefined);
    expect(domains).toHaveLength(1);
  });

  it('updates a domain', async () => {
    mockGraphQLClient.updateDomain.mockResolvedValue({ ...rawDomain, colorCode: '#00FF00' });

    const domain = await repository.update('domain-1', { colorCode: '#00FF00' });

    expect(mockGraphQLClient.updateDomain).toHaveBeenCalledWith({
      id: 'domain-1',
      colorCode: '#00FF00',
    });
    expect(domain.colorCode).toBe('#00FF00');
  });

  it('deletes a domain', async () => {
    mockGraphQLClient.deleteDomain.mockResolvedValue(rawDomain);

    const domain = await repository.delete('domain-1');

    expect(mockGraphQLClient.deleteDomain).toHaveBeenCalledWith('domain-1');
    expect(domain.id).toBe('domain-1');
  });
});
