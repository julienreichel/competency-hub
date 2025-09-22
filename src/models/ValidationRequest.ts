import type { Schema } from '../../amplify/data/resource';

export type AmplifyValidationRequest = NonNullable<Schema['ValidationRequest']['type']>;

export interface ValidationRequestInit {
  id: string;
  studentId: string;
  subCompetencyId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  studentNote?: string | null;
  educatorId?: string | null;
  educatorNote?: string | null;
  createdAt?: string | null;
  decidedAt?: string | null;
}

export type ValidationRequestUpdate = Partial<ValidationRequestInit>;

export class ValidationRequest {
  public readonly id: string;
  public readonly studentId: string;
  public readonly subCompetencyId: string;
  public status: 'Pending' | 'Approved' | 'Rejected';
  public studentNote: string | null;
  public educatorId: string | null;
  public educatorNote: string | null;
  public createdAt: string | null;
  public decidedAt: string | null;

  constructor(data: ValidationRequestInit) {
    this.id = data.id;
    this.studentId = data.studentId;
    this.subCompetencyId = data.subCompetencyId;
    this.status = data.status;
    this.studentNote = data.studentNote ?? null;
    this.educatorId = data.educatorId ?? null;
    this.educatorNote = data.educatorNote ?? null;
    this.createdAt = data.createdAt ?? null;
    this.decidedAt = data.decidedAt ?? null;
    this.validate();
  }

  static fromAmplify(raw: AmplifyValidationRequest): ValidationRequest {
    return new ValidationRequest({
      id: raw.id,
      studentId: raw.studentId,
      subCompetencyId: raw.subCompetencyId,
      status: raw.status as ValidationRequestInit['status'],
      studentNote: raw.studentNote ?? null,
      educatorId: raw.educatorId ?? null,
      educatorNote: raw.educatorNote ?? null,
      createdAt: raw.createdAt,
      decidedAt: raw.decidedAt ?? null,
    });
  }

  validate(): void {
    if (!this.studentId?.trim()) throw new Error('studentId is required');
    if (!this.subCompetencyId?.trim()) throw new Error('subCompetencyId is required');
    if (!this.status) throw new Error('status is required');
    if (typeof this.createdAt !== 'number') throw new Error('createdAt is required');
  }

  toJSON(): ValidationRequestInit {
    return {
      id: this.id,
      studentId: this.studentId,
      subCompetencyId: this.subCompetencyId,
      status: this.status,
      studentNote: this.studentNote,
      educatorId: this.educatorId,
      educatorNote: this.educatorNote,
      createdAt: this.createdAt,
      decidedAt: this.decidedAt,
    };
  }

  clone(): ValidationRequest {
    return new ValidationRequest(this.toJSON());
  }
}
