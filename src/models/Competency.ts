// Import getUrl if not already imported
import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';

import { Domain } from './Domain';
import { SubCompetency, type SubCompetencyInit } from './SubCompetency';
import type { User } from './User';

import { mapArrayRelation, mapSingularRelation } from './utils';

export type AmplifyCompetency = NonNullable<Schema['Competency']['type']>;
export interface CompetencyInit {
  id: string;
  domainId: string;
  domain?: Domain | null;
  name: string;
  description?: string | null;
  objectives?: string | null;
  createdAt?: string;
  updatedAt?: string;
  subCompetencies?: Array<SubCompetencyInit | SubCompetency>;
}

export interface CreateCompetencyInput {
  id?: string;
  domainId: string;
  name: string;
  description?: string | null;
  objectives?: string | null;
}

export type UpdateCompetencyInput = Partial<CreateCompetencyInput>;

export class Competency extends BaseModel {
  public readonly domainId: string;
  public readonly domain: Domain | null;
  public name: string;
  public description: string | null;
  public objectives: string | null;
  public readonly subCompetencies: SubCompetency[];

  constructor(data: CompetencyInit) {
    super(data);
    this.domainId = data.domainId;
    this.domain = data.domain
      ? data.domain instanceof Domain
        ? data.domain
        : new Domain(data.domain)
      : null;
    this.name = data.name;
    this.description = data.description ?? null;
    this.objectives = data.objectives ?? null;
    const initialSubCompetencies = Array.from(data.subCompetencies ?? []);
    this.subCompetencies = initialSubCompetencies.map((subCompetency) =>
      subCompetency instanceof SubCompetency
        ? subCompetency.clone()
        : new SubCompetency(subCompetency),
    );

    this.validate();
  }

  /**
   * Attach user progress and validation requests to all sub-competencies from a User instance
   * @param user - User instance
   */
  attachUserProgress(user: User): void {
    this.subCompetencies.forEach((sub) => sub.attachUserProgress(user));
  }

  static fromAmplify(this: void, raw: AmplifyCompetency): Competency {
    const domain = mapSingularRelation(raw.domain, Domain.fromAmplify);
    const subCompetencies = mapArrayRelation(raw.subCompetencies, SubCompetency.fromAmplify);

    return new Competency({
      id: raw.id,
      domainId: raw.domainId,
      domain,
      name: raw.name,
      description: raw.description ?? null,
      objectives: raw.objectives ?? null,
      ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
      subCompetencies,
    });
  }

  validate(): void {
    if (!this.name?.trim()) {
      throw new Error('Competency name is required');
    }

    if (!this.domainId?.trim()) {
      throw new Error('Competency domainId is required');
    }
  }

  withUpdatedSubCompetencies(subCompetencies: SubCompetency[]): Competency {
    return new Competency({
      id: this.id,
      domainId: this.domainId,
      domain: this.domain?.clone() ?? null,
      name: this.name,
      description: this.description,
      objectives: this.objectives,
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(this.updatedAt ? { updatedAt: this.updatedAt } : {}),
      subCompetencies: subCompetencies.map((sub) => sub.clone()),
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      domainId: this.domainId,
      domain: this.domain ? this.domain.toJSON() : null,
      name: this.name,
      description: this.description,
      objectives: this.objectives,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      subCompetencies: this.subCompetencies.map((sub) => sub.toJSON()),
    };
  }

  clone(): Competency {
    return new Competency({
      id: this.id,
      domainId: this.domainId,
      domain: this.domain?.clone() ?? null,
      name: this.name,
      description: this.description,
      objectives: this.objectives,
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(this.updatedAt ? { updatedAt: this.updatedAt } : {}),
      subCompetencies: this.subCompetencies.map((sub) => sub.clone()),
    });
  }

  /**
   * Get the status of the competency based on its sub-competencies.
   * - "Locked" if all subs are locked
   * - "Validated" if all subs are validated
   * - "InProgress" if any sub is InProgress, PendingValidation, or Validated
   * - "NotStarted" otherwise
   */
  getStatus(): 'Locked' | 'Validated' | 'InProgress' | 'NotStarted' {
    if (!this.subCompetencies.length) return 'Locked';
    const allLocked = this.subCompetencies.every((sub) => sub.getStatus() === 'Locked');
    if (allLocked) return 'Locked';
    const allValidated = this.subCompetencies.every((sub) => sub.getStatus() === 'Validated');
    if (allValidated) return 'Validated';
    const anyInProgress = this.subCompetencies.some((sub) => {
      const status = sub.getStatus();
      return status === 'InProgress' || status === 'PendingValidation' || status === 'Validated';
    });
    if (anyInProgress) return 'InProgress';
    return 'NotStarted';
  }

  /**
   * Get the progress of the competency as a number between 0 and 1.
   * Progress = nb sub validated / nb sub
   */
  getProgress(): number {
    const PERCENT = 100;
    if (!this.subCompetencies.length) return 0;
    const validatedCount = this.subCompetencies.filter(
      (sub) => sub.getStatus && sub.getStatus() === 'Validated',
    ).length;
    return (validatedCount / this.subCompetencies.length) * PERCENT;
  }
}
