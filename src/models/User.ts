import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';

// Constants
const MAX_INITIALS = 2;

/**
 * User role enumeration
 */
export enum UserRole {
  UNKNOWN = 'Unknown',
  ADMIN = 'Admin',
  STUDENT = 'Student',
  EDUCATOR = 'Educator',
  PARENT = 'Parent',
}

/**
 * User data interface for creation
 */
export interface CreateUserData extends Record<string, unknown> {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string | null;
  picture?: string | null;
  contactInfo?: string | null;
  lastActive?: string | null;
}

/**
 * User data interface for updates
 */
export interface UpdateUserData extends Record<string, unknown> {
  name?: string;
  role?: UserRole;
  email?: string;
  avatar?: string;
  picture?: string | null;
  contactInfo?: string;
  lastActive?: string;
  /**
   * Derived relationship fields (not persisted directly via GraphQL)
   */
  educatorIds?: string[];
  parentIds?: string[];
  studentIds?: string[];
}

type AmplifyUser = NonNullable<Schema['User']['type']>;

type RelationEntries = AmplifyUser['educators'] | AmplifyUser['parents'];

type UserInit = {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string | null;
  picture?: string | null;
  contactInfo?: string | null;
  lastActive?: string | null;
  createdAt?: string;
  updatedAt?: string;
  educatorIds?: string[];
  parentIds?: string[];
  studentIds?: string[];
};

/**
 * User domain model
 * Encapsulates user business logic and validation
 */
export class User extends BaseModel {
  public readonly name: string;
  public readonly role: UserRole;
  public readonly email: string;
  public readonly avatar: string;
  public readonly picture?: string | null;
  public readonly contactInfo: string;
  public readonly lastActive: string | undefined;
  public readonly educatorIds: string[];
  public readonly parentIds: string[];
  public readonly studentIds: string[];

  constructor(data: UserInit) {
    super(data);
    this.name = data.name;
    this.role = data.role;
    this.email = data.email;
    this.avatar = data.avatar ?? '';
    this.picture = data.picture ?? null;
    this.contactInfo = data.contactInfo ?? '';
    this.lastActive = data.lastActive ?? undefined;
    this.educatorIds = [...(data.educatorIds ?? [])];
    this.parentIds = [...(data.parentIds ?? [])];
    this.studentIds = [...(data.studentIds ?? [])];
    this.validate();
  }

  static fromAmplify(raw: AmplifyUser): User {
    return new User({
      id: raw.id,
      name: raw.name ?? '',
      role: User.normaliseRole(raw.role),
      email: raw.email,
      avatar: raw.avatar ?? '',
      picture: raw.picture ?? null,
      contactInfo: raw.contactInfo ?? '',
      lastActive: raw.lastActive ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      educatorIds: User.collectUniqueIds([
        User.extractIdsFromEntries(raw.educators, 'educator'),
        User.extractIdsFromEntries(raw.educators, 'educatorId'),
      ]),
      parentIds: User.collectUniqueIds([
        User.extractIdsFromEntries(raw.parents, 'parent'),
        User.extractIdsFromEntries(raw.parents, 'parentId'),
      ]),
      studentIds: User.collectUniqueIds([
        User.extractIdsFromEntries(raw.students, 'student'),
        User.extractIdsFromEntries(raw.students, 'studentId'),
        User.extractIdsFromEntries(raw.children, 'student'),
        User.extractIdsFromEntries(raw.children, 'studentId'),
      ]),
    });
  }

  static create(data: UserInit): User {
    return new User({
      ...data,
      role: User.normaliseRole(data.role),
    });
  }

  /**
   * Validate user data
   * @throws Error if validation fails
   */
  validate(): void {
    if (!this.name?.trim()) {
      throw new Error('User name is required');
    }

    if (!this.email?.trim()) {
      throw new Error('User email is required');
    }

    if (!this.isValidEmail(this.email)) {
      throw new Error('Invalid email format');
    }

    if (!Object.values(UserRole).includes(this.role)) {
      throw new Error('Invalid user role');
    }
  }

  /**
   * Check if user is a student
   * @returns True if user role is STUDENT
   */
  isStudent(): boolean {
    return this.role === UserRole.STUDENT;
  }

  /**
   * Check if user is an educator
   * @returns True if user role is EDUCATOR
   */
  isEducator(): boolean {
    return this.role === UserRole.EDUCATOR;
  }

