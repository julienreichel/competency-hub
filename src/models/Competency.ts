import { BaseModel } from './base/BaseModel';

/**
 * Competency status enumeration
 */
export enum CompetencyStatus {
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
  ACQUIRED = 'ACQUIRED',
  IN_PROGRESS = 'IN_PROGRESS',
}

/**
 * Competency data interface for creation
 */
export interface CreateCompetencyData extends Record<string, unknown> {
  domain: string;
  subDomain: string;
  description: string;
  stage: string;
  status: CompetencyStatus;
}

/**
 * Competency data interface for updates
 */
export interface UpdateCompetencyData extends Record<string, unknown> {
  domain?: string;
  subDomain?: string;
  description?: string;
  stage?: string;
  status?: CompetencyStatus;
}

/**
 * Raw competency data from GraphQL
 */
export interface CompetencyGraphQLData {
  id: string;
  domain: string;
  subDomain: string;
  description: string;
  stage: string;
  status: CompetencyStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Competency domain model
 * Encapsulates competency business logic and validation
 */
export class Competency extends BaseModel {
  public readonly domain: string;
  public readonly subDomain: string;
  public readonly description: string;
  public readonly stage: string;
  public readonly status: CompetencyStatus;

  constructor(data: CompetencyGraphQLData) {
    super(data);
    this.domain = data.domain;
    this.subDomain = data.subDomain;
    this.description = data.description;
    this.stage = data.stage;
    this.status = data.status;

    this.validate();
  }

  /**
   * Validate competency data
   * @throws Error if validation fails
   */
  validate(): void {
    if (!this.domain?.trim()) {
      throw new Error('Competency domain is required');
    }

    if (!this.subDomain?.trim()) {
      throw new Error('Competency sub-domain is required');
    }

    if (!this.description?.trim()) {
      throw new Error('Competency description is required');
    }

    if (!this.stage?.trim()) {
      throw new Error('Competency stage is required');
    }

    if (!Object.values(CompetencyStatus).includes(this.status)) {
      throw new Error('Invalid competency status');
    }
  }

  /**
   * Check if competency is locked
   * @returns True if status is LOCKED
   */
  isLocked(): boolean {
    return this.status === CompetencyStatus.LOCKED;
  }

  /**
   * Check if competency is unlocked
   * @returns True if status is UNLOCKED
   */
  isUnlocked(): boolean {
    return this.status === CompetencyStatus.UNLOCKED;
  }

  /**
   * Check if competency is in progress
   * @returns True if status is IN_PROGRESS
   */
  isInProgress(): boolean {
    return this.status === CompetencyStatus.IN_PROGRESS;
  }

  /**
   * Check if competency is acquired
   * @returns True if status is ACQUIRED
   */
  isAcquired(): boolean {
    return this.status === CompetencyStatus.ACQUIRED;
  }

  /**
   * Check if competency is available for learning
   * @returns True if status is UNLOCKED or IN_PROGRESS
   */
  isAvailable(): boolean {
    return this.isUnlocked() || this.isInProgress();
  }

  /**
   * Get competency full name
   * @returns Formatted full name (domain > sub-domain)
   */
  getFullName(): string {
    return `${this.domain} > ${this.subDomain}`;
  }

  /**
   * Get competency progress percentage
   * @returns Progress percentage based on status
   */
  getProgressPercentage(): number {
    switch (this.status) {
      case CompetencyStatus.LOCKED:
        return 0;
      case CompetencyStatus.UNLOCKED:
        return 25;
      case CompetencyStatus.IN_PROGRESS:
        return 50;
      case CompetencyStatus.ACQUIRED:
        return 100;
      default:
        return 0;
    }
  }

  /**
   * Get status display label
   * @returns Human-readable status label
   */
  getStatusLabel(): string {
    switch (this.status) {
      case CompetencyStatus.LOCKED:
        return 'Locked';
      case CompetencyStatus.UNLOCKED:
        return 'Available';
      case CompetencyStatus.IN_PROGRESS:
        return 'In Progress';
      case CompetencyStatus.ACQUIRED:
        return 'Acquired';
      default:
        return 'Unknown';
    }
  }

  /**
   * Convert to JSON representation
   * @returns Plain object representation
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      domain: this.domain,
      subDomain: this.subDomain,
      description: this.description,
      stage: this.stage,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Clone the competency instance
   * @returns New Competency instance with the same data
   */
  clone(): Competency {
    return new Competency({
      id: this.id,
      domain: this.domain,
      subDomain: this.subDomain,
      description: this.description,
      stage: this.stage,
      status: this.status,
      ...(this.createdAt && { createdAt: this.createdAt }),
      ...(this.updatedAt && { updatedAt: this.updatedAt }),
    });
  }

  /**
   * Create a new Competency instance with updated data
   * @param updates - Partial data to update
   * @returns New Competency instance with updates applied
   */
  update(updates: Partial<UpdateCompetencyData>): Competency {
    return new Competency({
      id: this.id,
      domain: updates.domain ?? this.domain,
      subDomain: updates.subDomain ?? this.subDomain,
      description: updates.description ?? this.description,
      stage: updates.stage ?? this.stage,
      status: updates.status ?? this.status,
      ...(this.createdAt && { createdAt: this.createdAt }),
      ...(this.updatedAt && { updatedAt: this.updatedAt }),
    });
  }

  /**
   * Transition to next status (business logic)
   * @returns New Competency instance with next status
   * @throws Error if transition is not allowed
   */
  transitionToNext(): Competency {
    let nextStatus: CompetencyStatus;

    switch (this.status) {
      case CompetencyStatus.LOCKED:
        nextStatus = CompetencyStatus.UNLOCKED;
        break;
      case CompetencyStatus.UNLOCKED:
        nextStatus = CompetencyStatus.IN_PROGRESS;
        break;
      case CompetencyStatus.IN_PROGRESS:
        nextStatus = CompetencyStatus.ACQUIRED;
        break;
      case CompetencyStatus.ACQUIRED:
        throw new Error('Competency is already acquired');
      default:
        throw new Error('Invalid competency status for transition');
    }

    return this.update({ status: nextStatus });
  }
}
