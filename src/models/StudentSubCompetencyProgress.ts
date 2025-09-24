import type { Schema } from '../../amplify/data/resource';

export type AmplifyStudentSubCompetencyProgress = NonNullable<
  Schema['StudentSubCompetencyProgress']['type']
>;

import { User, type UserRelationInit } from './User';

export interface StudentSubCompetencyProgressInit {
  id: string;
  studentId: string;
  subCompetencyId: string;
  status: 'NotStarted' | 'InProgress' | 'PendingValidation' | 'Validated';
  percent: number;
  lockOverride?: 'Locked' | 'Unlocked' | null;
  recommended?: boolean | null;
  updatedAt: string | null;
  student?: UserRelationInit | null;
}
export type StudentSubCompetencyProgressUpdate = Partial<StudentSubCompetencyProgressInit>;

export class StudentSubCompetencyProgress {
  public readonly id: string;
  public readonly studentId: string;
  public readonly subCompetencyId: string;
  public status: 'NotStarted' | 'InProgress' | 'PendingValidation' | 'Validated';
  public percent: number;
  public lockOverride: 'Locked' | 'Unlocked' | null;
  public recommended: boolean | null;
  public updatedAt: string | null;
  public readonly student: User | null;

  constructor(data: StudentSubCompetencyProgressInit) {
    this.id = data.id;
    this.studentId = data.studentId;
    this.subCompetencyId = data.subCompetencyId;
    this.status = data.status;
    this.percent = data.percent;
    this.lockOverride = data.lockOverride ?? null;
    this.recommended = data.recommended ?? null;
    this.updatedAt = data.updatedAt;
    this.student = data.student ? User.create(data.student) : null;

    this.validate();
  }

  static fromAmplify(raw: AmplifyStudentSubCompetencyProgress): StudentSubCompetencyProgress {
    let student: UserRelationInit | null = null;
    if (raw.student && typeof raw.student === 'object' && 'id' in raw.student) {
      student = raw.student as unknown as UserRelationInit;
    }
    return new StudentSubCompetencyProgress({
      id: raw.id,
      studentId: raw.studentId,
      subCompetencyId: raw.subCompetencyId,
      status: raw.status as StudentSubCompetencyProgressInit['status'],
      percent: raw.percent ?? 0,
      lockOverride: raw.lockOverride ?? null,
      recommended: raw.recommended ?? null,
      updatedAt: raw.updatedAt ?? null,
      student,
    });
  }

  validate(): void {
    if (!this.studentId?.trim()) throw new Error('studentId is required');
    if (!this.subCompetencyId?.trim()) throw new Error('subCompetencyId is required');
    if (!this.status) throw new Error('status is required');
    if (typeof this.percent !== 'number') throw new Error('percent is required');
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      studentId: this.studentId,
      subCompetencyId: this.subCompetencyId,
      status: this.status,
      percent: this.percent,
      lockOverride: this.lockOverride,
      recommended: this.recommended,
      updatedAt: this.updatedAt,
      student: this.student?.toJSON() ? this.student.toJSON() : null,
    };
  }

  clone(): StudentSubCompetencyProgress {
    return new StudentSubCompetencyProgress(
      this.toJSON() as unknown as StudentSubCompetencyProgressInit,
    );
  }
}
