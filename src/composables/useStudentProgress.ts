import type {
  EvaluationStatusSummary,
  StudentProgressRow,
} from 'src/components/educator/studentProgressTypes';
import { EvaluationAttempt } from 'src/models/EvaluationAttempt';
import { StudentProgressRepository } from 'src/models/repositories/StudentProgressRepository';
import type {
  StudentSubCompetencyProgress,
  StudentSubCompetencyProgressInit,
  StudentSubCompetencyProgressUpdate,
} from 'src/models/StudentSubCompetencyProgress';
import type { SubCompetency } from 'src/models/SubCompetency';
import type { User } from 'src/models/User';
import type { Ref } from 'vue';

interface UseStudentProgressOptions {
  students: Ref<User[]>;
  currentEducator?: Ref<User | null>;
  sub?: Ref<SubCompetency | null>;
}

type RowWithProgress = {
  student: User;
  progress: StudentSubCompetencyProgress | null;
};

type ApplyUpdatesFunction = <Row extends RowWithProgress>(
  rows: Row[],
  builder: (
    progress: StudentSubCompetencyProgress,
  ) => StudentSubCompetencyProgressUpdate | null | undefined,
) => Promise<number>;

export function useStudentProgressActions(options: UseStudentProgressOptions): {
  persistProgress: (
    progress: StudentSubCompetencyProgress,
    updates: StudentSubCompetencyProgressUpdate,
  ) => Promise<StudentSubCompetencyProgress>;
  syncProgressCaches: (student: User, progress: StudentSubCompetencyProgress) => void;
  applyUpdates: ApplyUpdatesFunction;
} {
  async function persistProgress(
    progress: StudentSubCompetencyProgress,
    updates: StudentSubCompetencyProgressUpdate,
  ): Promise<StudentSubCompetencyProgress> {
    if (progress.local) {
      const payload: StudentSubCompetencyProgressInit = {
        ...progress,
        ...updates,
      };
      return StudentProgressRepository.createProgress(payload);
    }

    return StudentProgressRepository.updateProgress(progress.id, updates);
  }

  function syncProgressCaches(student: User, progress: StudentSubCompetencyProgress): void {
    updateProgressCollection(student.studentProgress, progress);

    const subCompetency = options.sub?.value;
    if (subCompetency) {
      updateProgressCollection(subCompetency.studentProgress, progress);
    }

    const educator = options.currentEducator?.value;
    if (educator?.students) {
      const index = educator.students.findIndex((candidate) => candidate.id === student.id);
      if (index !== -1) {
        updateProgressCollection(educator.students[index]?.studentProgress, progress);
        educator.students.splice(index, 1, student);
      }
    }

    const students = options.students;
    const existingIndex = students.value.findIndex((entry) => entry.id === student.id);
    if (existingIndex !== -1) {
      students.value.splice(existingIndex, 1, student);
    } else {
      students.value.push(student);
    }
    students.value = [...students.value];
  }

  const applyUpdates: ApplyUpdatesFunction = async (rows, builder) => {
    let updatedCount = 0;
    for (const row of rows) {
      const progress = row.progress;
      if (!progress) {
        continue;
      }
      const updates = builder(progress);
      if (!updates || Object.keys(updates).length === 0) {
        continue;
      }
      const saved = await persistProgress(progress, updates);
      syncProgressCaches(row.student, saved);
      updatedCount += 1;
    }
    return updatedCount;
  };

  return { persistProgress, syncProgressCaches, applyUpdates };
}

function updateProgressCollection(
  collection: StudentSubCompetencyProgress[] | undefined,
  progress: StudentSubCompetencyProgress,
): void {
  if (!Array.isArray(collection)) {
    return;
  }
  const index = collection.findIndex((entry) => entry.id === progress.id || entry.local);
  if (index === -1) {
    collection.push(progress);
  } else {
    collection.splice(index, 1, progress);
  }
}
const getDefaultName = (name: string | null | undefined): string => name ?? '-';

