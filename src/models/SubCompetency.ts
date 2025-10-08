import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';
import { Competency } from './Competency';
import { CompetencyResource, type ResourceInit } from './CompetencyResource';
import { Evaluation } from './Evaluation';
import { Project, type ProjectInit } from './Project';
import { StudentSubCompetencyProgress } from './StudentSubCompetencyProgress';
import type { User } from './User';
import { UserRole } from './User';
import { mapArrayRelation, mapSingularRelation } from './utils';

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
  studentProgress?: StudentSubCompetencyProgress[];
  evaluations?: Evaluation[];
  projects?: Array<ProjectInit | Project>;
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
  public studentProgress: StudentSubCompetencyProgress[] = [];
  public readonly evaluations: Evaluation[];
  public readonly projects: Project[];

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

    this.evaluations = Array.isArray(data.evaluations)
      ? data.evaluations.map((evaluation) =>
          evaluation instanceof Evaluation ? evaluation.clone() : new Evaluation(evaluation),
        )
      : [];

    this.projects = Array.isArray(data.projects)
      ? data.projects.map((project) =>
          project instanceof Project ? project.clone() : new Project(project),
        )
      : [];

    // Parse studentProgress array if provided, using fromAmplify if needed
    if (Array.isArray(data.studentProgress)) {
      this.studentProgress = data.studentProgress.map((sp) =>
        sp instanceof StudentSubCompetencyProgress
          ? sp
          : StudentSubCompetencyProgress.fromAmplify(sp),
      );
    } else {
      this.studentProgress = [];
    }

    this.validate();
  }

  /**
   * Attach student progress and validation requests from a User object, filtering by this sub-competency's id.
   */
  attachUserProgress(user: User): void {
    if (user.studentProgress) {
      this.studentProgress = user.studentProgress.filter(
        (progress) => progress.subCompetencyId === this.id,
      );
    }
    if (user.role === UserRole.STUDENT && !this.studentProgress?.length) {
      this.studentProgress = [
        new StudentSubCompetencyProgress(
          {
            id: `${user.id}-${this.id}`,
            studentId: user.id,
            subCompetencyId: this.id,
            status: 'NotStarted',
            percent: 0,
            lockOverride: 'Locked',
            recommended: null,
            updatedAt: null,
          },
          true,
        ),
      ];
    }
  }

  static fromAmplify(this: void, raw: AmplifySubCompetency): SubCompetency {
    const resources = mapArrayRelation(raw.resources, CompetencyResource.fromAmplify);
    const competency = mapSingularRelation(raw.competency, Competency.fromAmplify);
    const studentProgress = mapArrayRelation(
      raw.studentProgress,
      StudentSubCompetencyProgress.fromAmplify,
    );
    const evaluations = mapArrayRelation(raw.evaluations, Evaluation.fromAmplify);

    const projects = SubCompetency.parseProjects(raw.projects);
    return new SubCompetency({
      id: raw.id,
      competencyId: raw.competencyId,
      competency,
      name: raw.name,
      description: raw.description ?? null,
      objectives: raw.objectives ?? null,
      level: typeof raw.level === 'number' ? raw.level : 0,
      resources,
      studentProgress,
      evaluations,
      projects,
      ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
    });
  }

  private static parseProjects(rawProjects: AmplifySubCompetency['projects']): Project[] {
    if (!rawProjects) return [];
    const arr = Array.isArray(rawProjects)
      ? rawProjects
      : Array.isArray((rawProjects as { items?: unknown }).items)
        ? ((rawProjects as { items?: unknown }).items as object[])
        : [];
    return arr
      .map((entry) =>
        entry && typeof entry === 'object' && 'id' in entry ? Project.fromAmplify(entry) : null,
      )
      .filter((item): item is Project => item !== null);
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
      studentProgress: this.studentProgress.map((sp) => sp.toJSON()),
      evaluations: this.evaluations.map((evaluation) => evaluation.toJSON()),
      projects: this.projects.map((project) => project.toJSON()),
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
      studentProgress: this.studentProgress.map((sp) => sp.clone()),
      evaluations: this.evaluations.map((evaluation) => evaluation.clone()),
      projects: this.projects.map((project) => project.clone()),
    });
  }
  /**
   * Get the status of the sub-competency for the current user context.
   * - "Locked" if lockOverride is 'Locked' or studentProgress[0] is locked
   * - Otherwise, returns the status from studentProgress[0] (default 'NotStarted')
   */
  getStatus(): 'Locked' | 'Validated' | 'InProgress' | 'PendingValidation' | 'NotStarted' {
    // If no progress, treat as Locked
    if (!this.studentProgress?.length) return 'Locked';
    const progress = this.studentProgress[0];
    if (!progress) return 'Locked';
    if (progress.lockOverride === 'Locked') return 'Locked';
    // If status is missing, treat as NotStarted
    if (!progress.status) return 'NotStarted';
    return progress.status;
  }
}
