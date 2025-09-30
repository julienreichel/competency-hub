import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';
import type { EvaluationInit } from './Evaluation';
import { Evaluation } from './Evaluation';
import { User, type UserRelationInit } from './User';

export type AmplifyEvaluationAttempt = NonNullable<Schema['EvaluationAttempt']['type']>;

export type EvaluationStatus = 'NotStarted' | 'InProgress' | 'Completed';

export interface EvaluationAttemptInit extends Record<string, unknown> {
  id: string;
  studentId: string;
  evaluationId: string;
  status?: EvaluationStatus;
  completionMode?: 'Auto' | 'Manual';
  startedAt?: string | null;
  completedAt?: string | null;
  evaluation?: EvaluationInit | Evaluation | null;
  createdAt?: string;
  updatedAt?: string;
  student?: UserRelationInit | User | null;
}

export class EvaluationAttempt extends BaseModel {
  public readonly studentId: string;
  public readonly evaluationId: string;
  public status: EvaluationStatus;
  public completionMode: 'Auto' | 'Manual';
  public startedAt: string | null;
  public completedAt: string | null;
  public readonly evaluation: Evaluation | null;
  public readonly student: User | null;

  constructor(data: EvaluationAttemptInit) {
    super(data);
    this.studentId = data.studentId;
    this.evaluationId = data.evaluationId;
    this.status = data.status ?? 'NotStarted';
    this.completionMode = data.completionMode ?? 'Manual';
    this.startedAt = data.startedAt ?? null;
    this.completedAt = data.completedAt ?? null;
    this.evaluation = data.evaluation
      ? data.evaluation instanceof Evaluation
        ? data.evaluation
        : new Evaluation(data.evaluation)
      : null;
    this.student = data.student ? User.create(data.student) : null;

    this.validate();
  }

  static fromAmplify(raw: AmplifyEvaluationAttempt): EvaluationAttempt {
    const evaluationRaw =
      raw.evaluation && typeof raw.evaluation === 'object' ? raw.evaluation : null;
    let student: UserRelationInit | null = null;
    if (raw.student && typeof raw.student === 'object' && 'id' in raw.student) {
      student = raw.student as unknown as UserRelationInit;
    }
    return new EvaluationAttempt({
      id: raw.id,
      studentId: raw.studentId,
      evaluationId: raw.evaluationId,
      status: raw.status ?? 'NotStarted',
      completionMode: raw.completionMode ?? 'Manual',
      startedAt: raw.startedAt ?? null,
      completedAt: raw.completedAt ?? null,
      evaluation: evaluationRaw ? (evaluationRaw as EvaluationInit) : null,
      student,
      ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
    });
  }

  validate(): void {
    if (!this.studentId?.trim()) throw new Error('studentId is required');
    if (!this.evaluationId?.trim()) throw new Error('evaluationId is required');
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      studentId: this.studentId,
      evaluationId: this.evaluationId,
      status: this.status,
      completionMode: this.completionMode,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      evaluation: this.evaluation ? this.evaluation.toJSON() : null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      student: this.student?.toJSON() ? this.student.toJSON() : null,
    };
  }

  clone(): EvaluationAttempt {
    return new EvaluationAttempt({
      id: this.id,
      studentId: this.studentId,
      evaluationId: this.evaluationId,
      status: this.status,
      completionMode: this.completionMode,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      evaluation: this.evaluation ? this.evaluation.clone() : null,
      student: this.student ? this.student.clone() : null,
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(this.updatedAt ? { updatedAt: this.updatedAt } : {}),
    });
  }
  statusIcon = (): string => EvaluationAttempt.getStatusIcon(this.status);
  statusColor = (): string => EvaluationAttempt.getStatusColor(this.status);

  static getStatusIcon = (status: EvaluationStatus): string => {
    switch (status) {
      case 'Completed':
        return 'check_circle';
      case 'InProgress':
        return 'play_circle';
      default:
        return 'watch_later';
    }
  };

  static getStatusColor = (status: EvaluationStatus): string => {
    switch (status) {
      case 'Completed':
        return 'positive';
      case 'InProgress':
        return 'primary';
      default:
        return 'grey-5';
    }
  };
}
