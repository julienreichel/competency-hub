import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';
import { Competency, type AmplifyCompetency } from './Competency';
import type { AmplifyResource } from './CompetencyResource';
import { CompetencyResource, type ResourceInit } from './CompetencyResource';
import { isPresent, normaliseCollection } from './utils';

export type AmplifySubCompetency = NonNullable<Schema['SubCompetency']['type']>;

export interface SubCompetencyInit {
  id: string;
  competencyId: string;
  competency?: Competency | null;
  name: string;
  description?: string | null;
  objectives?: string | null;
  level?: number;
  createdAt?: string;
  updatedAt?: string;
  resources?: Array<ResourceInit | CompetencyResource>;
}

export interface CreateSubCompetencyInput {
  id?: string;
  competencyId: string;
  name: string;
  description?: string | null;
  objectives?: string | null;
  level?: number;
}

export type UpdateSubCompetencyInput = Partial<CreateSubCompetencyInput>;

export class SubCompetency extends BaseModel {
  public readonly competencyId: string;
  public readonly competency: Competency | null;
  public name: string;
  public description: string | null;
  public objectives: string | null;
  public level: number;
  public readonly resources: CompetencyResource[];

  constructor(data: SubCompetencyInit) {
    super(data);
    this.competencyId = data.competencyId;
    this.competency = data.competency
      ? data.competency instanceof Competency
        ? data.competency
        : new Competency(data.competency)
      : null;
    this.name = data.name;
    this.description = data.description ?? null;
    this.objectives = data.objectives ?? null;
    this.level = typeof data.level === 'number' ? data.level : 0;
    const initialResources = Array.from(data.resources ?? []);
    this.resources = initialResources.map((resource) =>
      resource instanceof CompetencyResource ? resource.clone() : new CompetencyResource(resource),
    );

    this.validate();
  }

  static fromAmplify(raw: AmplifySubCompetency): SubCompetency {
    const resources = normaliseCollection<AmplifyResource>(raw.resources).map((resource) =>
      CompetencyResource.fromAmplify(resource),
    );
    let competency: Competency | null = null;
    if (isPresent(raw.competency)) {
      // If already a Competency instance, use as is; otherwise, parse
      competency =
        raw.competency instanceof Competency
          ? raw.competency
          : Competency.fromAmplify(raw.competency as unknown as AmplifyCompetency);
    }
    return new SubCompetency({
      id: raw.id,
      competencyId: raw.competencyId,
      competency,
      name: raw.name,
      description: raw.description ?? null,
      objectives: raw.objectives ?? null,
      level: typeof raw.level === 'number' ? raw.level : 0,
      resources,
      ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
    });
  }

  validate(): void {
    if (!this.name?.trim()) {
      throw new Error('Sub-competency name is required');
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      competencyId: this.competencyId,
      name: this.name,
      description: this.description,
      objectives: this.objectives,
      level: this.level,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,

      resources: this.resources.map((resource) => resource.toJSON()),
    };
  }

  clone(): SubCompetency {
    return new SubCompetency({
      id: this.id,
      competencyId: this.competencyId,
      competency: this.competency ? this.competency.clone() : null,
      name: this.name,
      description: this.description,
      objectives: this.objectives,
      level: this.level,
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(this.updatedAt ? { updatedAt: this.updatedAt } : {}),
      resources: this.resources.map((resource) => resource.clone()),
    });
  }
}
