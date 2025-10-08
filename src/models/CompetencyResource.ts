import { getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';
import { extractUserRelation } from './utils';

import { User } from './User';
export enum ResourceType {
  LINK = 'Link',
  HUMAN = 'Human',
  DOCUMENT = 'Document',
  LOCATION = 'Location',
}

export type AmplifyResource = NonNullable<Schema['Resource']['type']>;

export interface ResourceInit extends Record<string, unknown> {
  id: string;
  subCompetencyId: string;
  type: ResourceType | string;
  name: string;
  description?: string | null;
  url?: string | null;
  fileKey?: string | null;
  personUserId?: string | null;
  person?: User | null;
  createdAt?: string;
  updatedAt?: string;
}
export interface CreateResourceInput extends Record<string, unknown> {
  id?: string;
  subCompetencyId: string;
  type: ResourceType;
  name: string;
  description?: string | null;
  url?: string | null;
  fileKey?: string | null;
  personUserId?: string | null;
}

export type UpdateResourceInput = Partial<CreateResourceInput>;

const normaliseResourceType = (type: string | ResourceType): ResourceType => {
  if (Object.values(ResourceType).includes(type as ResourceType)) {
    return type as ResourceType;
  }
  throw new Error(`Invalid resource type: ${type}`);
};

export class CompetencyResource extends BaseModel {
  public readonly subCompetencyId: string;
  public readonly type: ResourceType;
  public name: string;
  public description: string | null;
  public url: string | null;
  public readonly fileKey: string | null;
  public readonly personUserId: string | null;
  public readonly person: User | null;

  constructor(data: ResourceInit) {
    super(data);
    this.subCompetencyId = data.subCompetencyId;
    this.type = normaliseResourceType(data.type);
    this.name = data.name;
    this.description = data.description ?? null;
    this.url = data.url ?? null;
    this.fileKey = data.fileKey ?? null;
    this.personUserId = data.personUserId ?? null;

    if (data.person instanceof User) {
      this.person = data.person;
    } else if (data.person) {
      this.person = User.create(data.person);
    } else {
      this.person = null;
    }

    this.validate();
  }

  static fromAmplify(this: void, raw: AmplifyResource): CompetencyResource {
    const person = extractUserRelation(raw.person);

    return new CompetencyResource({
      id: raw.id,
      subCompetencyId: raw.subCompetencyId,
      type: (raw.type ?? ResourceType.LINK) as string,
      name: raw.name,
      description: raw.description ?? null,
      url: raw.url ?? null,
      fileKey: raw.fileKey ?? null,
      personUserId: raw.personUserId ?? null,
      person,
      ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
    });
  }

  validate(): void {
    if (!this.name?.trim()) {
      throw new Error('Resource name is required');
    }

    if (!Object.values(ResourceType).includes(this.type)) {
      throw new Error('Invalid resource type');
    }

    if (this.type === ResourceType.LINK) {
      if (!this.url?.trim()) {
        throw new Error('Resource URL is required for link and document types');
      }
    }

    if (this.type === ResourceType.DOCUMENT) {
      if (!this.fileKey?.trim()) {
        throw new Error('File Key is required for link and document types');
      }
    }

    if (this.type === ResourceType.HUMAN && !this.personUserId) {
      throw new Error('Human resource must reference a user');
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      subCompetencyId: this.subCompetencyId,
      type: this.type,
      name: this.name,
      description: this.description,
      url: this.url,
      fileKey: this.fileKey,
      personUserId: this.personUserId,
      person: this.person ? this.person.toJSON() : null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  clone(): CompetencyResource {
    const personInit = this.person ? extractUserRelation(this.person.toJSON()) : null;
    return new CompetencyResource({
      id: this.id,
      subCompetencyId: this.subCompetencyId,
      type: this.type,
      name: this.name,
      description: this.description,
      url: this.url,
      fileKey: this.fileKey,
      personUserId: this.personUserId,
      person: personInit,
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(this.updatedAt ? { updatedAt: this.updatedAt } : {}),
    });
  }

  /**
   * Resolves the download/view URL for this resource's file, if fileKey is present.
   * @returns {Promise<string | null>} The resolved URL or null if not available.
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
}
