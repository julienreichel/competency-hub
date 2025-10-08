import { getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';
import type { SubCompetencyInit } from './SubCompetency';
import { SubCompetency } from './SubCompetency';
import { User, type UserRelationInit } from './User';
import { mapSingularRelation } from './utils';

export type AmplifyProject = NonNullable<Schema['Project']['type']>;

export type ProjectStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

export interface ProjectInit extends Record<string, unknown> {
  id: string;
  studentId: string;
  subCompetencyId: string;
  name: string;
  description?: string | null;
  fileKey?: string | null;
  status?: ProjectStatus;
  student?: UserRelationInit | User | null;
  subCompetency?: SubCompetencyInit | SubCompetency | null;
  createdAt?: string;
  updatedAt?: string;
}

export class Project extends BaseModel {
  public readonly studentId: string;
  public readonly subCompetencyId: string;
  public name: string;
  public description: string | null;
  public fileKey: string | null;
  public status: ProjectStatus;
  public readonly student: User | null;
  public readonly subCompetency: SubCompetency | null;

  constructor(data: ProjectInit) {
    super(data);
    this.studentId = data.studentId;
    this.subCompetencyId = data.subCompetencyId;
    this.name = data.name;
    this.description = data.description ?? null;
    this.fileKey = data.fileKey ?? null;
    this.status = data.status ?? 'Draft';
    this.student = data.student ? User.create(data.student) : null;
    this.subCompetency = data.subCompetency
      ? data.subCompetency instanceof SubCompetency
        ? data.subCompetency
        : new SubCompetency(data.subCompetency)
      : null;

    this.validate();
  }

  static fromAmplify(this: void, raw: AmplifyProject): Project {
    const subCompetency = mapSingularRelation(raw.subCompetency, SubCompetency.fromAmplify);
    const student = mapSingularRelation(raw.student, User.fromAmplify);

    return new Project({
      id: raw.id,
      studentId: raw.studentId,
      subCompetencyId: raw.subCompetencyId,
      name: raw.name,
      description: raw.description ?? null,
      fileKey: raw.fileKey ?? null,
      status: (raw.status as ProjectStatus) ?? 'Draft',
      student,
      subCompetency,
      ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
    });
  }

  validate(): void {
    if (!this.name?.trim()) {
      throw new Error('Project name is required');
    }

    if (!this.studentId?.trim()) {
      throw new Error('Project student ID is required');
    }

    if (!this.subCompetencyId?.trim()) {
      throw new Error('Project sub-competency ID is required');
    }
  }

  clone(): Project {
    return new Project({
      id: this.id,
      studentId: this.studentId,
      subCompetencyId: this.subCompetencyId,
      name: this.name,
      description: this.description,
      fileKey: this.fileKey,
      status: this.status,
      student: this.student?.clone() ?? null,
      subCompetency: this.subCompetency?.clone() ?? null,
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(this.updatedAt ? { updatedAt: this.updatedAt } : {}),
    });
  }

  update(data: Partial<ProjectInit>): Project {
    return new Project({
      id: this.id,
      studentId: this.studentId,
      subCompetencyId: this.subCompetencyId,
      name: data.name ?? this.name,
      description: data.description ?? this.description,
      fileKey: data.fileKey ?? this.fileKey,
      status: data.status ?? this.status,
      student: this.student,
      subCompetency: this.subCompetency,
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(data.updatedAt
        ? { updatedAt: data.updatedAt }
        : this.updatedAt
          ? { updatedAt: this.updatedAt }
          : {}),
    });
  }

  /**
   * Resolves the file URL for this project's file attachment
   * @returns Promise<string | null> The resolved file URL or null if no file
   */
  async resolveFileUrl(): Promise<string | null> {
    if (!this.fileKey) {
      return null;
    }

    // If already a full URL, return as is
    if (/^https?:\/\//i.test(this.fileKey)) {
      return this.fileKey;
    }

    try {
      const { url } = await getUrl({ path: this.fileKey });
      return url.toString();
    } catch (error) {
      console.error('Failed to resolve file URL', error);
      return null;
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      studentId: this.studentId,
      subCompetencyId: this.subCompetencyId,
      name: this.name,
      description: this.description,
      fileKey: this.fileKey,
      status: this.status,
      student: this.student?.toJSON() ?? null,
      subCompetency: this.subCompetency?.toJSON() ?? null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
