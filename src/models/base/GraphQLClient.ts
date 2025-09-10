import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

/**
 * GraphQL client wrapper for Amplify
 * Provides type-safe CRUD operations and error handling
 */
export class GraphQLClient {
  private client = generateClient<Schema>();

  /**
   * Create a new User record
   * @param data - The user data to create
   * @returns Promise with the created record
   */
  async createUser(data: Record<string, unknown>) {
    try {
      const result = await this.client.models.User.create(data, {
        authMode: 'identityPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error creating User:', error);
      throw error;
    }
  }

  /**
   * Get a User record by ID
   * @param id - The record ID
   * @returns Promise with the record or null
   */
  async getUser(id: string) {
    try {
      const result = await this.client.models.User.get(
        { id },
        {
          authMode: 'identityPool',
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error(`Error getting User with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * List all User records
   * @param filter - Optional filter criteria
   * @returns Promise with array of records
   */
  async listUsers(filter?: Record<string, unknown>) {
    try {
      const options: { authMode: 'identityPool'; filter?: Record<string, unknown> } = {
        authMode: 'identityPool',
      };
      if (filter) {
        options.filter = filter;
      }
      const result = await this.client.models.User.list(options);
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error listing Users:', error);
      throw error;
    }
  }

  /**
   * Update a User record
   * @param id - The record ID
   * @param data - The data to update
   * @returns Promise with the updated record
   */
  async updateUser(id: string, data: Record<string, unknown>) {
    try {
      const result = await this.client.models.User.update(
        { id, ...data },
        {
          authMode: 'identityPool',
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error(`Error updating User with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a User record
   * @param id - The record ID
   * @returns Promise with the deleted record
   */
  async deleteUser(id: string) {
    try {
      const result = await this.client.models.User.delete(
        { id },
        {
          authMode: 'identityPool',
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error(`Error deleting User with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new Competency record
   * @param data - The competency data to create
   * @returns Promise with the created record
   */
  async createCompetency(data: Record<string, unknown>) {
    try {
      const result = await this.client.models.Competency.create(data, {
        authMode: 'identityPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error creating Competency:', error);
      throw error;
    }
  }

  /**
   * Get a Competency record by ID
   * @param id - The record ID
   * @returns Promise with the record or null
   */
  async getCompetency(id: string) {
    try {
      const result = await this.client.models.Competency.get(
        { id },
        {
          authMode: 'identityPool',
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error(`Error getting Competency with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * List all Competency records
   * @param filter - Optional filter criteria
   * @returns Promise with array of records
   */
  async listCompetencies(filter?: Record<string, unknown>) {
    try {
      const options: { authMode: 'identityPool'; filter?: Record<string, unknown> } = {
        authMode: 'identityPool',
      };
      if (filter) {
        options.filter = filter;
      }
      const result = await this.client.models.Competency.list(options);
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error listing Competencies:', error);
      throw error;
    }
  }

  /**
   * Update a Competency record
   * @param id - The record ID
   * @param data - The data to update
   * @returns Promise with the updated record
   */
  async updateCompetency(id: string, data: Record<string, unknown>) {
    try {
      const result = await this.client.models.Competency.update(
        { id, ...data },
        {
          authMode: 'identityPool',
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error(`Error updating Competency with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a Competency record
   * @param id - The record ID
   * @returns Promise with the deleted record
   */
  async deleteCompetency(id: string) {
    try {
      const result = await this.client.models.Competency.delete(
        { id },
        {
          authMode: 'identityPool',
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error(`Error deleting Competency with ID ${id}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const graphQLClient = new GraphQLClient();
