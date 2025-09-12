import { BaseModel } from './base/BaseModel';

// Constants
const MAX_INITIALS = 2;

export enum UserStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  SUSPENDED = 'Suspended',
}

/**
 * User role enumeration
 */
export enum UserRole {
  STUDENT = 'Student',
  EDUCATOR = 'Educator',
  PARENT = 'Parent',
}

/**
 * User data interface for creation
 */
export interface CreateUserData extends Record<string, unknown> {
  name: string;
  role: UserRole;
  email: string;
  avatar: string;
  contactInfo: string;
  status: UserStatus;
}

/**
 * User data interface for updates
 */
export interface UpdateUserData extends Record<string, unknown> {
  name?: string;
  role?: UserRole;
  email?: string;
  avatar?: string;
  contactInfo?: string;
  status?: UserStatus;
}

/**
 * Raw user data from GraphQL
 */
export interface UserGraphQLData {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar: string;
  contactInfo: string;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * User domain model
 * Encapsulates user business logic and validation
 */
export class User extends BaseModel {
  public readonly name: string;
  public readonly role: UserRole;
  public readonly email: string;
  public readonly avatar: string;
  public readonly contactInfo: string;
  public readonly status: UserStatus;

  constructor(data: UserGraphQLData) {
    super(data);
    this.name = data.name;
    this.role = data.role;
    this.email = data.email;
    this.avatar = data.avatar;
    this.contactInfo = data.contactInfo;
    this.status = data.status;
    this.validate();
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
      contactInfo: this.contactInfo,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
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
      contactInfo: this.contactInfo,
      status: this.status,
      ...(this.createdAt && { createdAt: this.createdAt }),
      ...(this.updatedAt && { updatedAt: this.updatedAt }),
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
      contactInfo: updates.contactInfo ?? this.contactInfo,
      status: updates.status ?? this.status,
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
}
