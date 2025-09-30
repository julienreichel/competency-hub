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

    if (options.sub?.value) {
      updateProgressCollection(options.sub.value.studentProgress, progress);
    }

    if (options.currentEducator?.value?.students) {
      const educatorStudents = options.currentEducator.value.students;
      const index = educatorStudents.findIndex((candidate) => candidate.id === student.id);
      if (index !== -1) {
        updateProgressCollection(educatorStudents[index]?.studentProgress, progress);
        educatorStudents.splice(index, 1, student);
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
  const index = collection.findIndex((entry) => entry.id === progress.id);
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

      const evaluationsStatusSummaries = evaluations
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
