import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { graphQLClient } from '../../src/models/base/GraphQLClient';
import { StudentProgressRepository } from '../../src/models/repositories/StudentProgressRepository';
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
