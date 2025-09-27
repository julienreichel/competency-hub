import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';
import type { EvaluationInit } from './Evaluation';
import { Evaluation } from './Evaluation';

export type AmplifyEvaluationAttempt = NonNullable<Schema['EvaluationAttempt']['type']>;

export interface EvaluationAttemptInit extends Record<string, unknown> {
  id: string;
  studentId: string;
  evaluationId: string;
  status?: 'NotStarted' | 'InProgress' | 'Completed';
  completionMode?: 'Auto' | 'Manual';
  startedAt?: string | null;
  completedAt?: string | null;
  evaluation?: EvaluationInit | Evaluation | null;
  createdAt?: string;
  updatedAt?: string;
}

export class EvaluationAttempt extends BaseModel {
  public readonly studentId: string;
  public readonly evaluationId: string;
  public status: 'NotStarted' | 'InProgress' | 'Completed';
  public completionMode: 'Auto' | 'Manual';
  public startedAt: string | null;
  public completedAt: string | null;
  public readonly evaluation: Evaluation | null;

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

    this.validate();
  }

  static fromAmplify(raw: AmplifyEvaluationAttempt): EvaluationAttempt {
    const evaluationRaw =
      raw.evaluation && typeof raw.evaluation === 'object' ? raw.evaluation : null;
    return new EvaluationAttempt({
      id: raw.id,
      studentId: raw.studentId,
      evaluationId: raw.evaluationId,
      status: raw.status ?? 'NotStarted',
      completionMode: raw.completionMode ?? 'Manual',
      startedAt: raw.startedAt ?? null,
      completedAt: raw.completedAt ?? null,
      evaluation: evaluationRaw ? (evaluationRaw as EvaluationInit) : null,
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
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(this.updatedAt ? { updatedAt: this.updatedAt } : {}),
    });
  }
}
