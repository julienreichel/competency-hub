import { describe, expect, it } from 'vitest';
import {
  StudentSubCompetencyProgress,
  type StudentSubCompetencyProgressInit,
  type AmplifyStudentSubCompetencyProgress,
} from '../../src/models/StudentSubCompetencyProgress';
import { User } from '../../src/models/User';

const baseInit: StudentSubCompetencyProgressInit = {
  id: 'progress-1',
  studentId: 'student-1',
  subCompetencyId: 'sub-1',
  status: 'InProgress',
  percent: 50,
  lockOverride: 'Unlocked',
  recommended: false,
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('StudentSubCompetencyProgress', () => {
  describe('constructor/validate', () => {
    it('creates an instance with defaults when optional fields omitted', () => {
      const progress = new StudentSubCompetencyProgress({
        id: baseInit.id,
        studentId: baseInit.studentId,
        subCompetencyId: baseInit.subCompetencyId,
        status: baseInit.status,
        percent: baseInit.percent,
        updatedAt: null,
      });

      expect(progress.lockOverride).toBeNull();
      expect(progress.recommended).toBeNull();
      expect(progress.student).toBeNull();
      expect(progress.local).toBe(false);
    });

    it('throws when required fields missing', () => {
      expect(
        () =>
          new StudentSubCompetencyProgress({
            ...baseInit,
            studentId: '',
          }),
      ).toThrow('studentId is required');
      expect(
        () =>
          new StudentSubCompetencyProgress({
            ...baseInit,
            studentId: 'student-1',
            subCompetencyId: '',
          }),
      ).toThrow('subCompetencyId is required');
      expect(
        () =>
          new StudentSubCompetencyProgress({
            ...baseInit,
            percent: undefined as unknown as number,
          }),
      ).toThrow('percent is required');
    });

    it('accepts local flag to mark unsaved progress', () => {
      const progress = new StudentSubCompetencyProgress(baseInit, true);
      expect(progress.local).toBe(true);
    });
  });

  describe('fromAmplify', () => {
    it('creates instance from amplify payload including nested student', () => {
      const raw = {
        ...baseInit,
        student: {
          id: 'student-1',
          name: 'Alice',
          role: 'Student',
          email: 'alice@example.com',
        },
      } as AmplifyStudentSubCompetencyProgress;

      const result = StudentSubCompetencyProgress.fromAmplify(raw);

      expect(result).toBeInstanceOf(StudentSubCompetencyProgress);
      expect(result.student).toBeInstanceOf(User);
      expect(result.student?.id).toBe('student-1');
      expect(result.percent).toBe(50);
    });
  });

  describe('clone', () => {
    it('returns a deep copy preserving data', () => {
      const original = new StudentSubCompetencyProgress(baseInit);
      const copy = original.clone();

      expect(copy).not.toBe(original);
      expect(copy).toBeInstanceOf(StudentSubCompetencyProgress);
      expect(copy.id).toBe(original.id);
      expect(copy.studentId).toBe(original.studentId);
    });
  });
});
