import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

/**
 * GraphQL client wrapper for Amplify
 * Provides type-safe CRUD operations and error handling
 */
export class GraphQLClient {
  /**
   * Add a user to a Cognito group (admin mutation)
   * @param userId - The Cognito user ID
   * @param groupName - The group to add the user to
   * @returns Promise with the mutation result
   */
  async addUserToGroup(userId: string, groupName: string): Promise<boolean> {
    try {
      const result = await this.client.mutations.addUserToGroup(
        { userId, groupName },
        {
          authMode: 'userPool',
        },
      );
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error adding user to group:', error);
      return false;
    }
  }

  /**
   * Reset a user's password (admin mutation)
   * @param userId - The Cognito user ID
   * @param newPassword - Optional new password
   * @returns Promise with the mutation result
   */
  async resetUserPassword(userId: string, newPassword?: string): Promise<boolean> {
    try {
      const result = await this.client.mutations.resetUserPassword(
        { userId, newPassword: newPassword ?? null },
        {
          authMode: 'userPool',
        },
      );
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error resetting user password:', error);
      return false;
    }
  }

  /**
   * Delete a user (admin mutation)
   * @param userId - The Cognito user ID
   * @returns Promise with the mutation result
   */
  async adminDeleteUser(userId: string): Promise<boolean> {
    try {
      const result = await this.client.mutations.adminDeleteUser(
        { userId },
        {
          authMode: 'userPool',
        },
      );
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  /**
   * Create a user (admin mutation)
   * @param input - The user creation input
   * @returns Promise with the mutation result
   */
  async adminCreateUser(input: {
    userId: string;
    email: string;
    phone?: string;
    tempPassword?: string;
    suppressMessage?: boolean;
  }): Promise<boolean> {
    try {
      const result = await this.client.mutations.adminCreateUser(input, {
        authMode: 'userPool',
      });
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      return false;
    }
  }
  private readonly client = generateClient<Schema>({
    authMode: 'userPool',
  });

  /**
   * Create a new User record
   * @param data - The user data to create
   * @returns Promise with the created record
   */
  async createUser(
    data: { id: string; email: string } & Record<string, unknown>,
  ): Promise<Schema['User']['type'] | null> {
    try {
      const result = await this.client.models.User.create(data, {
        authMode: 'userPool',
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
  async getUser(id: string): Promise<Schema['User']['type'] | null> {
    try {
      const result = await this.client.models.User.get(
        { id },
        {
          authMode: 'userPool',
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error(`Error getting User with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * List User records with optional filtering
   * @param filter - Optional filter criteria
   * @returns Promise with array of records
   */
  async listUsers(filter?: Record<string, unknown>): Promise<Schema['User']['type'][]> {
    try {
      const options: { authMode: 'userPool'; filter?: Record<string, unknown> } = {
        authMode: 'userPool',
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
  async updateUser(
    id: string,
    data: Record<string, unknown>,
  ): Promise<Schema['User']['type'] | null> {
    try {
      const result = await this.client.models.User.update(
        { id, ...data },
        {
          authMode: 'userPool',
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error(`Error updating User with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a User record
   * @param id - The record ID
   * @returns Promise with the deleted record
   */
  async deleteUser(id: string): Promise<Schema['User']['type'] | null> {
    try {
      const result = await this.client.models.User.delete(
        { id },
        {
          authMode: 'userPool',
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error(`Error deleting User with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new Competency record
   * @param data - The competency data to create
   * @returns Promise with the created record
   */
  async createCompetency(
    data: Record<string, unknown>,
  ): Promise<Schema['Competency']['type'] | null> {
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
  async getCompetency(id: string): Promise<Schema['Competency']['type'] | null> {
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
  async listCompetencies(
    filter?: Record<string, unknown>,
  ): Promise<Schema['Competency']['type'][]> {
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
  async updateCompetency(
    id: string,
    data: Record<string, unknown>,
  ): Promise<Schema['Competency']['type'] | null> {
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
  async deleteCompetency(id: string): Promise<Schema['Competency']['type'] | null> {
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
