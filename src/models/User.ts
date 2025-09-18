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
  educators?: UserRelationInit[];
  parents?: UserRelationInit[];
  students?: UserRelationInit[];
  children?: UserRelationInit[];
}

type AmplifyUser = NonNullable<Schema['User']['type']>;

export interface UserRelationInit {
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
  educators?: UserRelationInit[];
  parents?: UserRelationInit[];
  students?: UserRelationInit[];
  children?: UserRelationInit[];
}

type UserInit = UserRelationInit;

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
  public readonly educators: User[];
  public readonly parents: User[];
  public readonly students: User[];
  public readonly children: User[];

  constructor(data: UserInit) {
    super(data);
    this.name = data.name;
    this.role = data.role;
    this.email = data.email;
    this.avatar = data.avatar ?? '';
    this.picture = data.picture ?? null;
    this.contactInfo = data.contactInfo ?? '';
    this.lastActive = data.lastActive ?? undefined;
    this.educators = User.normaliseRelation(data.educators);
    this.parents = User.normaliseRelation(data.parents);
    this.students = User.normaliseRelation(data.students);
    this.children = User.normaliseRelation(data.children);
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
      educators: User.extractUsersFromEntries(raw.educators, 'educator'),
      parents: User.extractUsersFromEntries(raw.parents, 'parent'),
      students: User.extractUsersFromEntries(raw.students, 'student'),
      children: User.extractUsersFromEntries(raw.children, 'student'),
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
    return this.toRelationInit(true) as unknown as Record<string, unknown>;
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
      educators: this.educators.map((educator) => educator.toRelationInit(true)),
      parents: this.parents.map((parent) => parent.toRelationInit(true)),
      students: this.students.map((student) => student.toRelationInit(true)),
      children: this.children.map((child) => child.toRelationInit(true)),
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
      educators:
        updates.educators ?? this.educators.map((educator) => educator.toRelationInit(true)),
      parents: updates.parents ?? this.parents.map((parent) => parent.toRelationInit(true)),
      students: updates.students ?? this.students.map((student) => student.toRelationInit(true)),
      children: updates.children ?? this.children.map((child) => child.toRelationInit(true)),
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

  private toRelationInit(includeRelations = false): UserRelationInit {
    const base: UserRelationInit = {
      id: this.id,
      name: this.name,
      role: this.role,
      email: this.email,
      avatar: this.avatar,
      picture: this.picture ?? null,
      contactInfo: this.contactInfo,
      lastActive: this.lastActive ?? null,
      ...(this.createdAt && { createdAt: this.createdAt }),
      ...(this.updatedAt && { updatedAt: this.updatedAt }),
    };

    if (includeRelations) {
      if (this.educators.length > 0) {
        base.educators = this.educators.map((educator) => educator.toRelationInit());
      }
      if (this.parents.length > 0) {
        base.parents = this.parents.map((parent) => parent.toRelationInit());
      }
      if (this.students.length > 0) {
        base.students = this.students.map((student) => student.toRelationInit());
      }
      if (this.children.length > 0) {
        base.children = this.children.map((child) => child.toRelationInit());
      }
    }

    return base;
  }

  private static normaliseRelation(relations?: UserRelationInit[]): User[] {
    if (!relations?.length) {
      return [];
    }
    return relations.map((relation) => User.create(relation));
  }

  private static extractUsersFromEntries(
    entries: AmplifyUser['educators'] | AmplifyUser['parents'],
    key: 'educator' | 'student' | 'parent',
  ): UserRelationInit[] {
    if (!entries) {
      return [];
    }

    const mapEntry = (entry: unknown): UserRelationInit | null => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const value = (entry as Record<string, unknown>)[key];
      if (value && typeof value === 'object' && 'id' in value) {
        const candidate = value as Partial<AmplifyUser> & { id: string };
        return {
          id: candidate.id,
          name: candidate.name ?? candidate.id,
          role: User.normaliseRole(candidate.role),
          email: candidate.email ?? '',
          avatar: candidate.avatar ?? '',
          picture: candidate.picture ?? null,
          contactInfo: candidate.contactInfo ?? '',
          lastActive: candidate.lastActive ?? null,
          ...(candidate.createdAt !== undefined ? { createdAt: candidate.createdAt } : {}),
          ...(candidate.updatedAt !== undefined ? { updatedAt: candidate.updatedAt } : {}),
        };
      }

      return null;
    };

    const entriesArray = Array.isArray(entries)
      ? entries
      : Array.isArray((entries as { items?: unknown }).items)
        ? ((entries as { items?: unknown }).items as unknown[])
        : [];

    return entriesArray
      .map((entry) => mapEntry(entry))
      .filter((relation): relation is UserRelationInit => Boolean(relation));
  }

  private static normaliseRole(role: UserRole | string | null | undefined): UserRole {
    if (typeof role === 'string') {
      if (Object.values(UserRole).includes(role as UserRole)) {
        return role as UserRole;
      }
    }
    return UserRole.UNKNOWN;
  }

  get educatorIds(): string[] {
    return this.educators.map((educator) => educator.id);
  }

  get parentIds(): string[] {
    return this.parents.map((parent) => parent.id);
  }

  get studentIds(): string[] {
    return this.students.map((student) => student.id);
  }
}
