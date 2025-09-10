import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompetencyRepository } from '../../src/models/repositories/CompetencyRepository';
import { Competency, CompetencyStatus } from '../../src/models/Competency';
import { graphQLClient } from '../../src/models/base/GraphQLClient';

// Mock the GraphQL client
vi.mock('../../src/models/base/GraphQLClient', () => ({
  graphQLClient: {
    createCompetency: vi.fn(),
    getCompetency: vi.fn(),
    listCompetencies: vi.fn(),
    updateCompetency: vi.fn(),
    deleteCompetency: vi.fn(),
  },
}));

describe('CompetencyRepository', () => {
  let competencyRepository: CompetencyRepository;
  const mockGraphQLClient = graphQLClient as unknown as {
    createCompetency: ReturnType<typeof vi.fn>;
    getCompetency: ReturnType<typeof vi.fn>;
    listCompetencies: ReturnType<typeof vi.fn>;
    updateCompetency: ReturnType<typeof vi.fn>;
    deleteCompetency: ReturnType<typeof vi.fn>;
  };

  const validCompetencyData = {
    id: 'comp-1',
    domain: 'Mathematics',
    subDomain: 'Algebra',
    description: 'Basic algebraic operations',
    stage: 'Elementary',
    status: CompetencyStatus.UNLOCKED,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const createCompetencyData = {
    domain: 'Science',
    subDomain: 'Physics',
    description: 'Basic physics concepts',
    stage: 'Middle School',
    status: CompetencyStatus.LOCKED,
  };

  beforeEach(() => {
    competencyRepository = new CompetencyRepository();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create competency and return Competency instance', async () => {
      mockGraphQLClient.createCompetency.mockResolvedValue(validCompetencyData);

      const result = await competencyRepository.create(createCompetencyData);

      expect(mockGraphQLClient.createCompetency).toHaveBeenCalledWith(createCompetencyData);
      expect(result).toBeInstanceOf(Competency);
      expect(result?.id).toBe('comp-1');
      expect(result?.domain).toBe('Mathematics');
    });

    it('should return null when creation fails', async () => {
      mockGraphQLClient.createCompetency.mockResolvedValue(null);

      await expect(competencyRepository.create(createCompetencyData)).rejects.toThrow('Failed to create competency');
    });

    it('should handle creation errors', async () => {
      const error = new Error('Creation failed');
      mockGraphQLClient.createCompetency.mockRejectedValue(error);

      await expect(competencyRepository.create(createCompetencyData)).rejects.toThrow('Creation failed');
    });
  });

  describe('findById', () => {
    it('should find competency by id and return Competency instance', async () => {
      mockGraphQLClient.getCompetency.mockResolvedValue(validCompetencyData);

      const result = await competencyRepository.findById('comp-1');

      expect(mockGraphQLClient.getCompetency).toHaveBeenCalledWith('comp-1');
      expect(result).toBeInstanceOf(Competency);
      expect(result?.id).toBe('comp-1');
    });

    it('should return null when competency not found', async () => {
      mockGraphQLClient.getCompetency.mockResolvedValue(null);

      const result = await competencyRepository.findById('non-existent');

      expect(result).toBeNull();
      expect(mockGraphQLClient.getCompetency).toHaveBeenCalledWith('non-existent');
    });

    it('should handle find errors', async () => {
      const error = new Error('Find failed');
      mockGraphQLClient.getCompetency.mockRejectedValue(error);

      await expect(competencyRepository.findById('comp-1')).rejects.toThrow('Find failed');
    });
  });

  describe('findAll', () => {
    it('should find all competencies and return Competency instances', async () => {
      const competenciesData = [validCompetencyData, { ...validCompetencyData, id: 'comp-2', domain: 'Science' }];
      mockGraphQLClient.listCompetencies.mockResolvedValue(competenciesData);

      const result = await competencyRepository.findAll();

      expect(mockGraphQLClient.listCompetencies).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Competency);
      expect(result[1]).toBeInstanceOf(Competency);
      expect(result[0]?.id).toBe('comp-1');
      expect(result[1]?.id).toBe('comp-2');
    });

    it('should find competencies with filter', async () => {
      const filter = { domain: { eq: 'Mathematics' } };
      mockGraphQLClient.listCompetencies.mockResolvedValue([validCompetencyData]);

      const result = await competencyRepository.findAll(filter);

      expect(mockGraphQLClient.listCompetencies).toHaveBeenCalledWith(filter);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Competency);
    });

    it('should return empty array when no competencies found', async () => {
      mockGraphQLClient.listCompetencies.mockResolvedValue([]);

      const result = await competencyRepository.findAll();

      expect(result).toEqual([]);
    });

    it('should handle list errors', async () => {
      const error = new Error('List failed');
      mockGraphQLClient.listCompetencies.mockRejectedValue(error);

      await expect(competencyRepository.findAll()).rejects.toThrow('List failed');
    });
  });

  describe('findByDomain', () => {
    it('should find competencies by domain', async () => {
      const mathCompetencies = [validCompetencyData, { ...validCompetencyData, id: 'comp-2' }];
      mockGraphQLClient.listCompetencies.mockResolvedValue(mathCompetencies);

      const result = await competencyRepository.findByDomain('Mathematics');

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('comp-1');
      expect(result[1]?.id).toBe('comp-2');
      expect(mockGraphQLClient.listCompetencies).toHaveBeenCalledWith({ domain: { eq: 'Mathematics' } });
    });

    it('should return empty array when no competencies found for domain', async () => {
      mockGraphQLClient.listCompetencies.mockResolvedValue([]);

      const result = await competencyRepository.findByDomain('Physics');

      expect(result).toEqual([]);
      expect(mockGraphQLClient.listCompetencies).toHaveBeenCalledWith({ domain: { eq: 'Physics' } });
    });
  });

  describe('findByStatus', () => {
    it('should find competencies by status', async () => {
      const unlockedCompetencies = [validCompetencyData];
      mockGraphQLClient.listCompetencies.mockResolvedValue(unlockedCompetencies);

      const result = await competencyRepository.findByStatus(CompetencyStatus.UNLOCKED);

      expect(result).toHaveLength(1);
      expect(result[0]?.status).toBe(CompetencyStatus.UNLOCKED);
      expect(mockGraphQLClient.listCompetencies).toHaveBeenCalledWith({ status: { eq: CompetencyStatus.UNLOCKED } });
    });

    it('should find acquired competencies', async () => {
      const acquiredCompetency = { ...validCompetencyData, status: CompetencyStatus.ACQUIRED };
      mockGraphQLClient.listCompetencies.mockResolvedValue([acquiredCompetency]);

      const result = await competencyRepository.findByStatus(CompetencyStatus.ACQUIRED);

      expect(result).toHaveLength(1);
      expect(result[0]?.status).toBe(CompetencyStatus.ACQUIRED);
    });
  });

  describe('findByStage', () => {
    it('should find competencies by stage', async () => {
      const elementaryCompetencies = [validCompetencyData];
      mockGraphQLClient.listCompetencies.mockResolvedValue(elementaryCompetencies);

      const result = await competencyRepository.findByStage('Elementary');

      expect(result).toHaveLength(1);
      expect(result[0]?.stage).toBe('Elementary');
      expect(mockGraphQLClient.listCompetencies).toHaveBeenCalledWith({ stage: { eq: 'Elementary' } });
    });
  });

  describe('update', () => {
    it('should update competency and return updated Competency instance', async () => {
      const updatedData = { ...validCompetencyData, description: 'Advanced algebraic operations' };
      mockGraphQLClient.updateCompetency.mockResolvedValue(updatedData);

      const result = await competencyRepository.update('comp-1', { description: 'Advanced algebraic operations' });

      expect(mockGraphQLClient.updateCompetency).toHaveBeenCalledWith('comp-1', { description: 'Advanced algebraic operations' });
      expect(result).toBeInstanceOf(Competency);
      expect(result?.description).toBe('Advanced algebraic operations');
    });

    it('should return null when update fails', async () => {
      mockGraphQLClient.updateCompetency.mockResolvedValue(null);

      await expect(competencyRepository.update('comp-1', { description: 'New description' })).rejects.toThrow('Failed to update competency comp-1');
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      mockGraphQLClient.updateCompetency.mockRejectedValue(error);

      await expect(competencyRepository.update('comp-1', { description: 'New description' })).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete competency successfully', async () => {
      mockGraphQLClient.deleteCompetency.mockResolvedValue(validCompetencyData);

      const result = await competencyRepository.delete('comp-1');

      expect(mockGraphQLClient.deleteCompetency).toHaveBeenCalledWith('comp-1');
      expect(result).toBeInstanceOf(Competency);
      expect(result.id).toBe('comp-1');
    });

    it('should return false when deletion fails', async () => {
      mockGraphQLClient.deleteCompetency.mockResolvedValue(null);

      await expect(competencyRepository.delete('comp-1')).rejects.toThrow('Failed to delete competency comp-1');
    });

    it('should handle deletion errors', async () => {
      const error = new Error('Deletion failed');
      mockGraphQLClient.deleteCompetency.mockRejectedValue(error);

      await expect(competencyRepository.delete('comp-1')).rejects.toThrow('Deletion failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null responses gracefully', async () => {
      mockGraphQLClient.listCompetencies.mockResolvedValue(null);

      const result = await competencyRepository.findAll();

      expect(result).toEqual([]);
    });

    it('should handle undefined responses gracefully', async () => {
      mockGraphQLClient.listCompetencies.mockResolvedValue(undefined);

      const result = await competencyRepository.findAll();

      expect(result).toEqual([]);
    });

    it('should filter out null competencies from list results', async () => {
      const mixedResults = [validCompetencyData, null, { ...validCompetencyData, id: 'comp-2' }];
      mockGraphQLClient.listCompetencies.mockResolvedValue(mixedResults);

      const result = await competencyRepository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('comp-1');
      expect(result[1]?.id).toBe('comp-2');
    });
  });

  describe('Business Logic Integration', () => {
    it('should work with competency status transitions', async () => {
      const lockedCompetency = { ...validCompetencyData, status: CompetencyStatus.LOCKED };
      const unlockedCompetency = { ...validCompetencyData, status: CompetencyStatus.UNLOCKED };
      
      mockGraphQLClient.getCompetency.mockResolvedValue(lockedCompetency);
      mockGraphQLClient.updateCompetency.mockResolvedValue(unlockedCompetency);

      const competency = await competencyRepository.findById('comp-1');
      expect(competency?.status).toBe(CompetencyStatus.LOCKED);

      // Simulate unlocking
      const updated = await competencyRepository.update('comp-1', { status: CompetencyStatus.UNLOCKED });
      expect(updated?.status).toBe(CompetencyStatus.UNLOCKED);
    });

    it('should support domain-based competency hierarchies', async () => {
      const mathBasic = { ...validCompetencyData, id: 'math-basic', subDomain: 'Basic Math' };
      const mathAdvanced = { ...validCompetencyData, id: 'math-advanced', subDomain: 'Advanced Math' };
      
      mockGraphQLClient.listCompetencies.mockResolvedValue([mathBasic, mathAdvanced]);

      const mathCompetencies = await competencyRepository.findByDomain('Mathematics');
      
      expect(mathCompetencies).toHaveLength(2);
      expect(mathCompetencies.some(c => c.subDomain === 'Basic Math')).toBe(true);
      expect(mathCompetencies.some(c => c.subDomain === 'Advanced Math')).toBe(true);
    });
  });
});
