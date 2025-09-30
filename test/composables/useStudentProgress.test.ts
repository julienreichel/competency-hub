import { describe, expect, it, vi } from 'vitest';

import {
  buildPendingValidationRows,
  computeEvaluationStatusSummaries,
  createManagerRows,
  createPendingValidationRow,
  extractPendingProgress,
} from 'src/composables/useStudentProgress';
import { Competency } from 'src/models/Competency';
import { Domain } from 'src/models/Domain';
import { Evaluation, EvaluationFormat, EvaluationMode } from 'src/models/Evaluation';
import { EvaluationAttempt, type EvaluationStatus } from 'src/models/EvaluationAttempt';
import { StudentSubCompetencyProgress } from 'src/models/StudentSubCompetencyProgress';
import { SubCompetency } from 'src/models/SubCompetency';
import { User, UserRole } from 'src/models/User';

const createDomain = (): Domain => new Domain({ id: 'domain-1', name: 'Domain 1' });

const createCompetency = (domain: Domain): Competency =>
  new Competency({ id: 'competency-1', domainId: domain.id, domain, name: 'Competency 1' });

const createEvaluation = (id: string): Evaluation =>
  new Evaluation({
    id,
    subCompetencyId: 'sub-1',
    name: `Evaluation ${id}`,
    mode: EvaluationMode.SOLO,
    format: EvaluationFormat.EXPERIMENT,
  });

const createAttempt = (
  id: string,
  evaluationId: string,
  studentId: string,
  status?: EvaluationStatus,
): EvaluationAttempt =>
  new EvaluationAttempt({
    id,
    evaluationId,
    studentId,
    status: status ?? 'NotStarted',
    completionMode: 'Manual',
  });

const createSubCompetency = (competency: Competency, evaluations: Evaluation[]): SubCompetency =>
  new SubCompetency({
    id: 'sub-1',
    competencyId: competency.id,
    competency,
    name: 'Sub Competency 1',
    evaluations,
  });

const createPendingProgress = (studentId: string, subId: string): StudentSubCompetencyProgress =>
  new StudentSubCompetencyProgress({
    id: `${studentId}-${subId}`,
    studentId,
    subCompetencyId: subId,
    status: 'PendingValidation',
    percent: 75,
    lockOverride: 'Unlocked',
    recommended: false,
    updatedAt: '2024-01-01T00:00:00Z',
  });

const createStudent = ({
  id,
  name,
  progress,
  attempts,
}: {
  id: string;
  name: string;
  progress: StudentSubCompetencyProgress[];
  attempts?: EvaluationAttempt[];
}): User =>
  new User({
    id,
    name,
    role: UserRole.STUDENT,
    email: `${id}@example.com`,
    studentProgress: progress,
    evaluationAttempts: attempts ?? [],
  });