export function createManagerRows(
  students: User[],
  subCompetency: SubCompetency,
): StudentProgressRow[] {
  return students
    .map((student) => {
      const progress = Array.isArray(student.studentProgress)
        ? (student.studentProgress[0] ?? null)
        : null;
      if (!progress) return null;
      const evaluations = subCompetency.evaluations ?? [];

      let evaluationsStatusSummaries = [] as EvaluationStatusSummary[];
      if (progress.status === 'PendingValidation') {
        evaluationsStatusSummaries = evaluations
          .map((evaluation) => {
            const attempt = evaluation.attempts.find((attempt) => attempt.studentId === student.id);
            if (!attempt) return null;
            return {
              id: attempt.id,
              name: evaluation.name,
              status: attempt.status,
              statusIcon: EvaluationAttempt.getStatusIcon(attempt.status),
              statusColor: EvaluationAttempt.getStatusColor(attempt.status),
            };
          })
          .filter(Boolean) as EvaluationStatusSummary[];
      }

      return {
        id: student.id,
        student,
        progress,
        subCompetency: subCompetency,
        domainName: getDefaultName(subCompetency?.competency?.domain?.name),
        domainValue: subCompetency?.competency?.domain?.id ?? null,
        competencyName: getDefaultName(subCompetency?.competency?.name),
        subCompetencyName: getDefaultName(subCompetency?.name),
        evaluationsStatusSummaries,
      };
    })
    .filter(Boolean) as StudentProgressRow[];
}

export function extractPendingProgress(student: User): StudentSubCompetencyProgress[] {
  const progressList = Array.isArray(student.studentProgress) ? student.studentProgress : [];
  return progressList.filter((progress) => progress.status === 'PendingValidation');
}

export function computeEvaluationStatusSummaries(
  student: User,
  subCompetency: SubCompetency,
): EvaluationStatusSummary[] {
  const attempts = Array.isArray(student.evaluationAttempts) ? student.evaluationAttempts : [];
  const evaluations = Array.isArray(subCompetency.evaluations) ? subCompetency.evaluations : [];

  return evaluations.map((evaluation) => {
    const attempt = attempts.find((entry) => entry.evaluationId === evaluation.id);
    const status = attempt?.status ?? 'NotStarted';
    return {
      id: evaluation.id,
      name: evaluation.name,
      status,
      statusIcon: EvaluationAttempt.getStatusIcon(status),
      statusColor: EvaluationAttempt.getStatusColor(status),
    };
  });
}

interface CreatePendingRowOptions {
  student: User;
  progress: StudentSubCompetencyProgress;
  subCompetency: SubCompetency;
  placeholder?: string;
}

export function createPendingValidationRow({
  student,
  progress,
  subCompetency,
  placeholder = '—',
}: CreatePendingRowOptions): StudentProgressRow {
  const competency = subCompetency.competency ?? null;
  const domain = competency?.domain ?? null;
  const domainName = domain?.name ?? placeholder;
  const competencyName = competency?.name ?? placeholder;

  return {
    id: progress.id,
    student,
    progress,
    subCompetency,
    domainName,
    domainValue: domain?.id ?? null,
    competencyName,
    subCompetencyName: subCompetency.name,
    evaluationsStatusSummaries: computeEvaluationStatusSummaries(student, subCompetency),
  };
}

interface BuildPendingValidationRowsOptions {
  students: User[];
  loadSubCompetency: (id: string) => Promise<SubCompetency | null>;
  cache?: Map<string, SubCompetency | null>;
  placeholder?: string;
}

export async function buildPendingValidationRows({
  students,
  loadSubCompetency,
  cache,
  placeholder = '—',
}: BuildPendingValidationRowsOptions): Promise<StudentProgressRow[]> {
  const contexts: Array<{ student: User; progress: StudentSubCompetencyProgress }> = [];
  const subIds = new Set<string>();

  students.forEach((student) => {
    extractPendingProgress(student).forEach((progress) => {
      contexts.push({ student, progress });
      if (progress.subCompetencyId) {
        subIds.add(progress.subCompetencyId);
      }
    });
  });

  if (contexts.length === 0) {
    return [];
  }

  const subMap = new Map<string, SubCompetency | null>();

  await Promise.all(
    Array.from(subIds).map(async (id) => {
      if (!id) {
        subMap.set(id, null);
        return;
      }

      if (cache?.has(id)) {
        subMap.set(id, cache.get(id) ?? null);
        return;
      }

      const subCompetency = await loadSubCompetency(id);
      if (cache) {
        cache.set(id, subCompetency);
      }
      subMap.set(id, subCompetency);
    }),
  );

  const rows: StudentProgressRow[] = [];

  contexts.forEach(({ student, progress }) => {
    const identifier = progress.subCompetencyId;
    if (!identifier) {
      return;
    }
    const subCompetency = subMap.get(identifier);
    if (!subCompetency) {
      return;
    }

    rows.push(
      createPendingValidationRow({
        student,
        progress,
        subCompetency,
        placeholder,
      }),
    );
  });

  return rows.sort((a, b) => a.student.name.localeCompare(b.student.name));
}
