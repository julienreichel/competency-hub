import { graphQLClient } from '../base/GraphQLClient';
import {
  StudentSubCompetencyProgress,
  type StudentSubCompetencyProgressInit,
  type StudentSubCompetencyProgressUpdate,
} from '../StudentSubCompetencyProgress';

export class StudentProgressRepository {
  static async createProgress({
    studentId,
    subCompetencyId,
    status,
    percent,
    lockOverride,
    recommended,
  }: StudentSubCompetencyProgressInit): Promise<StudentSubCompetencyProgress> {
    const raw = await graphQLClient.createStudentProgress({
      studentId,
      subCompetencyId,
      status: status ?? 'NotStarted',
      percent: percent ?? 0,
      lockOverride: lockOverride ?? 'Unlocked',
      recommended: recommended ?? false,
    });
    if (!raw) {
      throw new Error('Failed to create progress');
    }
    return StudentSubCompetencyProgress.fromAmplify(raw);
  }

  static async updateProgress(
    id: string,
    { status, percent, lockOverride, recommended }: StudentSubCompetencyProgressUpdate,
  ): Promise<StudentSubCompetencyProgress> {
    const data: StudentSubCompetencyProgressUpdate & { id: string } = {
      id,
    };
    if (status) data.status = status;
    if (percent !== undefined) data.percent = percent;
    if (lockOverride !== undefined) data.lockOverride = lockOverride;
    if (recommended !== undefined) data.recommended = recommended;

    const raw = await graphQLClient.updateStudentProgress(data);
    if (!raw) {
      throw new Error(`Failed to update validation ${id}`);
    }
    return StudentSubCompetencyProgress.fromAmplify(raw);
  }
}
