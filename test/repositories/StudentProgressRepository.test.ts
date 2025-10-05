import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { graphQLClient } from '../../src/models/base/GraphQLClient';
import { StudentProgressRepository } from '../../src/models/repositories/StudentProgressRepository';
import type { ProgressStatus } from '../../src/models/StudentSubCompetencyProgress';
import { StudentSubCompetencyProgress } from '../../src/models/StudentSubCompetencyProgress';

type MockGraphQLClient = {
  createStudentProgress: ReturnType<typeof vi.fn>;
  updateStudentProgress: ReturnType<typeof vi.fn>;
};

vi.mock('../../src/models/base/GraphQLClient', () => ({
  graphQLClient: {
    createStudentProgress: vi.fn(),
    updateStudentProgress: vi.fn(),
  },
}));

describe('StudentProgressRepository', () => {
  const mockClient = graphQLClient as unknown as MockGraphQLClient;
  const mockProgress = {
    id: 'progress-1',
    studentId: 'student-1',
    subCompetencyId: 'sub-1',
    status: 'InProgress',
    percent: 50,
    lockOverride: 'Unlocked',
    recommended: false,
    updatedAt: '2024-01-01T00:00:00.000Z',
    createdAt: '2023-12-31T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createProgress', () => {
    it('creates progress with default values when fields are missing', async () => {
      // Arrange
      mockClient.createStudentProgress.mockResolvedValue(mockProgress);

      // Act
      const result = await StudentProgressRepository.createProgress({
        id: 'progress-1',
        studentId: mockProgress.studentId,
        subCompetencyId: mockProgress.subCompetencyId,
        status: 'NotStarted',
        percent: 0,
        lockOverride: 'Unlocked',
        recommended: false,
        updatedAt: null,
      });

      // Assert
      expect(mockClient.createStudentProgress).toHaveBeenCalledWith({
        studentId: mockProgress.studentId,
        subCompetencyId: mockProgress.subCompetencyId,
        status: 'NotStarted',
        percent: 0,
        lockOverride: 'Unlocked',
        recommended: false,
        updatedAt: new Date().toISOString(),
      });
      expect(result).toBeInstanceOf(StudentSubCompetencyProgress);
      expect(result.id).toBe('progress-1');
    });

    it('passes provided values through to the GraphQL client', async () => {
      // Arrange
      const customProgress = {
        ...mockProgress,
        status: 'InProgress',
        percent: 45,
        lockOverride: 'Locked' as const,
        recommended: true,
      };
      mockClient.createStudentProgress.mockResolvedValue(customProgress);

      // Act
      const result = await StudentProgressRepository.createProgress({
        id: customProgress.id,
        studentId: customProgress.studentId,
        subCompetencyId: customProgress.subCompetencyId,
        status: customProgress.status as ProgressStatus,
        percent: customProgress.percent,
        lockOverride: customProgress.lockOverride,
        recommended: customProgress.recommended,
        updatedAt: null,
      });

      // Assert
      expect(mockClient.createStudentProgress).toHaveBeenCalledWith({
        studentId: customProgress.studentId,
        subCompetencyId: customProgress.subCompetencyId,
        status: customProgress.status,
        percent: customProgress.percent,
        lockOverride: customProgress.lockOverride,
        recommended: customProgress.recommended,
        updatedAt: new Date().toISOString(),
      });
      expect(result.status).toBe('InProgress');
      expect(result.percent).toBe(45);
    });

    it('throws when GraphQL client returns null', async () => {
      // Arrange
      mockClient.createStudentProgress.mockResolvedValue(null);

      // Act & Assert
      await expect(
        StudentProgressRepository.createProgress({
          id: 'progress-1',
          studentId: mockProgress.studentId,
          subCompetencyId: mockProgress.subCompetencyId,
          status: 'NotStarted',
          percent: 0,
          lockOverride: 'Locked',
          recommended: false,
          updatedAt: null,
        }),
      ).rejects.toThrow('Failed to create progress');
    });
  });

  describe('updateProgress', () => {
    it('updates progress with provided fields and timestamp', async () => {
      // Arrange
      const updatedMock = { ...mockProgress, status: 'Validated', percent: 80 };
      mockClient.updateStudentProgress.mockResolvedValue(updatedMock);

      // Act
      const result = await StudentProgressRepository.updateProgress('progress-1', {
        status: 'Validated',
        percent: 80,
      });

      // Assert
      expect(mockClient.updateStudentProgress).toHaveBeenCalledWith({
        id: 'progress-1',
        status: 'Validated',
        percent: 80,
        updatedAt: new Date().toISOString(),
      });
      expect(result).toBeInstanceOf(StudentSubCompetencyProgress);
      expect(result.status).toBe('Validated');
    });

    it('only sends modified fields to the GraphQL client', async () => {
      // Arrange
      const updatedMock = { ...mockProgress, lockOverride: 'Locked' as const };
      mockClient.updateStudentProgress.mockResolvedValue(updatedMock);

      // Act
      await StudentProgressRepository.updateProgress('progress-1', {
        lockOverride: 'Locked',
      });

      // Assert
      expect(mockClient.updateStudentProgress).toHaveBeenCalledWith({
        id: 'progress-1',
        lockOverride: 'Locked',
        updatedAt: new Date().toISOString(),
      });
    });

    it('passes recommended flag changes through the GraphQL client', async () => {
      // Arrange
      const updatedMock = { ...mockProgress, recommended: true };
      mockClient.updateStudentProgress.mockResolvedValue(updatedMock);

      // Act
      const result = await StudentProgressRepository.updateProgress('progress-1', {
        recommended: true,
      });

      // Assert
      expect(mockClient.updateStudentProgress).toHaveBeenCalledWith({
        id: 'progress-1',
        recommended: true,
        updatedAt: new Date().toISOString(),
      });
      expect(result.recommended).toBe(true);
    });

    it('throws when GraphQL client returns null', async () => {
      // Arrange
      mockClient.updateStudentProgress.mockResolvedValue(null);

      // Act & Assert
      await expect(
        StudentProgressRepository.updateProgress('progress-1', { status: 'Validated' }),
      ).rejects.toThrow('Failed to update validation progress-1');
    });
  });
});
