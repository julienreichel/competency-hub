import { getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';
import { EvaluationAttempt } from './EvaluationAttempt';
import { mapArrayRelation } from './utils';

export enum EvaluationMode {
  SOLO = 'Solo',
  PEER = 'Peer',
  ADULT = 'Adult',
}

export enum EvaluationFormat {
  EXPERIMENT = 'Experiment',
  PAPER_PENCIL = 'PaperPencil',
  ORAL = 'Oral',
  DIGITAL = 'Digital',
}

export type AmplifyEvaluation = NonNullable<Schema['Evaluation']['type']>;

export interface EvaluationInit extends Record<string, unknown> {
  id: string;
  subCompetencyId: string;
  name: string;
  description?: string | null;
  mode: EvaluationMode | string;
  format: EvaluationFormat | string;
  durationMin?: number | null;
  url?: string | null;
  fileKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
  attempts?: EvaluationAttempt[];
}

const normaliseMode = (value: string | EvaluationMode): EvaluationMode => {
  if (Object.values(EvaluationMode).includes(value as EvaluationMode)) {
    return value as EvaluationMode;
  }
  throw new Error(`Invalid evaluation mode: ${value}`);
};

const normaliseFormat = (value: string | EvaluationFormat): EvaluationFormat => {
  if (Object.values(EvaluationFormat).includes(value as EvaluationFormat)) {
    return value as EvaluationFormat;
  }
  throw new Error(`Invalid evaluation format: ${value}`);
};

export class Evaluation extends BaseModel {
  public readonly subCompetencyId: string;
  public name: string;
  public description: string | null;
  public readonly mode: EvaluationMode;
  public readonly format: EvaluationFormat;
  public durationMin: number | null;
  public url: string | null;
  public fileKey: string | null;
  public attempts: EvaluationAttempt[];

  constructor(data: EvaluationInit) {
    super(data);
    this.subCompetencyId = data.subCompetencyId;
    this.name = data.name;
    this.description = data.description ?? null;
    this.mode = normaliseMode(data.mode);
    this.format = normaliseFormat(data.format);
    this.durationMin = typeof data.durationMin === 'number' ? data.durationMin : null;
    this.url = data.url ?? null;
    this.fileKey = data.fileKey ?? null;
    this.attempts = data.attempts || [];

    this.validate();
  }

  static fromAmplify(this: void, raw: AmplifyEvaluation): Evaluation {
    const attempts = mapArrayRelation(raw.attempts, EvaluationAttempt.fromAmplify);

    return new Evaluation({
      id: raw.id,
      subCompetencyId: raw.subCompetencyId,
      name: raw.name,
      description: raw.description ?? null,
      mode: raw.mode ?? EvaluationMode.SOLO,
      format: raw.format ?? EvaluationFormat.EXPERIMENT,
      durationMin: raw.durationMin ?? null,
      url: raw.url ?? null,
      fileKey: raw.fileKey ?? null,
      ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
      attempts,
    });
  }

  validate(): void {
    if (!this.name?.trim()) {
      throw new Error('Evaluation name is required');
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      subCompetencyId: this.subCompetencyId,
      name: this.name,
      description: this.description,
      mode: this.mode,
      format: this.format,
      durationMin: this.durationMin,
      url: this.url,
      fileKey: this.fileKey,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      attempts: this.attempts ? this.attempts.map((attempt) => attempt.toJSON()) : null,
    };
  }

  clone(): Evaluation {
    return new Evaluation({
      id: this.id,
      subCompetencyId: this.subCompetencyId,
      name: this.name,
      description: this.description,
      mode: this.mode,
      format: this.format,
      durationMin: this.durationMin,
      url: this.url,
      fileKey: this.fileKey,
      attempts: this.attempts ? this.attempts.map((attempt) => attempt.clone()) : [],
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(this.updatedAt ? { updatedAt: this.updatedAt } : {}),
    });
  }

  async resolveFileUrl(): Promise<string | null> {
    if (!this.fileKey) return null;
    if (/^https?:\/\//i.test(this.fileKey)) {
      return this.fileKey;
    }
    try {
      const { url } = await getUrl({ path: this.fileKey });
      return url.toString();
    } catch (error) {
      console.error('Failed to resolve evaluation file URL', error);
      return null;
    }
  }
}
