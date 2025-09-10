import { describe, it, expect } from 'vitest';
import { Competency, CompetencyStatus } from '../../src/models/Competency';

describe('Competency Model', () => {
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

  describe('constructor', () => {
    it('should create a valid competency instance', () => {
      const competency = new Competency(validCompetencyData);
      
      expect(competency.id).toBe('comp-1');
      expect(competency.domain).toBe('Mathematics');
      expect(competency.subDomain).toBe('Algebra');
      expect(competency.description).toBe('Basic algebraic operations');
      expect(competency.stage).toBe('Elementary');
      expect(competency.status).toBe(CompetencyStatus.UNLOCKED);
      expect(competency.createdAt).toBe('2023-01-01T00:00:00Z');
      expect(competency.updatedAt).toBe('2023-01-01T00:00:00Z');
    });

    it('should create competency without optional timestamps', () => {
      const competencyDataWithoutTimestamps = {
        id: 'comp-2',
        domain: 'Science',
        subDomain: 'Biology',
        description: 'Basic biology concepts',
        stage: 'Middle School',
        status: CompetencyStatus.LOCKED,
      };

      const competency = new Competency(competencyDataWithoutTimestamps);
      
      expect(competency.id).toBe('comp-2');
      expect(competency.createdAt).toBeUndefined();
      expect(competency.updatedAt).toBeUndefined();
    });

    it('should throw error for empty domain', () => {
      const invalidData = { ...validCompetencyData, domain: '' };
      
      expect(() => new Competency(invalidData)).toThrow('Competency domain is required');
    });

    it('should throw error for whitespace-only domain', () => {
      const invalidData = { ...validCompetencyData, domain: '   ' };
      
      expect(() => new Competency(invalidData)).toThrow('Competency domain is required');
    });

    it('should throw error for empty sub-domain', () => {
      const invalidData = { ...validCompetencyData, subDomain: '' };
      
      expect(() => new Competency(invalidData)).toThrow('Competency sub-domain is required');
    });

    it('should throw error for empty description', () => {
      const invalidData = { ...validCompetencyData, description: '' };
      
      expect(() => new Competency(invalidData)).toThrow('Competency description is required');
    });

    it('should throw error for empty stage', () => {
      const invalidData = { ...validCompetencyData, stage: '' };
      
      expect(() => new Competency(invalidData)).toThrow('Competency stage is required');
    });

    it('should throw error for invalid status', () => {
      const invalidData = { ...validCompetencyData, status: 'INVALID_STATUS' as CompetencyStatus };
      
      expect(() => new Competency(invalidData)).toThrow('Invalid competency status');
    });
  });

  describe('status checking methods', () => {
    it('should correctly identify locked status', () => {
      const competency = new Competency({ ...validCompetencyData, status: CompetencyStatus.LOCKED });
      
      expect(competency.isLocked()).toBe(true);
      expect(competency.isUnlocked()).toBe(false);
      expect(competency.isInProgress()).toBe(false);
      expect(competency.isAcquired()).toBe(false);
      expect(competency.isAvailable()).toBe(false);
    });

    it('should correctly identify unlocked status', () => {
      const competency = new Competency({ ...validCompetencyData, status: CompetencyStatus.UNLOCKED });
      
      expect(competency.isLocked()).toBe(false);
      expect(competency.isUnlocked()).toBe(true);
      expect(competency.isInProgress()).toBe(false);
      expect(competency.isAcquired()).toBe(false);
      expect(competency.isAvailable()).toBe(true);
    });

    it('should correctly identify in-progress status', () => {
      const competency = new Competency({ ...validCompetencyData, status: CompetencyStatus.IN_PROGRESS });
      
      expect(competency.isLocked()).toBe(false);
      expect(competency.isUnlocked()).toBe(false);
      expect(competency.isInProgress()).toBe(true);
      expect(competency.isAcquired()).toBe(false);
      expect(competency.isAvailable()).toBe(true);
    });

    it('should correctly identify acquired status', () => {
      const competency = new Competency({ ...validCompetencyData, status: CompetencyStatus.ACQUIRED });
      
      expect(competency.isLocked()).toBe(false);
      expect(competency.isUnlocked()).toBe(false);
      expect(competency.isInProgress()).toBe(false);
      expect(competency.isAcquired()).toBe(true);
      expect(competency.isAvailable()).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('should return correct full name', () => {
      const competency = new Competency(validCompetencyData);
      
      expect(competency.getFullName()).toBe('Mathematics > Algebra');
    });

    it('should return correct progress percentage for each status', () => {
      const testCases = [
        { status: CompetencyStatus.LOCKED, expected: 0 },
        { status: CompetencyStatus.UNLOCKED, expected: 25 },
        { status: CompetencyStatus.IN_PROGRESS, expected: 50 },
        { status: CompetencyStatus.ACQUIRED, expected: 100 },
      ];

      testCases.forEach(({ status, expected }) => {
        const competency = new Competency({ ...validCompetencyData, status });
        expect(competency.getProgressPercentage()).toBe(expected);
      });
    });

    it('should return correct status labels', () => {
      const testCases = [
        { status: CompetencyStatus.LOCKED, expected: 'Locked' },
        { status: CompetencyStatus.UNLOCKED, expected: 'Available' },
        { status: CompetencyStatus.IN_PROGRESS, expected: 'In Progress' },
        { status: CompetencyStatus.ACQUIRED, expected: 'Acquired' },
      ];

      testCases.forEach(({ status, expected }) => {
        const competency = new Competency({ ...validCompetencyData, status });
        expect(competency.getStatusLabel()).toBe(expected);
      });
    });
  });

  describe('transitionToNext method', () => {
    it('should transition from locked to unlocked', () => {
      const competency = new Competency({ ...validCompetencyData, status: CompetencyStatus.LOCKED });
      const nextCompetency = competency.transitionToNext();
      
      expect(nextCompetency.status).toBe(CompetencyStatus.UNLOCKED);
      expect(nextCompetency.id).toBe(competency.id); // other properties preserved
      expect(nextCompetency.domain).toBe(competency.domain);
    });

    it('should transition from unlocked to in-progress', () => {
      const competency = new Competency({ ...validCompetencyData, status: CompetencyStatus.UNLOCKED });
      const nextCompetency = competency.transitionToNext();
      
      expect(nextCompetency.status).toBe(CompetencyStatus.IN_PROGRESS);
    });

    it('should transition from in-progress to acquired', () => {
      const competency = new Competency({ ...validCompetencyData, status: CompetencyStatus.IN_PROGRESS });
      const nextCompetency = competency.transitionToNext();
      
      expect(nextCompetency.status).toBe(CompetencyStatus.ACQUIRED);
    });

    it('should throw error when trying to transition acquired competency', () => {
      const competency = new Competency({ ...validCompetencyData, status: CompetencyStatus.ACQUIRED });
      
      expect(() => competency.transitionToNext()).toThrow('Competency is already acquired');
    });

    it('should preserve all other properties during transition', () => {
      const competency = new Competency(validCompetencyData);
      const nextCompetency = competency.transitionToNext();
      
      expect(nextCompetency.id).toBe(competency.id);
      expect(nextCompetency.domain).toBe(competency.domain);
      expect(nextCompetency.subDomain).toBe(competency.subDomain);
      expect(nextCompetency.description).toBe(competency.description);
      expect(nextCompetency.stage).toBe(competency.stage);
      expect(nextCompetency.createdAt).toBe(competency.createdAt);
      expect(nextCompetency.updatedAt).toBe(competency.updatedAt);
    });
  });

  describe('update method', () => {
    it('should create updated competency instance', () => {
      const competency = new Competency(validCompetencyData);
      const updatedCompetency = competency.update({ domain: 'Science', status: CompetencyStatus.ACQUIRED });
      
      expect(updatedCompetency.domain).toBe('Science');
      expect(updatedCompetency.status).toBe(CompetencyStatus.ACQUIRED);
      expect(updatedCompetency.subDomain).toBe(validCompetencyData.subDomain); // unchanged
      expect(updatedCompetency.id).toBe(validCompetencyData.id); // unchanged
    });

    it('should handle single field updates', () => {
      const competency = new Competency(validCompetencyData);
      const updatedCompetency = competency.update({ description: 'Advanced algebraic operations' });
      
      expect(updatedCompetency.description).toBe('Advanced algebraic operations');
      expect(updatedCompetency.domain).toBe(validCompetencyData.domain); // unchanged
    });

    it('should preserve timestamps in updates', () => {
      const competency = new Competency(validCompetencyData);
      const updatedCompetency = competency.update({ domain: 'Science' });
      
      expect(updatedCompetency.createdAt).toBe(validCompetencyData.createdAt);
      expect(updatedCompetency.updatedAt).toBe(validCompetencyData.updatedAt);
    });

    it('should validate updated data', () => {
      const competency = new Competency(validCompetencyData);
      
      expect(() => competency.update({ domain: '' })).toThrow('Competency domain is required');
      expect(() => competency.update({ subDomain: '' })).toThrow('Competency sub-domain is required');
      expect(() => competency.update({ description: '' })).toThrow('Competency description is required');
    });
  });

  describe('clone method', () => {
    it('should create identical copy', () => {
      const competency = new Competency(validCompetencyData);
      const clonedCompetency = competency.clone();
      
      expect(clonedCompetency.equals(competency)).toBe(true);
      expect(clonedCompetency).not.toBe(competency); // different instances
      expect(clonedCompetency.id).toBe(competency.id);
      expect(clonedCompetency.domain).toBe(competency.domain);
      expect(clonedCompetency.status).toBe(competency.status);
    });

    it('should handle competency without timestamps', () => {
      const competencyDataWithoutTimestamps = {
        id: 'comp-2',
        domain: 'Science',
        subDomain: 'Biology',
        description: 'Basic biology concepts',
        stage: 'Middle School',
        status: CompetencyStatus.LOCKED,
      };

      const competency = new Competency(competencyDataWithoutTimestamps);
      const clonedCompetency = competency.clone();
      
      expect(clonedCompetency.equals(competency)).toBe(true);
      expect(clonedCompetency.createdAt).toBeUndefined();
      expect(clonedCompetency.updatedAt).toBeUndefined();
    });
  });

  describe('toJSON method', () => {
    it('should return complete object representation', () => {
      const competency = new Competency(validCompetencyData);
      const json = competency.toJSON();
      
      expect(json).toEqual({
        id: 'comp-1',
        domain: 'Mathematics',
        subDomain: 'Algebra',
        description: 'Basic algebraic operations',
        stage: 'Elementary',
        status: CompetencyStatus.UNLOCKED,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      });
    });

    it('should handle undefined timestamps', () => {
      const competencyDataWithoutTimestamps = {
        id: 'comp-2',
        domain: 'Science',
        subDomain: 'Biology',
        description: 'Basic biology concepts',
        stage: 'Middle School',
        status: CompetencyStatus.LOCKED,
      };

      const competency = new Competency(competencyDataWithoutTimestamps);
      const json = competency.toJSON();
      
      expect(json.createdAt).toBeUndefined();
      expect(json.updatedAt).toBeUndefined();
    });
  });

  describe('equals method', () => {
    it('should return true for competencies with same ID', () => {
      const competency1 = new Competency(validCompetencyData);
      const competency2 = new Competency({ ...validCompetencyData, domain: 'Different Domain' });
      
      expect(competency1.equals(competency2)).toBe(true);
    });

    it('should return false for competencies with different IDs', () => {
      const competency1 = new Competency(validCompetencyData);
      const competency2 = new Competency({ ...validCompetencyData, id: 'different-id' });
      
      expect(competency1.equals(competency2)).toBe(false);
    });
  });

  describe('status transitions edge cases', () => {
    it('should handle multiple transitions correctly', () => {
      let competency = new Competency({ ...validCompetencyData, status: CompetencyStatus.LOCKED });
      
      // LOCKED -> UNLOCKED
      competency = competency.transitionToNext();
      expect(competency.status).toBe(CompetencyStatus.UNLOCKED);
      
      // UNLOCKED -> IN_PROGRESS
      competency = competency.transitionToNext();
      expect(competency.status).toBe(CompetencyStatus.IN_PROGRESS);
      
      // IN_PROGRESS -> ACQUIRED
      competency = competency.transitionToNext();
      expect(competency.status).toBe(CompetencyStatus.ACQUIRED);
      
      // ACQUIRED -> Error
      expect(() => competency.transitionToNext()).toThrow('Competency is already acquired');
    });
  });
});
