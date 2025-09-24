import type { Schema } from '../../amplify/data/resource';

export type AmplifyStudentSubCompetencyProgress = NonNullable<
  Schema['StudentSubCompetencyProgress']['type']
>;

export interface StudentSubCompetencyProgressInit {
  id: string;
  studentId: string;
  subCompetencyId: string;
  status: 'NotStarted' | 'InProgress' | 'PendingValidation' | 'Validated';
  percent: number;
  lockOverride?: 'Locked' | 'Unlocked' | null;
  recommended?: boolean | null;
  updatedAt: string | null;
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

  constructor(data: StudentSubCompetencyProgressInit) {
    this.id = data.id;
    this.studentId = data.studentId;
    this.subCompetencyId = data.subCompetencyId;
    this.status = data.status;
    this.percent = data.percent;
    this.lockOverride = data.lockOverride ?? null;
    this.recommended = data.recommended ?? null;
    this.updatedAt = data.updatedAt;
    this.validate();
  }

  static fromAmplify(raw: AmplifyStudentSubCompetencyProgress): StudentSubCompetencyProgress {
    return new StudentSubCompetencyProgress({
      id: raw.id,
      studentId: raw.studentId,
      subCompetencyId: raw.subCompetencyId,
      status: raw.status as StudentSubCompetencyProgressInit['status'],
      percent: raw.percent ?? 0,
      lockOverride: raw.lockOverride ?? null,
      recommended: raw.recommended ?? null,
      updatedAt: raw.updatedAt ?? null,
    });
  }

  validate(): void {
    if (!this.studentId?.trim()) throw new Error('studentId is required');
    if (!this.subCompetencyId?.trim()) throw new Error('subCompetencyId is required');
    if (!this.status) throw new Error('status is required');
    if (typeof this.percent !== 'number') throw new Error('percent is required');
  }

  toJSON(): StudentSubCompetencyProgressInit {
    return {
      id: this.id,
      studentId: this.studentId,
      subCompetencyId: this.subCompetencyId,
      status: this.status,
      percent: this.percent,
      lockOverride: this.lockOverride,
      recommended: this.recommended,
      updatedAt: this.updatedAt,
    };
  }

  clone(): StudentSubCompetencyProgress {
    return new StudentSubCompetencyProgress(this.toJSON());
  }
}
