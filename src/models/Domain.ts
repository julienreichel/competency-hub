import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';
import { Competency, type CompetencyInit } from './Competency';
import { mapArrayRelation } from './utils';

export type AmplifyDomain = NonNullable<Schema['Domain']['type']>;
export interface DomainInit extends Record<string, unknown> {
  id: string;
  name: string;
  colorCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
  competencies?: Array<CompetencyInit | Competency>;
  competencyCount?: number | null;
}

export class Domain extends BaseModel {
  public readonly name: string;
  public readonly colorCode: string | null;
  public readonly competencies: Competency[];
  public readonly competencyCount: number | null;

  constructor(data: DomainInit) {
    super(data);
    this.name = data.name;
    this.colorCode = data.colorCode ?? null;
    const initialCompetencies = Array.from(data.competencies ?? []);
    this.competencies = initialCompetencies.map((competency) =>
      competency instanceof Competency ? competency.clone() : new Competency(competency),
    );

    this.competencyCount =
      typeof data.competencyCount === 'number'
        ? data.competencyCount
        : data.competencyCount === null
          ? null
          : this.competencies.length;
    this.validate();
  }

  static fromAmplify(this: void, raw: AmplifyDomain): Domain {
    const competencies = mapArrayRelation(raw.competencies, Competency.fromAmplify);

    return new Domain({
      id: raw.id,
      name: raw.name,
      colorCode: raw.colorCode ?? null,
      ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
      competencies,
    });
  }

  validate(): void {
    if (!this.name?.trim()) {
      throw new Error('Domain name is required');
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      colorCode: this.colorCode,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      competencies: this.competencies.map((competency) => competency.toJSON()),
      competencyCount: this.competencyCount ?? this.competencies.length,
    };
  }

  clone(): Domain {
    return new Domain({
      id: this.id,
      name: this.name,
      colorCode: this.colorCode,
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(this.updatedAt ? { updatedAt: this.updatedAt } : {}),
      competencies: this.competencies.map((competency) => competency.clone()),
      competencyCount: this.competencyCount ?? this.competencies.length,
    });
  }
}
