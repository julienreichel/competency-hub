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
  async addUserToGroup(userId: string, groupName: string): Promise<Schema['User']['type'] | null> {
    try {
      const result = await this.client.mutations.addUserToGroup(
        { userId, groupName },
        {
          authMode: 'userPool',
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      const data = JSON.parse(result.data as string) as unknown as {
        ok: boolean;
        user: Schema['User']['type'] | null;
      };
      return data.user;
    } catch (error) {
      console.error('Error adding user to group:', error);
      throw error;
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

  async getUserWithRelations(id: string): Promise<Schema['User']['type'] | null> {
    try {
      const result = await this.client.models.User.get(
        { id },
        {
          authMode: 'userPool',
          selectionSet: [
            'id',
            'name',
            'role',
            'email',
            'avatar',
            'picture',
            'contactInfo',
            'lastActive',
            'createdAt',
            'updatedAt',
            'educators.educator.*',
            'students.student.*',
            'parents.parent.*',
            'children.student.*',
          ],
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as unknown as Schema['User']['type'];
    } catch (error) {
      console.error(`Error getting User with relations id ${id}:`, error);
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

  async listTeachingAssignments(
    filter?: Record<string, unknown>,
  ): Promise<Schema['TeachingAssignment']['type'][]> {
    try {
      const options: { authMode: 'userPool'; filter?: Record<string, unknown> } = {
        authMode: 'userPool',
      };
      if (filter) {
        options.filter = filter;
      }
      const result = await this.client.models.TeachingAssignment.list(options);
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error listing TeachingAssignments:', error);
      throw error;
    }
  }

  async createTeachingAssignment(data: {
    studentId: string;
    educatorId: string;
  }): Promise<Schema['TeachingAssignment']['type'] | null> {
    try {
      const result = await this.client.models.TeachingAssignment.create(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error creating TeachingAssignment:', error);
      throw error;
    }
  }

  async deleteTeachingAssignment(id: string): Promise<Schema['TeachingAssignment']['type'] | null> {
    try {
      const result = await this.client.models.TeachingAssignment.delete(
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
      console.error(`Error deleting TeachingAssignment with id ${id}:`, error);
      throw error;
    }
  }

  async listParentLinks(filter?: Record<string, unknown>): Promise<Schema['ParentLink']['type'][]> {
    try {
      const options: { authMode: 'userPool'; filter?: Record<string, unknown> } = {
        authMode: 'userPool',
      };
      if (filter) {
        options.filter = filter;
      }
      const result = await this.client.models.ParentLink.list(options);
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error listing ParentLinks:', error);
      throw error;
    }
  }

  async createParentLink(data: {
    studentId: string;
    parentId: string;
  }): Promise<Schema['ParentLink']['type'] | null> {
    try {
      const result = await this.client.models.ParentLink.create(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error creating ParentLink:', error);
      throw error;
    }
  }

  async deleteParentLink(id: string): Promise<Schema['ParentLink']['type'] | null> {
    try {
      const result = await this.client.models.ParentLink.delete(
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
      console.error(`Error deleting ParentLink with id ${id}:`, error);
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