  /**
   * Check if user is a parent
   * @returns True if user role is PARENT
   */
  isParent(): boolean {
    return this.role === UserRole.PARENT;
  }

  /**
   * Get user display name
   * @returns Formatted display name
   */
  getDisplayName(): string {
    return this.name.trim();
  }

  /**
   * Get user initials for avatar fallback
   * @returns User initials (max 2 characters)
   */
  getInitials(): string {
    return this.name
      .split(' ')
      .filter((word) => word.trim().length > 0)
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, MAX_INITIALS)
      .join('');
  }

  /**
   * Convert to JSON representation
   * @returns Plain object representation
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      email: this.email,
      avatar: this.avatar,
      picture: this.picture ?? null,
      contactInfo: this.contactInfo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastActive: this.lastActive ?? null,
      educatorIds: [...this.educatorIds],
      parentIds: [...this.parentIds],
      studentIds: [...this.studentIds],
    };
  }

  /**
   * Clone the user instance
   * @returns New User instance with the same data
   */
  clone(): User {
    return new User({
      id: this.id,
      name: this.name,
      role: this.role,
      email: this.email,
      avatar: this.avatar,
      picture: this.picture ?? null,
      contactInfo: this.contactInfo,
      educatorIds: [...this.educatorIds],
      parentIds: [...this.parentIds],
      studentIds: [...this.studentIds],
      ...(this.createdAt && { createdAt: this.createdAt }),
      ...(this.updatedAt && { updatedAt: this.updatedAt }),
      ...(this.lastActive && { lastActive: this.lastActive }),
    });
  }

  /**
   * Create a new User instance with updated data
   * @param updates - Partial data to update
   * @returns New User instance with updates applied
   */
  update(updates: Partial<UpdateUserData>): User {
    return new User({
      id: this.id,
      name: updates.name ?? this.name,
      role: updates.role ?? this.role,
      email: updates.email ?? this.email,
      avatar: updates.avatar ?? this.avatar,
      picture: updates.picture ?? this.picture ?? null,
      contactInfo: updates.contactInfo ?? this.contactInfo,
      lastActive: updates.lastActive ?? this.lastActive ?? null,
      educatorIds: updates.educatorIds ?? this.educatorIds,
      parentIds: updates.parentIds ?? this.parentIds,
      studentIds: updates.studentIds ?? this.studentIds,
      ...(this.createdAt && { createdAt: this.createdAt }),
      ...(this.updatedAt && { updatedAt: this.updatedAt }),
    });
  }

  /**
   * Validate email format
   * @param email - Email to validate
   * @returns True if email format is valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static extractIdsFromEntries(
    entries: RelationEntries,
    key: 'student' | 'educator' | 'parent' | 'studentId' | 'educatorId' | 'parentId',
  ): string[] {
    if (!entries) {
      return [];
    }

    const collectFromValue = (value: unknown): string | null => {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      if (value && typeof value === 'object' && 'id' in value) {
        const candidate = (value as { id?: unknown }).id;
        if (typeof candidate === 'string' && candidate.trim()) {
          return candidate.trim();
        }
      }
      return null;
    };

    const processEntry = (entry: unknown): string[] => {
      if (!entry || typeof entry !== 'object') {
        return [];
      }
      const container = entry as Record<string, unknown>;
      const raw = container[key];

      if (Array.isArray(raw)) {
        return raw.map(collectFromValue).filter((id): id is string => Boolean(id));
      }

      const single = collectFromValue(raw);
      return single ? [single] : [];
    };

    if (Array.isArray(entries)) {
      return entries.flatMap(processEntry);
    }

    const items = (entries as { items?: unknown }).items;
    if (Array.isArray(items)) {
      return items.flatMap(processEntry);
    }

    return processEntry(entries);
  }

  private static collectUniqueIds(groups: Array<string[] | null | undefined>): string[] {
    const bucket = new Set<string>();
    groups.forEach((group) => {
      group?.forEach((value) => {
        const trimmed = value?.trim();
        if (trimmed) {
          bucket.add(trimmed);
        }
      });
    });
    return Array.from(bucket);
  }

  private static normaliseRole(role: UserRole | string | null | undefined): UserRole {
    if (typeof role === 'string') {
      if (Object.values(UserRole).includes(role as UserRole)) {
        return role as UserRole;
      }
    }
    return UserRole.UNKNOWN;
  }
}
