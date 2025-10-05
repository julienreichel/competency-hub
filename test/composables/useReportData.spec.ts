import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const findById = vi.fn();
  const getUserById = vi.fn();
  const getCurrentUser = vi.fn();
  return {
    findById,
    getUserById,
    getCurrentUser,
  };
});

vi.mock('src/models/repositories/SubCompetencyRepository', () => ({
  subCompetencyRepository: {
    findById: mocks.findById,
  },
}));

vi.mock('src/composables/useUsers', () => ({
  useUsers: (): unknown => ({
    getUserById: mocks.getUserById,
    getCurrentUser: mocks.getCurrentUser,
  }),
}));

import { useReportData } from 'src/composables/useReportData';
import { Competency } from 'src/models/Competency';
import { Domain } from 'src/models/Domain';
import { StudentSubCompetencyProgress } from 'src/models/StudentSubCompetencyProgress';
import { SubCompetency } from 'src/models/SubCompetency';
import { User, UserRole } from 'src/models/User';

describe('useReportData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const period = {
    startDate: new Date('2024-02-01T00:00:00.000Z'),
    endDate: new Date('2024-02-28T23:59:59.999Z'),
  };

  function createStudentProgress(
    id: string,
    subCompetencyId: string,
    percent: number,
    status: 'NotStarted' | 'InProgress' | 'PendingValidation' | 'Validated',
    updatedAt: string,
  ): StudentSubCompetencyProgress {
    return new StudentSubCompetencyProgress({
      id,
      studentId: 'student-1',
      subCompetencyId,
      status,
      percent,
      lockOverride: 'Unlocked',
      recommended: null,
      updatedAt,
    });
  }

  interface DomainHierarchy {
    domain1: Domain;
    domain2: Domain;
    competency1: Competency;
    competency2: Competency;
    sub1: SubCompetency;
    sub2: SubCompetency;
  }

  function createDomainHierarchy(): DomainHierarchy {
    const domain1 = new Domain({ id: 'dom-1', name: 'Domain One', colorCode: '#336699' });
    const competency1 = new Competency({
      id: 'comp-1',
      name: 'Competency A',
      domainId: domain1.id,
      domain: domain1,
      subCompetencies: [],
    });

    const domain2 = new Domain({ id: 'dom-2', name: 'Domain Two', colorCode: '#884477' });
    const competency2 = new Competency({
      id: 'comp-2',
      name: 'Competency B',
      domainId: domain2.id,
      domain: domain2,
      subCompetencies: [],
    });

    const sub1 = new SubCompetency({
      id: 'sub-1',
      competencyId: competency1.id,
      competency: competency1,
      name: 'Sub One',
      resources: [],
    });

    const sub2 = new SubCompetency({
      id: 'sub-2',
      competencyId: competency2.id,
      competency: competency2,
      name: 'Sub Two',
      resources: [],
    });

    return { domain1, domain2, competency1, competency2, sub1, sub2 };
  }

  it('generates report data with grouped domains and summary metrics', async () => {
    const { sub1, sub2 } = createDomainHierarchy();

    const progress1 = createStudentProgress(
      'progress-1',
      'sub-1',
      80,
      'Validated',
      '2024-02-15T10:00:00.000Z',
    );
    const progress2 = createStudentProgress(
      'progress-2',
      'sub-2',
      30,
      'InProgress',
      '2024-02-18T10:00:00.000Z',
    );

    const student = new User({
      id: 'student-1',
      name: 'Student One',
      role: UserRole.STUDENT,
      email: 'student@example.com',
      studentProgress: [progress1, progress2],
      educators: [],
      parents: [],
      students: [],
      children: [],
      evaluationAttempts: [],
      projects: [],
    });

    const educator = new User({
      id: 'educator-1',
      name: 'Educator',
      role: UserRole.EDUCATOR,
      email: 'educator@example.com',
      studentProgress: [],
      educators: [],
      parents: [],
      students: [],
      children: [],
      evaluationAttempts: [],
      projects: [],
    });

    mocks.getUserById.mockResolvedValue(student);
    mocks.getCurrentUser.mockResolvedValue(educator);
    mocks.findById.mockImplementation((id: string): Promise<SubCompetency | null> => {
      if (id === 'sub-1') return Promise.resolve(sub1);
      if (id === 'sub-2') return Promise.resolve(sub2);
      return Promise.resolve(null);
    });

    const { generateReport, reportData } = useReportData();

    const report = await generateReport('student-1', period, {
      domainFilter: null,
      includeDetails: true,
    });

    expect(report).not.toBeNull();
    expect(reportData.value).not.toBeNull();
    expect(report?.domains).toHaveLength(2);

    const [domainOne, domainTwo] = report!.domains;

    expect(domainOne?.domainName).toBe('Domain One');
    expect(domainOne?.competencies?.[0]?.subCompetencies?.[0]?.newlyAcquired).toBe(true);
    expect(domainTwo?.domainName).toBe('Domain Two');
    expect(domainTwo?.competencies?.[0]?.progressDelta).toBeGreaterThan(0);

    expect(report?.summary.totalDomainsCovered).toBe(2);
    expect(report?.summary.competenciesAdvanced).toBe(2);
    expect(report?.summary.competenciesAcquired).toBe(1);
    expect(report?.summary.totalActivity).toBe(2);
    expect(report?.generatedBy?.id).toBe('educator-1');
  });

  it('applies domain filter when generating report', async () => {
    const { sub1, sub2 } = createDomainHierarchy();
    const progress1 = createStudentProgress(
      'progress-1',
      'sub-1',
      50,
      'Validated',
      '2024-02-10T00:00:00.000Z',
    );
    const progress2 = createStudentProgress(
      'progress-2',
      'sub-2',
      40,
      'InProgress',
      '2024-02-20T00:00:00.000Z',
    );

    const student = new User({
      id: 'student-1',
      name: 'Student One',
      role: UserRole.STUDENT,
      email: 'student@example.com',
      studentProgress: [progress1, progress2],
      educators: [],
      parents: [],
      students: [],
      children: [],
      evaluationAttempts: [],
      projects: [],
    });

    mocks.getUserById.mockResolvedValue(student);
    mocks.getCurrentUser.mockResolvedValue(null);
    mocks.findById.mockImplementation((id: string): Promise<SubCompetency | null> => {
      if (id === 'sub-1') return Promise.resolve(sub1);
      if (id === 'sub-2') return Promise.resolve(sub2);
      return Promise.resolve(null);
    });

    const { generateReport } = useReportData();

    const report = await generateReport('student-1', period, {
      domainFilter: 'Domain One',
      includeDetails: true,
    });

    expect(report?.domains).toHaveLength(1);
    expect(report?.domains?.[0]?.domainName).toBe('Domain One');
  });

  it('reports error when student not found', async () => {
    mocks.getUserById.mockResolvedValue(null);
    mocks.getCurrentUser.mockResolvedValue(null);

    const { generateReport, error } = useReportData();

    const result = await generateReport('missing', period, {
      domainFilter: null,
      includeDetails: true,
    });

    expect(result).toBeNull();
    expect(error.value).toBe('Student not found');
  });

  it('reports error when student has no progress', async () => {
    const student = new User({
      id: 'student-1',
      name: 'Student One',
      role: UserRole.STUDENT,
      email: 'student@example.com',
      studentProgress: [],
      educators: [],
      parents: [],
      students: [],
      children: [],
      evaluationAttempts: [],
      projects: [],
    });

    mocks.getUserById.mockResolvedValue(student);
    mocks.getCurrentUser.mockResolvedValue(null);

    const { generateReport, error } = useReportData();

    const result = await generateReport('student-1', period, {
      domainFilter: null,
      includeDetails: true,
    });

    expect(result).toBeNull();
    expect(error.value).toBe('No progress data found for student');
  });

  it('generates domain summary for a student', async () => {
    const { sub1, sub2 } = createDomainHierarchy();

    const progress1 = createStudentProgress(
      'progress-1',
      'sub-1',
      60,
      'InProgress',
      '2024-02-12T00:00:00.000Z',
    );
    const progress2 = createStudentProgress(
      'progress-2',
      'sub-2',
      90,
      'Validated',
      '2024-02-18T00:00:00.000Z',
    );

    const student = new User({
      id: 'student-1',
      name: 'Student One',
      role: UserRole.STUDENT,
      email: 'student@example.com',
      studentProgress: [progress1, progress2],
      educators: [],
      parents: [],
      students: [],
      children: [],
      evaluationAttempts: [],
      projects: [],
    });

    mocks.findById.mockImplementation((id: string): Promise<SubCompetency | null> => {
      if (id === 'sub-1') return Promise.resolve(sub1);
      if (id === 'sub-2') return Promise.resolve(sub2);
      return Promise.resolve(null);
    });

    const { generateDomainSummary } = useReportData();

    const summary = await generateDomainSummary(student);

    expect(summary).toHaveLength(2);
    expect(summary[0]).toMatchObject({ name: 'Domain One', color: '#336699', progress: 60 });
    expect(summary[1]).toMatchObject({ name: 'Domain Two', color: '#884477', progress: 90 });
  });

  it('returns empty summary when student has no progress', async () => {
    const student = new User({
      id: 'student-1',
      name: 'Student One',
      role: UserRole.STUDENT,
      email: 'student@example.com',
      studentProgress: [],
      educators: [],
      parents: [],
      students: [],
      children: [],
      evaluationAttempts: [],
      projects: [],
    });

    const { generateDomainSummary } = useReportData();

    const summary = await generateDomainSummary(student);

    expect(summary).toEqual([]);
  });
});
