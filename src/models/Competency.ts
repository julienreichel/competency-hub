// Import getUrl if not already imported
import { getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';
import { Domain, type AmplifyDomain } from './Domain';
import { User, UserRole } from './User';

type AmplifyCompetency = NonNullable<Schema['Competency']['type']>;
type AmplifySubCompetency = NonNullable<Schema['SubCompetency']['type']>;
type AmplifyResource = NonNullable<Schema['Resource']['type']>;

type RelationCollection<T> = T | T[] | { items?: T[] } | { toArray?: () => T[] } | null | undefined;

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

function normaliseCollection<T>(input: RelationCollection<T>): T[];
function normaliseCollection<T>(input: unknown): T[];
function normaliseCollection<T>(input: unknown): T[] {
  const candidate = input as RelationCollection<T>;

  if (!candidate) {
    return [];
  }

  if (Array.isArray(candidate)) {
    return candidate.filter((item): item is T => item !== null && item !== undefined);
  }

  if (typeof candidate === 'object') {
    const items = (candidate as { items?: unknown }).items;
    if (Array.isArray(items)) {
      return items.filter((item): item is T => item !== null && item !== undefined);
    }

    const toArray = (candidate as { toArray?: () => unknown }).toArray;
    if (typeof toArray === 'function') {
      const array = toArray();
      if (Array.isArray(array)) {
        return array.filter((item): item is T => item !== null && item !== undefined);
      }
    }
  }

  return [];
}

const hasToJSON = (value: unknown): value is { toJSON: () => unknown } => {
  if (!isObject(value)) {
    return false;
  }
  return typeof value.toJSON === 'function';
};

const unwrap = (candidate: unknown): Record<string, unknown> | null => {
  if (!isObject(candidate)) {
    return null;
  }

  if (hasToJSON(candidate)) {
    return unwrap(candidate.toJSON());
  }

  return candidate;
};

const extractUserRelation = (value: unknown): User | null => {
  if (!value) {
    return null;
  }

  const record = unwrap(value);
  if (!record) {
    return null;
  }

  const id = record.id;
  if (typeof id !== 'string' || id.trim().length === 0) {
    return null;
  }

  const roleCandidate =
    typeof record.role === 'string'
      ? Object.values(UserRole).find((candidate) => candidate === record.role)
      : undefined;
  const normalisedRole = roleCandidate ?? UserRole.UNKNOWN;

  const email = typeof record.email === 'string' ? record.email : '';
  const name = typeof record.name === 'string' && record.name.trim().length > 0 ? record.name : id;

  const relation = new User({
    id,
    name,
    role: normalisedRole,
    email,
    avatar: typeof record.avatar === 'string' ? record.avatar : '',
    picture: typeof record.picture === 'string' ? record.picture : '',
    contactInfo: typeof record.contactInfo === 'string' ? record.contactInfo : '',
    lastActive: typeof record.lastActive === 'string' ? record.lastActive : '',
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
  });

  return relation;
};

export enum ResourceType {
  LINK = 'Link',
  HUMAN = 'Human',
  DOCUMENT = 'Document',
  LOCATION = 'Location',
}

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

  static fromAmplify(raw: AmplifyResource): CompetencyResource {
    const personData = extractUserRelation(raw.person);

    return new CompetencyResource({
      id: raw.id,
      subCompetencyId: raw.subCompetencyId,
      type: (raw.type ?? ResourceType.LINK) as string,
      name: raw.name,
      description: raw.description ?? null,
      url: raw.url ?? null,
      fileKey: raw.fileKey ?? null,
      personUserId: raw.personUserId ?? null,
      person: personData,
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

export function isPresent(field: unknown): boolean {
  return typeof field !== 'function' && Boolean(field);
}

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

  static fromAmplify(raw: AmplifyCompetency): Competency {
    const subCompetencies = normaliseCollection<AmplifySubCompetency>(raw.subCompetencies).map(
      (sub) => SubCompetency.fromAmplify(sub),
    );
    let domain: Domain | null = null;
    if (isPresent(raw.domain)) {
      // If already a Competency instance, use as is; otherwise, parse
      domain =
        raw.domain instanceof Domain
          ? raw.domain
          : Domain.fromAmplify(raw.domain as unknown as AmplifyDomain);
    }
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
}
export const mapResourcesFromAmplify = (resources: unknown): CompetencyResource[] =>
  normaliseCollection<AmplifyResource>(resources as RelationCollection<AmplifyResource>).map(
    (resource) => CompetencyResource.fromAmplify(resource),
  );

export const mapSubCompetenciesFromAmplify = (subCompetencies: unknown): SubCompetency[] =>
  normaliseCollection<AmplifySubCompetency>(
    subCompetencies as RelationCollection<AmplifySubCompetency>,
  ).map((subCompetency) => SubCompetency.fromAmplify(subCompetency));

export const mapCompetenciesFromAmplify = (competencies: unknown): Competency[] =>
  normaliseCollection<AmplifyCompetency>(competencies as RelationCollection<AmplifyCompetency>).map(
    (competency) => Competency.fromAmplify(competency),
  );
