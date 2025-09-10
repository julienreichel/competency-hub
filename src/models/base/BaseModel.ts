/**
 * Base model class providing common functionality for all domain models
 * Follows Clean Code principles with single responsibility
 */
export abstract class BaseModel {
  public readonly id: string;
  public readonly createdAt?: string;
  public readonly updatedAt?: string;

  constructor(data: { id: string; createdAt?: string; updatedAt?: string }) {
    this.id = data.id;
    if (data.createdAt !== undefined) {
      this.createdAt = data.createdAt;
    }
    if (data.updatedAt !== undefined) {
      this.updatedAt = data.updatedAt;
    }
  }

  /**
   * Convert model instance to plain object for serialization
   * @returns Plain object representation
   */
  abstract toJSON(): Record<string, unknown>;

  /**
   * Validate the model instance
   * @throws Error if validation fails
   */
  abstract validate(): void;

  /**
   * Check if two models are equal based on their ID
   * @param other - Another model instance
   * @returns True if models have the same ID
   */
  equals(other: BaseModel): boolean {
    return this.id === other.id;
  }

  /**
   * Clone the model instance
   * @returns New instance with the same data
   */
  abstract clone(): BaseModel;
}

/**
 * Interface for repository pattern
 * Provides standard CRUD operations for domain models
 */
export interface Repository<
  T extends BaseModel,
  TCreateData = unknown,
  TUpdateData = unknown,
  TFilter = unknown,
> {
  /**
   * Create a new entity
   * @param data - Entity data
   * @returns Promise with created entity
   */
  create(data: TCreateData): Promise<T>;

  /**
   * Find entity by ID
   * @param id - Entity ID
   * @returns Promise with entity or null if not found
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all entities
   * @param filter - Optional filter criteria
   * @returns Promise with array of entities
   */
  findAll(filter?: TFilter): Promise<T[]>;

  /**
   * Update an entity
   * @param id - Entity ID
   * @param data - Updated data
   * @returns Promise with updated entity
   */
  update(id: string, data: TUpdateData): Promise<T>;

  /**
   * Delete an entity
   * @param id - Entity ID
   * @returns Promise with deleted entity
   */
  delete(id: string): Promise<T>;
}