describe('useStudentProgress helpers', () => {
  it('extractPendingProgress returns only pending validation entries', () => {
    const pending = createPendingProgress('student-1', 'sub-1');
    const inProgress = new StudentSubCompetencyProgress({
      id: 'student-1-sub-2',
      studentId: 'student-1',
      subCompetencyId: 'sub-2',
      status: 'InProgress',
      percent: 20,
      updatedAt: null,
    });

    const student = createStudent({
      id: 'student-1',
      name: 'Alice',
      progress: [pending, inProgress],
    });

    const result = extractPendingProgress(student);

    expect(result).toEqual([pending]);
  });

  it('computeEvaluationStatusSummaries maps attempts to status metadata', () => {
    const domain = createDomain();
    const competency = createCompetency(domain);
    const evaluation = createEvaluation('eval-1');
    const subCompetency = createSubCompetency(competency, [evaluation]);

    const attempt = createAttempt('attempt-1', evaluation.id, 'student-2', 'Completed');

    const student = createStudent({
      id: 'student-2',
      name: 'Bob',
      progress: [createPendingProgress('student-2', subCompetency.id)],
      attempts: [attempt],
    });

    const summaries = computeEvaluationStatusSummaries(student, subCompetency);

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      id: evaluation.id,
      status: 'Completed',
      statusIcon: EvaluationAttempt.getStatusIcon('Completed'),
      statusColor: EvaluationAttempt.getStatusColor('Completed'),
    });
  });

  it('createPendingValidationRow fills derived fields with placeholders when data missing', () => {
    const competency = new Competency({
      id: 'competency-2',
      domainId: 'domain-x',
      name: 'Orphan Competency',
    });
    const subCompetency = new SubCompetency({
      id: 'sub-2',
      competencyId: competency.id,
      competency,
      name: 'Untethered Sub',
      evaluations: [],
    });

    const student = createStudent({
      id: 'student-3',
      name: 'Carol',
      progress: [createPendingProgress('student-3', subCompetency.id)],
    });

    const row = createPendingValidationRow({
      student,
      progress: student.studentProgress[0]!,
      subCompetency,
      placeholder: 'N/A',
    });

    expect(row.domainName).toBe('N/A');
    expect(row.competencyName).toBe('Orphan Competency');
    expect(row.evaluationsStatusSummaries).toEqual([]);
  });

  it('buildPendingValidationRows loads sub-competencies once and sorts students', async () => {
    const domain = createDomain();
    const competency = createCompetency(domain);
    const evaluation = createEvaluation('eval-10');
    const subCompetency = createSubCompetency(competency, [evaluation]);

    const studentA = createStudent({
      id: 'student-a',
      name: 'Aaron',
      progress: [createPendingProgress('student-a', subCompetency.id)],
      attempts: [createAttempt('attempt-a', evaluation.id, 'student-a', 'Completed')],
    });

    const studentB = createStudent({
      id: 'student-b',
      name: 'Beatrice',
      progress: [createPendingProgress('student-b', subCompetency.id)],
    });

    const cache = new Map<string, SubCompetency | null>();
    const loadSubCompetency = vi.fn(async (id: string) => {
      await Promise.resolve();
      expect(id).toBe(subCompetency.id);
      return subCompetency;
    });

    const rows = await buildPendingValidationRows({
      students: [studentB, studentA],
      loadSubCompetency,
      cache,
    });

    expect(rows).toHaveLength(2);
    expect(loadSubCompetency).toHaveBeenCalledTimes(1);
    expect(cache.get(subCompetency.id)).toBe(subCompetency);
    expect(rows[0]?.student.name).toBe('Aaron');
    expect(rows[0]?.evaluationsStatusSummaries[0]?.status).toBe('Completed');
    expect(rows[1]?.evaluationsStatusSummaries[0]?.status).toBe('NotStarted');
  });

  it('createManagerRows maps basic progress state', () => {
    const domain = createDomain();
    const competency = createCompetency(domain);
    const evaluation = createEvaluation('eval-10');
    evaluation.attempts = [
      createAttempt('attempt-1', evaluation.id, 'student-d', 'Completed'),
      createAttempt('attempt-2', evaluation.id, 'student-e', 'Completed'),
    ];
    const subCompetency = createSubCompetency(competency, [evaluation]);
    const unlockedProgress = new StudentSubCompetencyProgress({
      id: 'student-c-sub',
      studentId: 'student-c',
      subCompetencyId: 'sub-3',
      status: 'InProgress',
      percent: 50,
      lockOverride: 'Unlocked',
      recommended: true,
      updatedAt: null,
    });

    const lockedProgress = new StudentSubCompetencyProgress({
      id: 'student-d-sub',
      studentId: 'student-d',
      subCompetencyId: 'sub-4',
      status: 'Validated',
      percent: 100,
      lockOverride: 'Locked',
      recommended: false,
      updatedAt: null,
    });

    const pendingProgress = new StudentSubCompetencyProgress({
      id: 'student-d-sub',
      studentId: 'student-e',
      subCompetencyId: 'sub-4',
      status: 'PendingValidation',
      percent: 100,
      lockOverride: 'Unlocked',
      recommended: false,
      updatedAt: null,
    });

    const students = [
      createStudent({ id: 'student-c', name: 'Clara', progress: [unlockedProgress] }),
      createStudent({ id: 'student-d', name: 'David', progress: [lockedProgress] }),
      createStudent({ id: 'student-e', name: 'Bob', progress: [pendingProgress] }),
    ];

    const rows = createManagerRows(students, subCompetency);

    expect(rows).toHaveLength(3);
    const unlockedRow = rows.find((row) => row.id === 'student-c');
    const lockedRow = rows.find((row) => row.id === 'student-d');
    const pendingRow = rows.find((row) => row.id === 'student-e');

    expect(unlockedRow).toMatchObject({
      competencyName: 'Competency 1',
      domainName: 'Domain 1',
      domainValue: 'domain-1',
      evaluationsStatusSummaries: [],
      id: 'student-c',
      progress: unlockedProgress,
      student: students[0],
      subCompetency: subCompetency,
      subCompetencyName: 'Sub Competency 1',
    });
    expect(lockedRow).toMatchObject({
      competencyName: 'Competency 1',
      domainName: 'Domain 1',
      domainValue: 'domain-1',
      evaluationsStatusSummaries: [],
      id: 'student-d',
      progress: lockedProgress,
      student: students[1],
      subCompetency: subCompetency,
      subCompetencyName: 'Sub Competency 1',
    });
    expect(pendingRow).toMatchObject({
      competencyName: 'Competency 1',
      domainName: 'Domain 1',
      domainValue: 'domain-1',
      id: 'student-e',
      progress: pendingProgress,
      student: students[2],
      subCompetency: subCompetency,
      subCompetencyName: 'Sub Competency 1',
      evaluationsStatusSummaries: [
        {
          id: 'attempt-2',
          name: 'Evaluation eval-10',
          status: 'Completed',
          statusColor: 'positive',
          statusIcon: 'check_circle',
        },
      ],
    });
  });
});
