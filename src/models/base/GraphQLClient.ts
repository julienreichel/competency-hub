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
            'studentProgress.*',
            'evaluationAttempts.*',
            'evaluationAttempts.evaluation.*',
            'projects.*',
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

  async getUserSentMessages(id: string): Promise<Schema['Message']['type'][]> {
    try {
      const result = await this.client.models.User.get(
        { id },
        {
          authMode: 'userPool',
          selectionSet: ['id', 'sentMessages.*'],
        },
      );
      if (result.errors || !result.data) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return (result.data.sentMessages as unknown as Schema['Message']['type'][]) || [];
    } catch (error) {
      console.error(`Error getting User with relations id ${id}:`, error);
      throw error;
    }
  }

  async getUserReceivedMessages(id: string): Promise<Schema['MessageTarget']['type'][]> {
    try {
      const result = await this.client.models.User.get(
        { id },
        {
          authMode: 'userPool',
          selectionSet: ['id', 'receivedMessages.*', 'receivedMessages.message.*'],
        },
      );
      if (result.errors || !result.data) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return (result.data.receivedMessages as unknown as Schema['MessageTarget']['type'][]) || [];
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

  async createDomain(
    data: Schema['Domain']['createType'],
  ): Promise<Schema['Domain']['type'] | null> {
    try {
      const result = await this.client.models.Domain.create(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error creating Domain:', error);
      throw error;
    }
  }

  async updateDomain(
    data: Schema['Domain']['updateType'],
  ): Promise<Schema['Domain']['type'] | null> {
    try {
      const result = await this.client.models.Domain.update(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error updating Domain:', error);
      throw error;
    }
  }

  async deleteDomain(id: string): Promise<Schema['Domain']['type'] | null> {
    try {
      const result = await this.client.models.Domain.delete(
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
      console.error(`Error deleting Domain with ID ${id}:`, error);
      throw error;
    }
  }

  async getDomain(id: string): Promise<Schema['Domain']['type'] | null> {
    try {
      const result = await this.client.models.Domain.get(
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
      console.error(`Error getting Domain with id ${id}:`, error);
      throw error;
    }
  }

  async getDomainWithHierarchy(id: string): Promise<Schema['Domain']['type'] | null> {
    try {
      const result = await this.client.models.Domain.get(
        { id },
        {
          authMode: 'userPool',
          selectionSet: [
            'id',
            'name',
            'colorCode',
            'createdAt',
            'updatedAt',
            'competencies.*',
            'competencies.subCompetencies.*',
            'competencies.subCompetencies.resources.*',
            'competencies.subCompetencies.resources.person.*',
            'competencies.subCompetencies.evaluations.*',
          ],
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as unknown as Schema['Domain']['type'];
    } catch (error) {
      console.error(`Error getting Domain hierarchy for id ${id}:`, error);
      throw error;
    }
  }

  async listDomains(filter?: Record<string, unknown>): Promise<Schema['Domain']['type'][]> {
    try {
      const result = await this.client.models.Domain.list({
        authMode: 'userPool',
        selectionSet: ['id', 'name', 'colorCode', 'createdAt', 'updatedAt', 'competencies.*'],
        filter,
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as unknown as Schema['Domain']['type'][];
    } catch (error) {
      console.error('Error listing Domains:', error);
      throw error;
    }
  }

  async createCompetency(
    data: Schema['Competency']['createType'],
  ): Promise<Schema['Competency']['type'] | null> {
    try {
      const result = await this.client.models.Competency.create(data, {
        authMode: 'userPool',
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

  async updateCompetency(
    data: Schema['Competency']['updateType'],
  ): Promise<Schema['Competency']['type'] | null> {
    try {
      const result = await this.client.models.Competency.update(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error updating Competency:', error);
      throw error;
    }
  }

  async deleteCompetency(id: string): Promise<Schema['Competency']['type'] | null> {
    try {
      const result = await this.client.models.Competency.delete(
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
      console.error(`Error deleting Competency with ID ${id}:`, error);
      throw error;
    }
  }

  async getCompetency(id: string): Promise<Schema['Competency']['type'] | null> {
    try {
      const result = await this.client.models.Competency.get(
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
      console.error(`Error getting Competency with ID ${id}:`, error);
      throw error;
    }
  }

  async getCompetencyWithDetails(id: string): Promise<Schema['Competency']['type'] | null> {
    try {
      const result = await this.client.models.Competency.get(
        { id },
        {
          authMode: 'userPool',
          selectionSet: [
            'id',
            'domainId',
            'domain.*',
            'name',
            'description',
            'objectives',
            'createdAt',
            'updatedAt',
            'subCompetencies.*',
            'subCompetencies.resources.*',
            'subCompetencies.resources.person.*',
          ],
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as unknown as Schema['Competency']['type'];
    } catch (error) {
      console.error(`Error getting Competency details for ID ${id}:`, error);
      throw error;
    }
  }

  async listCompetencies(
    filter?: Record<string, unknown>,
  ): Promise<Schema['Competency']['type'][]> {
    try {
      const options: { authMode: 'userPool'; filter?: Record<string, unknown> } = {
        authMode: 'userPool',
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

  async createSubCompetency(
    data: Schema['SubCompetency']['createType'],
  ): Promise<Schema['SubCompetency']['type'] | null> {
    try {
      const result = await this.client.models.SubCompetency.create(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error creating SubCompetency:', error);
      throw error;
    }
  }

  async getSubCompetency(id: string): Promise<Schema['SubCompetency']['type'] | null> {
    try {
      const result = await this.client.models.SubCompetency.get(
        { id },
        {
          authMode: 'userPool',
          selectionSet: [
            'id',
            'competencyId',
            'competency.*',
            'competency.domain.*',
            'name',
            'description',
            'objectives',
            'level',
            'createdAt',
            'updatedAt',
            'resources.*',
            'resources.person.*',
            'evaluations.*',
          ],
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as unknown as Schema['SubCompetency']['type'];
    } catch (error) {
      console.error(`Error getting SubCompetency with ID ${id}:`, error);
      throw error;
    }
  }
  async getSubCompetencyWithDetails(id: string): Promise<Schema['SubCompetency']['type'] | null> {
    try {
      const result = await this.client.models.SubCompetency.get(
        { id },
        {
          authMode: 'userPool',
          selectionSet: [
            'id',
            'competencyId',
            'competency.*',
            'competency.domain.*',
            'name',
            'description',
            'objectives',
            'level',
            'createdAt',
            'updatedAt',
            'resources.*',
            'resources.person.*',
            'studentProgress.*',
            'studentProgress.student.*',
            'evaluations.*',
            'evaluations.attempts.*',
            'evaluations.attempts.student.*',
            'projects.*',
            'projects.student.*',
          ],
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as unknown as Schema['SubCompetency']['type'];
    } catch (error) {
      console.error(`Error getting SubCompetency with ID ${id}:`, error);
      throw error;
    }
  }

  async listSubCompetencies(
    filter?: Record<string, unknown>,
  ): Promise<Schema['SubCompetency']['type'][]> {
    try {
      const options: { authMode: 'userPool'; filter?: Record<string, unknown> } = {
        authMode: 'userPool',
      };
      if (filter) {
        options.filter = filter;
      }
      const result = await this.client.models.SubCompetency.list(options);
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error listing SubCompetencies:', error);
      throw error;
    }
  }

  async updateSubCompetency(
    data: Schema['SubCompetency']['updateType'],
  ): Promise<Schema['SubCompetency']['type'] | null> {
    try {
      const result = await this.client.models.SubCompetency.update(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error updating SubCompetency:', error);
      throw error;
    }
  }

  async deleteSubCompetency(id: string): Promise<Schema['SubCompetency']['type'] | null> {
    try {
      const result = await this.client.models.SubCompetency.delete(
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
      console.error(`Error deleting SubCompetency with ID ${id}:`, error);
      throw error;
    }
  }

  async createResource(
    data: Schema['Resource']['createType'],
  ): Promise<Schema['Resource']['type'] | null> {
    try {
      if (!data.personUserId) delete data.personUserId;
      const result = await this.client.models.Resource.create(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error creating Resource:', error);
      throw error;
    }
  }

  async updateResource(
    data: Schema['Resource']['updateType'],
  ): Promise<Schema['Resource']['type'] | null> {
    try {
      if (!data.personUserId) delete data.personUserId;
      const result = await this.client.models.Resource.update(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error updating Resource:', error);
      throw error;
    }
  }

  async deleteResource(id: string): Promise<Schema['Resource']['type'] | null> {
    try {
      const result = await this.client.models.Resource.delete(
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
      console.error(`Error deleting Resource with ID ${id}:`, error);
      throw error;
    }
  }

  async getResource(id: string): Promise<Schema['Resource']['type'] | null> {
    try {
      const result = await this.client.models.Resource.get(
        { id },
        {
          authMode: 'userPool',
          selectionSet: [
            'id',
            'subCompetencyId',
            'type',
            'name',
            'description',
            'url',
            'personUserId',
            'person.*',
            'createdAt',
            'updatedAt',
          ],
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as unknown as Schema['Resource']['type'];
    } catch (error) {
      console.error(`Error getting Resource with ID ${id}:`, error);
      throw error;
    }
  }

  async listResources(filter?: Record<string, unknown>): Promise<Schema['Resource']['type'][]> {
    try {
      const options: { authMode: 'userPool'; filter?: Record<string, unknown> } = {
        authMode: 'userPool',
      };
      if (filter) {
        options.filter = filter;
      }
      const result = await this.client.models.Resource.list(options);
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error listing Resources:', error);
      throw error;
    }
  }

  async createEvaluation(
    data: Schema['Evaluation']['createType'],
  ): Promise<Schema['Evaluation']['type'] | null> {
    try {
      const result = await this.client.models.Evaluation.create(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error creating Evaluation:', error);
      throw error;
    }
  }

  async updateEvaluation(
    data: Schema['Evaluation']['updateType'],
  ): Promise<Schema['Evaluation']['type'] | null> {
    try {
      const result = await this.client.models.Evaluation.update(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error updating Evaluation:', error);
      throw error;
    }
  }

  async deleteEvaluation(id: string): Promise<Schema['Evaluation']['type'] | null> {
    try {
      const result = await this.client.models.Evaluation.delete(
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
      console.error(`Error deleting Evaluation with ID ${id}:`, error);
      throw error;
    }
  }

  async getEvaluation(id: string): Promise<Schema['Evaluation']['type'] | null> {
    try {
      const result = await this.client.models.Evaluation.get(
        { id },
        {
          authMode: 'userPool',
          selectionSet: [
            'id',
            'subCompetencyId',
            'subCompetency.*',
            'name',
            'description',
            'mode',
            'format',
            'durationMin',
            'url',
            'fileKey',
            'createdAt',
            'updatedAt',
          ],
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as unknown as Schema['Evaluation']['type'];
    } catch (error) {
      console.error(`Error getting Evaluation with ID ${id}:`, error);
      throw error;
    }
  }

  async createEvaluationAttempt(
    data: Schema['EvaluationAttempt']['createType'],
  ): Promise<Schema['EvaluationAttempt']['type'] | null> {
    try {
      const result = await this.client.models.EvaluationAttempt.create(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error creating EvaluationAttempt:', error);
      throw error;
    }
  }

  async updateEvaluationAttempt(
    data: Schema['EvaluationAttempt']['updateType'],
  ): Promise<Schema['EvaluationAttempt']['type'] | null> {
    try {
      const result = await this.client.models.EvaluationAttempt.update(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error updating EvaluationAttempt:', error);
      throw error;
    }
  }
  async createStudentProgress(
    data: Schema['StudentSubCompetencyProgress']['createType'],
  ): Promise<Schema['StudentSubCompetencyProgress']['type'] | null> {
    try {
      const result = await this.client.models.StudentSubCompetencyProgress.create(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error creating StudentSubCompetencyProgress:', error);
      throw error;
    }
  }

  async updateStudentProgress(
    data: Schema['StudentSubCompetencyProgress']['updateType'],
  ): Promise<Schema['StudentSubCompetencyProgress']['type'] | null> {
    try {
      const result = await this.client.models.StudentSubCompetencyProgress.update(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error updating StudentSubCompetencyProgress:', error);
      throw error;
    }
  }

  async createProject(
    data: Schema['Project']['createType'],
  ): Promise<Schema['Project']['type'] | null> {
    try {
      const result = await this.client.models.Project.create(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error creating Project:', error);
      throw error;
    }
  }

  async updateProject(
    data: Schema['Project']['updateType'],
  ): Promise<Schema['Project']['type'] | null> {
    try {
      const result = await this.client.models.Project.update(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data;
    } catch (error) {
      console.error('Error updating Project:', error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<Schema['Project']['type'] | null> {
    try {
      const result = await this.client.models.Project.delete(
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
      console.error(`Error deleting Project with ID ${id}:`, error);
      throw error;
    }
  }

  async createMessage(
    data: Schema['Message']['createType'],
  ): Promise<Schema['Message']['type'] | null> {
    try {
      const result = await this.client.models.Message.create(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as Schema['Message']['type'];
    } catch (error) {
      console.error('Error creating Message:', error);
      throw error;
    }
  }

  async getMessageWithReplies(id: string): Promise<Schema['Message']['type'] | null> {
    try {
      const result = await this.client.models.Message.get(
        { id },
        {
          authMode: 'userPool',
          selectionSet: [
            'id',
            'title',
            'body',
            'kind',
            'senderId',
            'parentId',
            'subCompetencyId',
            'projectId',
            'createdAt',
            'updatedAt',
            'replies.*',
            'sender.*',
            'targets.*',
            'targets.user.*',
          ],
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as unknown as Schema['Message']['type'];
    } catch (error) {
      console.error(`Error getting Message with id ${id}:`, error);
      throw error;
    }
  }

  async getMessage(id: string): Promise<Schema['Message']['type'] | null> {
    try {
      const result = await this.client.models.Message.get(
        { id },
        {
          authMode: 'userPool',
          selectionSet: [
            'id',
            'title',
            'body',
            'kind',
            'senderId',
            'parentId',
            'subCompetencyId',
            'projectId',
            'createdAt',
            'updatedAt',
            'sender.*',
            'targets.*',
            'targets.user.*',
          ],
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as unknown as Schema['Message']['type'];
    } catch (error) {
      console.error(`Error getting Message with id ${id}:`, error);
      throw error;
    }
  }

  async listMessages(filter?: Record<string, unknown>): Promise<Schema['Message']['type'][]> {
    try {
      const result = await this.client.models.Message.list({
        authMode: 'userPool',
        selectionSet: [
          'id',
          'title',
          'body',
          'kind',
          'senderId',
          'parentId',
          'subCompetencyId',
          'projectId',
          'createdAt',
          'updatedAt',
          'sender.*',
          'targets.*',
          'targets.user.*',
        ],
        ...(filter ? { filter } : {}),
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as unknown as Schema['Message']['type'][];
    } catch (error) {
      console.error('Error listing Messages:', error);
      throw error;
    }
  }

  async updateMessage(
    data: Schema['Message']['updateType'],
  ): Promise<Schema['Message']['type'] | null> {
    try {
      const result = await this.client.models.Message.update(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as Schema['Message']['type'];
    } catch (error) {
      console.error('Error updating Message:', error);
      throw error;
    }
  }

  async deleteMessage(id: string): Promise<Schema['Message']['type'] | null> {
    try {
      const result = await this.client.models.Message.delete(
        { id },
        {
          authMode: 'userPool',
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as Schema['Message']['type'];
    } catch (error) {
      console.error(`Error deleting Message with id ${id}:`, error);
      throw error;
    }
  }

  async createMessageTarget(
    data: Schema['MessageTarget']['createType'],
  ): Promise<Schema['MessageTarget']['type'] | null> {
    try {
      const result = await this.client.models.MessageTarget.create(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as Schema['MessageTarget']['type'];
    } catch (error) {
      console.error('Error creating MessageTarget:', error);
      throw error;
    }
  }

  async getMessageTarget(id: string): Promise<Schema['MessageTarget']['type'] | null> {
    try {
      const result = await this.client.models.MessageTarget.get(
        { id },
        {
          authMode: 'userPool',
          selectionSet: ['id', 'messageId', 'userId', 'read', 'readDate', 'archived', 'user.*'],
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as unknown as Schema['MessageTarget']['type'];
    } catch (error) {
      console.error(`Error getting MessageTarget with id ${id}:`, error);
      throw error;
    }
  }

  async listMessageTargets(
    filter?: Record<string, unknown>,
  ): Promise<Schema['MessageTarget']['type'][]> {
    try {
      const result = await this.client.models.MessageTarget.list({
        authMode: 'userPool',
        selectionSet: ['id', 'messageId', 'userId', 'read', 'readDate', 'archived', 'user.*'],
        ...(filter ? { filter } : {}),
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as unknown as Schema['MessageTarget']['type'][];
    } catch (error) {
      console.error('Error listing MessageTargets:', error);
      throw error;
    }
  }

  async updateMessageTarget(
    data: Schema['MessageTarget']['updateType'],
  ): Promise<Schema['MessageTarget']['type'] | null> {
    try {
      const result = await this.client.models.MessageTarget.update(data, {
        authMode: 'userPool',
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as Schema['MessageTarget']['type'];
    } catch (error) {
      console.error('Error updating MessageTarget:', error);
      throw error;
    }
  }

  async deleteMessageTarget(id: string): Promise<Schema['MessageTarget']['type'] | null> {
    try {
      const result = await this.client.models.MessageTarget.delete(
        { id },
        {
          authMode: 'userPool',
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as Schema['MessageTarget']['type'];
    } catch (error) {
      console.error(`Error deleting MessageTarget with id ${id}:`, error);
      throw error;
    }
  }

  async getProject(id: string): Promise<Schema['Project']['type'] | null> {
    try {
      const result = await this.client.models.Project.get(
        { id },
        {
          authMode: 'userPool',
          selectionSet: [
            'id',
            'studentId',
            'student.*',
            'subCompetencyId',
            'subCompetency.*',
            'name',
            'description',
            'fileKey',
            'status',
            'createdAt',
            'updatedAt',
          ],
        },
      );
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as unknown as Schema['Project']['type'];
    } catch (error) {
      console.error(`Error getting Project with ID ${id}:`, error);
      throw error;
    }
  }

  async listProjects(options?: {
    filter?: Record<string, unknown>;
    limit?: number;
  }): Promise<Schema['Project']['type'][]> {
    try {
      const result = await this.client.models.Project.list({
        ...(options?.filter && { filter: options.filter }),
        ...(options?.limit && { limit: options.limit }),
        authMode: 'userPool',
        selectionSet: [
          'id',
          'studentId',
          'student.*',
          'subCompetencyId',
          'subCompetency.*',
          'name',
          'description',
          'fileKey',
          'status',
          'createdAt',
          'updatedAt',
        ],
      });
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      return result.data as unknown as Schema['Project']['type'][];
    } catch (error) {
      console.error('Error listing Projects:', error);
      throw error;
    }
  }
}

// Singleton instance
export const graphQLClient = new GraphQLClient();
