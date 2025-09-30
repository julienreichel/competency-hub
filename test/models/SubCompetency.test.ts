import { describe, expect, it } from 'vitest';
import { CompetencyResource } from '../../src/models/CompetencyResource';
import { Evaluation } from '../../src/models/Evaluation';
import { StudentSubCompetencyProgress } from '../../src/models/StudentSubCompetencyProgress';
import { SubCompetency, type AmplifySubCompetency } from '../../src/models/SubCompetency';
import { User, UserRole } from '../../src/models/User';

describe('SubCompetency model', () => {
  const baseInit = {
    id: 'sub-1',
    competencyId: 'comp-1',
    name: 'Linear Equations',
    description: 'Solve linear equations',
    objectives: 'Understand and solve',
    level: 1,
    resources: [
      new CompetencyResource({
        id: 'res-1',
        subCompetencyId: 'sub-1',
        type: 'Link',
        name: 'Tutorial',
        url: 'https://example.com',
      }),
    ],
    evaluations: [
      new Evaluation({
        id: 'eval-1',
        subCompetencyId: 'sub-1',
        name: 'Quiz',
        mode: 'Solo',
        format: 'Experiment',
      }),
    ],
    studentProgress: [
      new StudentSubCompetencyProgress({
        id: 'sp-1',
        studentId: 'stu-1',
        subCompetencyId: 'sub-1',
        status: 'InProgress',
        percent: 50,
        lockOverride: 'Unlocked',
        recommended: false,
        updatedAt: null,
      }),
    ],
  };

  it('constructs with nested resources, evaluations, and progress', () => {
    const sub = new SubCompetency(baseInit);
    expect(sub.name).toBe('Linear Equations');
    expect(sub.resources[0]).toBeInstanceOf(CompetencyResource);
    expect(sub.evaluations[0]).toBeInstanceOf(Evaluation);
    expect(sub.studentProgress[0]).toBeInstanceOf(StudentSubCompetencyProgress);
  });

  it('validates name presence', () => {
    expect(() => new SubCompetency({ ...baseInit, name: '' })).toThrow(
      'Sub-competency name is required',
    );
  });

  it('clones deeply', () => {
    const sub = new SubCompetency(baseInit);
    const clone = sub.clone();
    expect(clone).not.toBe(sub);
    expect(clone.resources[0]).not.toBe(sub.resources[0]);
    expect(clone.evaluations[0]).not.toBe(sub.evaluations[0]);
    expect(clone.studentProgress[0]).not.toBe(sub.studentProgress[0]);
    expect(clone.toJSON()).toStrictEqual(sub.toJSON());
  });

  it('fromAmplify maps all fields and nested collections', () => {
    const amplify = {
      id: 'sub-amp',
      competencyId: 'comp-amp',
      name: 'Amplify Sub',
      description: 'desc',
      objectives: 'obj',
      level: 2,
      resources: [
        { id: 'res-amp', subCompetencyId: 'sub-amp', type: 'Link', name: 'Doc', url: 'url' },
      ],
      evaluations: [
        {
          id: 'eval-amp',
          subCompetencyId: 'sub-amp',
          name: 'Eval',
          mode: 'Solo',
          format: 'Experiment',
        },
      ],
      studentProgress: [
        {
          id: 'sp-amp',
          studentId: 'stu-amp',
          subCompetencyId: 'sub-amp',
          status: 'Validated',
          percent: 100,
          lockOverride: 'Unlocked',
          recommended: true,
          updatedAt: null,
        },
      ],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };
    const sub = SubCompetency.fromAmplify(amplify as unknown as AmplifySubCompetency);
    expect(sub.id).toBe('sub-amp');
    expect(sub.resources[0]).toBeInstanceOf(CompetencyResource);
    expect(sub.evaluations[0]).toBeInstanceOf(Evaluation);
    expect(sub.studentProgress[0]).toBeInstanceOf(StudentSubCompetencyProgress);
    expect(sub.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(sub.updatedAt).toBe('2024-01-02T00:00:00Z');
  });

  it('attachUserProgress filters and creates progress for students', () => {
    const sub = new SubCompetency({ ...baseInit, studentProgress: [] });
    const user = new User({
      id: 'stu-2',
      name: 'Bob',
      role: UserRole.STUDENT,
      email: 'bob@example.com',
      studentProgress: [
        new StudentSubCompetencyProgress({
          id: 'sp-x',
          studentId: 'stu-2',
          subCompetencyId: 'sub-1',
          status: 'PendingValidation',
          percent: 0,
          lockOverride: 'Unlocked',
          recommended: false,
          updatedAt: null,
        }),
        new StudentSubCompetencyProgress({
          id: 'sp-y',
          studentId: 'stu-2',
          subCompetencyId: 'other',
          status: 'Validated',
          percent: 100,
          lockOverride: 'Unlocked',
          recommended: false,
          updatedAt: null,
        }),
      ],
    });
    sub.attachUserProgress(user);
    expect(sub.studentProgress).toHaveLength(1);
    expect(sub.studentProgress[0]?.subCompetencyId).toBe('sub-1');
    // If no progress, creates default for student
    const sub2 = new SubCompetency({ ...baseInit, id: 'sub-2', studentProgress: [] });
    const user2 = new User({
      id: 'stu-3',
      name: 'Alice',
      role: UserRole.STUDENT,
      email: 'alice@example.com',
      studentProgress: [],
    });
    sub2.attachUserProgress(user2);
    expect(sub2.studentProgress).toHaveLength(1);
    expect(sub2.studentProgress[0]?.studentId).toBe('stu-3');
    expect(sub2.studentProgress[0]?.subCompetencyId).toBe('sub-2');
    expect(sub2.studentProgress[0]?.status).toBe('NotStarted');
  });

  it('getStatus returns correct status for all cases', () => {
    // Locked if no progress
    const sub1 = new SubCompetency({ ...baseInit, studentProgress: [] });
    expect(sub1.getStatus()).toBe('Locked');
    // Locked if lockOverride is Locked
    const spLocked = new StudentSubCompetencyProgress({
      id: 'sp-locked',
      studentId: 'stu-locked',
      subCompetencyId: 'sub-1',
      status: 'InProgress',
      percent: 50,
      lockOverride: 'Locked',
      recommended: false,
      updatedAt: null,
    });
    const sub2 = new SubCompetency({ ...baseInit, studentProgress: [spLocked] });
    expect(sub2.getStatus()).toBe('Locked');
    // Otherwise, returns status
    const spValidated = new StudentSubCompetencyProgress({
      id: 'sp-validated',
      studentId: 'stu-validated',
      subCompetencyId: 'sub-1',
      status: 'Validated',
      percent: 100,
      lockOverride: 'Unlocked',
      recommended: false,
      updatedAt: null,
    });
    const sub4 = new SubCompetency({ ...baseInit, studentProgress: [spValidated] });
    expect(sub4.getStatus()).toBe('Validated');
  });

  it('toJSON outputs all fields and nested arrays', () => {
    const sub = new SubCompetency(baseInit);
    const json = sub.toJSON();
    expect(json.id).toBe(baseInit.id);
    expect(Array.isArray(json.resources)).toBe(true);
    expect(Array.isArray(json.evaluations)).toBe(true);
    expect(Array.isArray(json.studentProgress)).toBe(true);
  });
});
