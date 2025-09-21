import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';
import { Competency, mapCompetenciesFromAmplify, type CompetencyInit } from './Competency';

export type AmplifyDomain = NonNullable<Schema['Domain']['type']>;

type RelationCollection<T> = T | T[] | { items?: T[] } | { toArray?: () => T[] } | null | undefined;

const normaliseCollection = <T>(input: RelationCollection<T>): T[] => {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.filter((item): item is T => item !== null && item !== undefined);
  }

  if (typeof input === 'object') {
    const items = (input as { items?: unknown }).items;
    if (Array.isArray(items)) {
      return items.filter((item): item is T => item !== null && item !== undefined);
    }

    const toArray = (input as { toArray?: () => unknown }).toArray;
    if (typeof toArray === 'function') {
      const array = toArray();
      if (Array.isArray(array)) {
        return array.filter((item): item is T => item !== null && item !== undefined);
      }
    }
  }

  return [];
};

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

  static fromAmplify(raw: AmplifyDomain): Domain {
    const competencies = mapCompetenciesFromAmplify(raw.competencies);

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

export const mapDomainsFromAmplify = (domains: unknown): Domain[] =>
  normaliseCollection<AmplifyDomain>(domains as RelationCollection<AmplifyDomain>).map((domain) =>
    Domain.fromAmplify(domain),
  );
