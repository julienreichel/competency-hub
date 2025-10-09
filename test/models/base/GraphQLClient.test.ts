import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GraphQLClient } from '../../../src/models/base/GraphQLClient';

// Mock the Amplify client
vi.mock('aws-amplify/data', () => ({
  generateClient: vi.fn(() => ({
    models: {
      User: {
        create: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      Domain: {
        create: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      Competency: {
        create: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      SubCompetency: {
        create: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      Resource: {
        create: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      TeachingAssignment: {
        create: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      ParentLink: {
        create: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      Evaluation: {
        create: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      EvaluationAttempt: {
        create: vi.fn(),
        update: vi.fn(),
      },
      StudentSubCompetencyProgress: {
        create: vi.fn(),
        update: vi.fn(),
      },
      Project: {
        create: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      Message: {
        create: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      MessageTarget: {
        create: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  })),
}));

interface MockAmplifyClient {
  models: {
    User: {
      create: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
      list: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    Domain: {
      create: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
      list: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    Competency: {
      create: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
      list: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    SubCompetency: {
      create: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
      list: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    Resource: {
      create: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
      list: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    TeachingAssignment: {
      create: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
      list: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    ParentLink: {
      create: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
      list: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    Evaluation: {
      create: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    EvaluationAttempt: {
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    StudentSubCompetencyProgress: {
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    Project: {
      create: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
      list: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    Message: {
      create: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
      list: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    MessageTarget: {
      create: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
      list: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };
}
// eslint-disable-next-line max-lines-per-function
describe('GraphQLClient', () => {
  let graphQLClient: GraphQLClient;
  let mockAmplifyClient: MockAmplifyClient;

  /**
   * DRY helper to test GraphQL error handling for GraphQLClient methods.
   * @param label - Name of the method for test description
   * @param method - The method to test (should be bound to the client instance)
   * @param args - Arguments to pass to the method
   * @param mockFn - The mock function to set up the error response
   */
  function testGraphQLErrors(
    label: string,
    method: (...args: unknown[]) => Promise<unknown>,
    args: unknown[],
    getMockFn: () => ReturnType<typeof vi.fn>,
  ): void {
    it(`throws when GraphQL returns errors for ${label}`, async () => {
      const graphQLErrors = [{ message: 'Denied' }];
      const mockFn = getMockFn();
      mockFn.mockResolvedValueOnce({ data: null, errors: graphQLErrors });
      await expect(method(...args)).rejects.toThrow(
        `GraphQL errors: ${JSON.stringify(graphQLErrors)}`,
      );
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    graphQLClient = new GraphQLClient();
    // Get the mocked client instance
    mockAmplifyClient = (graphQLClient as unknown as { client: MockAmplifyClient }).client;
  });

  // --- Admin user mutations ---
  type AdminMutations = {
    addUserToGroup: ReturnType<typeof vi.fn>;
  };
  describe('Admin user mutations', () => {
    let adminMutations: AdminMutations;
    beforeEach(() => {
      adminMutations = {
        addUserToGroup: vi.fn(),
      };
      // @ts-expect-error: override for test
      graphQLClient.client = { mutations: adminMutations };
    });

    describe('addUserToGroup', () => {
      it('should return the updated user on success', async () => {
        const user = { id: 'user-1' };
        adminMutations.addUserToGroup.mockResolvedValue({
          errors: null,
          data: JSON.stringify({ user }),
        });
        const result = await graphQLClient.addUserToGroup('user-1', 'Admin');
        expect(result).toEqual(user);
        expect(adminMutations.addUserToGroup).toHaveBeenCalledWith(
          { userId: 'user-1', groupName: 'Admin' },
          { authMode: 'userPool' },
        );
      });
      it('should throw on GraphQL errors', async () => {
        adminMutations.addUserToGroup.mockResolvedValue({
          errors: [{ message: 'Denied' }],
        });
        await expect(graphQLClient.addUserToGroup('user-1', 'Admin')).rejects.toThrow(/Denied/);
      });
      it('should throw on network error', async () => {
        adminMutations.addUserToGroup.mockRejectedValue(new Error('Network error'));
        await expect(graphQLClient.addUserToGroup('user-1', 'Admin')).rejects.toThrow(
          'Network error',
        );
      });
    });
  });

  describe('User operations', () => {
    const mockUserData = {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
    };

    describe('getUser', () => {
      it('should get a user successfully', async () => {
        const id = 'user-1';
        mockAmplifyClient.models.User.get.mockResolvedValue({
          data: mockUserData,
          errors: null,
        });

        const result = await graphQLClient.getUser(id);

        expect(result).toEqual(mockUserData);
        expect(mockAmplifyClient.models.User.get).toHaveBeenCalledWith(
          { id },
          { authMode: 'userPool' },
        );
      });

      it('should request user with extended relations', async () => {
        mockAmplifyClient.models.User.get.mockResolvedValue({ data: mockUserData, errors: null });

        await graphQLClient.getUserWithRelations('user-1');

        expect(mockAmplifyClient.models.User.get).toHaveBeenCalledWith(
          { id: 'user-1' },
          expect.objectContaining({
            selectionSet: expect.arrayContaining([
              'evaluationAttempts.*',
              'evaluationAttempts.evaluation.*',
            ]),
          }),
        );
      });

      it('should handle GraphQL errors during user retrieval', async () => {
        const email = 'john@example.com';
        const graphQLErrors = [{ message: 'User not found' }];
        mockAmplifyClient.models.User.get.mockResolvedValue({
          data: null,
          errors: graphQLErrors,
        });

        await expect(graphQLClient.getUser(email)).rejects.toThrow(
          `GraphQL errors: ${JSON.stringify(graphQLErrors)}`,
        );
      });

      it('should handle network errors during user retrieval', async () => {
        const email = 'john@example.com';
        const networkError = new Error('Network timeout');
        mockAmplifyClient.models.User.get.mockRejectedValue(networkError);

        await expect(graphQLClient.getUser(email)).rejects.toThrow('Network timeout');
      });
    });

    describe('listUsers', () => {
      it('should list users without filter', async () => {
        const mockUsers = [mockUserData];
        mockAmplifyClient.models.User.list.mockResolvedValue({
          data: mockUsers,
          errors: null,
        });

        const result = await graphQLClient.listUsers();

        expect(result).toEqual(mockUsers);
        expect(mockAmplifyClient.models.User.list).toHaveBeenCalledWith({
          authMode: 'userPool',
        });
      });

      it('should list users with filter', async () => {
        const filter = { name: { eq: 'John' } };
        const mockUsers = [mockUserData];
        mockAmplifyClient.models.User.list.mockResolvedValue({
          data: mockUsers,
          errors: null,
        });

        const result = await graphQLClient.listUsers(filter);

        expect(result).toEqual(mockUsers);
        expect(mockAmplifyClient.models.User.list).toHaveBeenCalledWith({
          authMode: 'userPool',
          filter,
        });
      });

      it('should handle GraphQL errors during user listing', async () => {
        const graphQLErrors = [{ message: 'Access denied' }];
        mockAmplifyClient.models.User.list.mockResolvedValue({
          data: [],
          errors: graphQLErrors,
        });

        await expect(graphQLClient.listUsers()).rejects.toThrow(
          `GraphQL errors: ${JSON.stringify(graphQLErrors)}`,
        );
      });
    });

    describe('updateUser', () => {
      it('should update a user successfully', async () => {
        const id = 'user-1';
        const updateData = { name: 'Jane Doe' };
        const updatedUser = { ...mockUserData, ...updateData };

        mockAmplifyClient.models.User.update.mockResolvedValue({
          data: updatedUser,
          errors: null,
        });

        const result = await graphQLClient.updateUser(id, updateData);

        expect(result).toEqual(updatedUser);
        expect(mockAmplifyClient.models.User.update).toHaveBeenCalledWith(
          { id, ...updateData },
          { authMode: 'userPool' },
        );
      });

      it('should handle GraphQL errors during user update', async () => {
        const email = 'john@example.com';
        const updateData = { name: 'Jane Doe' };
        const graphQLErrors = [{ message: 'Validation failed' }];

        mockAmplifyClient.models.User.update.mockResolvedValue({
          data: null,
          errors: graphQLErrors,
        });

        await expect(graphQLClient.updateUser(email, updateData)).rejects.toThrow(
          `GraphQL errors: ${JSON.stringify(graphQLErrors)}`,
        );
      });
    });

    describe('deleteUser', () => {
      it('should delete a user successfully', async () => {
        const id = 'user-1';
        mockAmplifyClient.models.User.delete.mockResolvedValue({
          data: mockUserData,
          errors: null,
        });

        const result = await graphQLClient.deleteUser(id);

        expect(result).toEqual(mockUserData);
        expect(mockAmplifyClient.models.User.delete).toHaveBeenCalledWith(
          { id },
          { authMode: 'userPool' },
        );
      });

      it('should handle GraphQL errors during user deletion', async () => {
        const email = 'john@example.com';
        const graphQLErrors = [{ message: 'Cannot delete user' }];

        mockAmplifyClient.models.User.delete.mockResolvedValue({
          data: null,
          errors: graphQLErrors,
        });

        await expect(graphQLClient.deleteUser(email)).rejects.toThrow(
          `GraphQL errors: ${JSON.stringify(graphQLErrors)}`,
        );
        await expect(graphQLClient.deleteUser('john@example.com')).rejects.toThrow(
          `GraphQL errors: ${JSON.stringify(graphQLErrors)}`,
        );
      });
    });

    it('retrieves sent messages for a user', async () => {
      const sentMessages = [{ id: 'message-1' }];
      mockAmplifyClient.models.User.get.mockResolvedValue({
        data: { id: 'user-1', sentMessages },
        errors: null,
      });

      const result = await graphQLClient.getUserSentMessages('user-1');

      expect(result).toEqual(sentMessages);
      expect(mockAmplifyClient.models.User.get).toHaveBeenCalledWith(
        { id: 'user-1' },
        {
          authMode: 'userPool',
          selectionSet: expect.arrayContaining([
            'id',
            'sentMessages.*',
            'sentMessages.targets.*',
            'sentMessages.targets.user.*',
          ]),
        },
      );
    });

    it('retrieves received messages for a user with message relation', async () => {
      const receivedMessages = [
        {
          id: 'target-1',
          messageId: 'message-1',
          message: { id: 'message-1' },
        },
      ];
      mockAmplifyClient.models.User.get.mockResolvedValue({
        data: { id: 'user-1', receivedMessages },
        errors: null,
      });

      const result = await graphQLClient.getUserReceivedMessages('user-1');

      expect(result).toEqual(receivedMessages);
      expect(mockAmplifyClient.models.User.get).toHaveBeenCalledWith(
        { id: 'user-1' },
        {
          authMode: 'userPool',
          selectionSet: expect.arrayContaining([
            'id',
            'receivedMessages.*',
            'receivedMessages.message.*',
            'receivedMessages.message.sender.*',
          ]),
        },
      );
    });
  });

  describe('StudentSubCompetencyProgress operations', () => {
    const mockProgress = {
      id: 'progress-1',
      studentId: 'student-1',
      subCompetencyId: 'sub-1',
      status: 'InProgress',
      percent: 50,
      lockOverride: 'Unlocked',
      recommended: false,
    };

    describe('createStudentProgress', () => {
      it('should return created progress when successful', async () => {
        // Arrange
        mockAmplifyClient.models.StudentSubCompetencyProgress.create.mockResolvedValue({
          data: mockProgress,
          errors: null,
        });

        // Act
        const result = await graphQLClient.createStudentProgress({
          studentId: mockProgress.studentId,
          subCompetencyId: mockProgress.subCompetencyId,
        });

        // Assert
        expect(mockAmplifyClient.models.StudentSubCompetencyProgress.create).toHaveBeenCalledWith(
          { studentId: mockProgress.studentId, subCompetencyId: mockProgress.subCompetencyId },
          { authMode: 'userPool' },
        );
        expect(result).toEqual(mockProgress);
      });

      it('should throw when GraphQL reports errors', async () => {
        // Arrange
        const graphQLErrors = [{ message: 'Denied' }];
        mockAmplifyClient.models.StudentSubCompetencyProgress.create.mockResolvedValue({
          data: null,
          errors: graphQLErrors,
        });

        // Act & Assert
        await expect(
          graphQLClient.createStudentProgress({
            studentId: mockProgress.studentId,
            subCompetencyId: mockProgress.subCompetencyId,
          }),
        ).rejects.toThrow(`GraphQL errors: ${JSON.stringify(graphQLErrors)}`);
      });

      it('should propagate network errors', async () => {
        // Arrange
        const networkError = new Error('Network down');
        mockAmplifyClient.models.StudentSubCompetencyProgress.create.mockRejectedValue(
          networkError,
        );

        // Act & Assert
        await expect(
          graphQLClient.createStudentProgress({
            studentId: mockProgress.studentId,
            subCompetencyId: mockProgress.subCompetencyId,
          }),
        ).rejects.toThrow('Network down');
      });
    });

    describe('updateStudentProgress', () => {
      it('should return updated progress on success', async () => {
        // Arrange
        mockAmplifyClient.models.StudentSubCompetencyProgress.update.mockResolvedValue({
          data: mockProgress,
          errors: null,
        });

        // Act
        const result = await graphQLClient.updateStudentProgress({
          id: mockProgress.id,
          status: 'Validated',
        });

        // Assert
        expect(mockAmplifyClient.models.StudentSubCompetencyProgress.update).toHaveBeenCalledWith(
          { id: mockProgress.id, status: 'Validated' },
          { authMode: 'userPool' },
        );
        expect(result).toEqual(mockProgress);
      });

      it('should throw when GraphQL returns errors', async () => {
        // Arrange
        const graphQLErrors = [{ message: 'Update denied' }];
        mockAmplifyClient.models.StudentSubCompetencyProgress.update.mockResolvedValue({
          data: null,
          errors: graphQLErrors,
        });

        // Act & Assert
        await expect(
          graphQLClient.updateStudentProgress({ id: mockProgress.id, status: 'Validated' }),
        ).rejects.toThrow(`GraphQL errors: ${JSON.stringify(graphQLErrors)}`);
      });

      it('should propagate network errors while updating', async () => {
        // Arrange
        const networkError = new Error('Network error');
        mockAmplifyClient.models.StudentSubCompetencyProgress.update.mockRejectedValue(
          networkError,
        );

        // Act & Assert
        await expect(
          graphQLClient.updateStudentProgress({ id: mockProgress.id, status: 'Validated' }),
        ).rejects.toThrow('Network error');
      });
    });
  });

  describe('Domain operations', () => {
    const mockDomain = { id: 'domain-1', name: 'Mathematics' };

    it('creates a domain', async () => {
      mockAmplifyClient.models.Domain.create.mockResolvedValue({ data: mockDomain, errors: null });

      const result = await graphQLClient.createDomain({ name: mockDomain.name });

      expect(mockAmplifyClient.models.Domain.create).toHaveBeenCalledWith(
        { name: mockDomain.name },
        { authMode: 'userPool' },
      );
      expect(result).toEqual(mockDomain);
    });

    it('throws when createDomain reports errors', async () => {
      const graphQLErrors = [{ message: 'Denied' }];
      mockAmplifyClient.models.Domain.create.mockResolvedValue({
        data: null,
        errors: graphQLErrors,
      });

      await expect(graphQLClient.createDomain({ name: 'Invalid' })).rejects.toThrow(
        `GraphQL errors: ${JSON.stringify(graphQLErrors)}`,
      );
    });

    it('updates, deletes and lists domains', async () => {
      mockAmplifyClient.models.Domain.update.mockResolvedValue({ data: mockDomain, errors: null });
      mockAmplifyClient.models.Domain.delete.mockResolvedValue({ data: mockDomain, errors: null });
      mockAmplifyClient.models.Domain.list.mockResolvedValue({ data: [mockDomain], errors: null });

      await expect(
        graphQLClient.updateDomain({ id: 'domain-1', name: 'Updated' }),
      ).resolves.toEqual(mockDomain);
      await expect(graphQLClient.deleteDomain('domain-1')).resolves.toEqual(mockDomain);
      const listed = await graphQLClient.listDomains();
      expect(listed).toEqual([mockDomain]);
    });

    it('gets domains with hierarchies', async () => {
      mockAmplifyClient.models.Domain.get.mockResolvedValue({ data: mockDomain, errors: null });

      await graphQLClient.getDomain('domain-1');
      expect(mockAmplifyClient.models.Domain.get).toHaveBeenCalledWith(
        { id: 'domain-1' },
        { authMode: 'userPool' },
      );

      await graphQLClient.getDomainWithHierarchy('domain-1');
      expect(mockAmplifyClient.models.Domain.get).toHaveBeenLastCalledWith(
        { id: 'domain-1' },
        expect.objectContaining({
          authMode: 'userPool',
          selectionSet: expect.arrayContaining(['competencies.*']),
        }),
      );
    });
  });

  describe('Competency operations', () => {
    const mockCompetency = { id: 'comp-1', name: 'Fractions' };

    it('handles CRUD for competencies', async () => {
      mockAmplifyClient.models.Competency.create.mockResolvedValue({
        data: mockCompetency,
        errors: null,
      });
      mockAmplifyClient.models.Competency.update.mockResolvedValue({
        data: mockCompetency,
        errors: null,
      });
      mockAmplifyClient.models.Competency.delete.mockResolvedValue({
        data: mockCompetency,
        errors: null,
      });
      mockAmplifyClient.models.Competency.get.mockResolvedValue({
        data: mockCompetency,
        errors: null,
      });
      mockAmplifyClient.models.Competency.list.mockResolvedValue({
        data: [mockCompetency],
        errors: null,
      });

      await expect(
        graphQLClient.createCompetency({ name: 'Fractions', domainId: 'domain-1' }),
      ).resolves.toEqual(mockCompetency);
      await expect(
        graphQLClient.updateCompetency({ id: 'comp-1', name: 'Updated' }),
      ).resolves.toEqual(mockCompetency);
      await expect(graphQLClient.deleteCompetency('comp-1')).resolves.toEqual(mockCompetency);
      await expect(graphQLClient.getCompetency('comp-1')).resolves.toEqual(mockCompetency);
      const listed = await graphQLClient.listCompetencies();
      expect(listed).toEqual([mockCompetency]);
    });

    it('gets competency with details', async () => {
      mockAmplifyClient.models.Competency.get.mockResolvedValue({
        data: mockCompetency,
        errors: null,
      });
      await graphQLClient.getCompetencyWithDetails('comp-1');
      expect(mockAmplifyClient.models.Competency.get).toHaveBeenCalledWith(
        { id: 'comp-1' },
        expect.objectContaining({ selectionSet: expect.arrayContaining(['subCompetencies.*']) }),
      );
    });
  });

  describe('SubCompetency operations', () => {
    const mockSub = { id: 'sub-1', name: 'Identify fractions' };

    it('handles CRUD for sub-competencies', async () => {
      mockAmplifyClient.models.SubCompetency.create.mockResolvedValue({
        data: mockSub,
        errors: null,
      });
      mockAmplifyClient.models.SubCompetency.update.mockResolvedValue({
        data: mockSub,
        errors: null,
      });
      mockAmplifyClient.models.SubCompetency.delete.mockResolvedValue({
        data: mockSub,
        errors: null,
      });
      mockAmplifyClient.models.SubCompetency.get.mockResolvedValue({ data: mockSub, errors: null });
      mockAmplifyClient.models.SubCompetency.list.mockResolvedValue({
        data: [mockSub],
        errors: null,
      });

      await expect(
        graphQLClient.createSubCompetency({ competencyId: 'comp-1', name: 'Identify' }),
      ).resolves.toEqual(mockSub);
      await expect(
        graphQLClient.updateSubCompetency({ id: 'sub-1', name: 'Updated' }),
      ).resolves.toEqual(mockSub);
      await expect(graphQLClient.deleteSubCompetency('sub-1')).resolves.toEqual(mockSub);
      await expect(graphQLClient.getSubCompetency('sub-1')).resolves.toEqual(mockSub);
      const listed = await graphQLClient.listSubCompetencies();
      expect(listed).toEqual([mockSub]);
    });

    it('gets sub-competency with details', async () => {
      mockAmplifyClient.models.SubCompetency.get.mockResolvedValue({ data: mockSub, errors: null });
      await graphQLClient.getSubCompetencyWithDetails('sub-1');
      expect(mockAmplifyClient.models.SubCompetency.get).toHaveBeenCalledWith(
        { id: 'sub-1' },
        expect.objectContaining({
          selectionSet: expect.arrayContaining(['studentProgress.*', 'evaluations.*']),
        }),
      );
    });
  });

  describe('Resource operations', () => {
    const mockResource = { id: 'res-1', name: 'Worksheet', personUserId: 'user-1' };

    it('creates and updates resources removing falsy personUserId', async () => {
      mockAmplifyClient.models.Resource.create.mockResolvedValue({
        data: mockResource,
        errors: null,
      });
      mockAmplifyClient.models.Resource.update.mockResolvedValue({
        data: mockResource,
        errors: null,
      });

      await graphQLClient.createResource({
        id: 'res-1',
        subCompetencyId: 'sub-1',
        name: 'Worksheet',
      });
      expect(mockAmplifyClient.models.Resource.create).toHaveBeenCalledWith(
        { id: 'res-1', subCompetencyId: 'sub-1', name: 'Worksheet' },
        { authMode: 'userPool' },
      );

      await graphQLClient.updateResource({ id: 'res-1', name: 'Updated' });
      expect(mockAmplifyClient.models.Resource.update).toHaveBeenCalledWith(
        { id: 'res-1', name: 'Updated' },
        { authMode: 'userPool' },
      );
    });

    it('handles delete/get/list resource', async () => {
      mockAmplifyClient.models.Resource.delete.mockResolvedValue({
        data: mockResource,
        errors: null,
      });
      mockAmplifyClient.models.Resource.get.mockResolvedValue({ data: mockResource, errors: null });
      mockAmplifyClient.models.Resource.list.mockResolvedValue({
        data: [mockResource],
        errors: null,
      });

      await expect(graphQLClient.deleteResource('res-1')).resolves.toEqual(mockResource);
      await expect(graphQLClient.getResource('res-1')).resolves.toEqual(mockResource);
      await expect(graphQLClient.listResources()).resolves.toEqual([mockResource]);
    });
  });

  describe('Evaluation operations', () => {
    const mockEvaluation = { id: 'eval-1', name: 'Quiz', subCompetencyId: 'sub-1' };

    it('handles CRUD for evaluations', async () => {
      mockAmplifyClient.models.Evaluation.create.mockResolvedValue({
        data: mockEvaluation,
        errors: null,
      });
      mockAmplifyClient.models.Evaluation.update.mockResolvedValue({
        data: mockEvaluation,
        errors: null,
      });
      mockAmplifyClient.models.Evaluation.delete.mockResolvedValue({
        data: mockEvaluation,
        errors: null,
      });
      mockAmplifyClient.models.Evaluation.get.mockResolvedValue({
        data: mockEvaluation,
        errors: null,
      });

      await expect(
        graphQLClient.createEvaluation({ name: 'Quiz', subCompetencyId: 'sub-1' }),
      ).resolves.toEqual(mockEvaluation);
      await expect(
        graphQLClient.updateEvaluation({ id: 'eval-1', name: 'Updated Quiz' }),
      ).resolves.toEqual(mockEvaluation);
      await expect(graphQLClient.deleteEvaluation('eval-1')).resolves.toEqual(mockEvaluation);
      await expect(graphQLClient.getEvaluation('eval-1')).resolves.toEqual(mockEvaluation);
    });

    it('propagates errors for evaluation create', async () => {
      const errors = [{ message: 'Denied' }];
      mockAmplifyClient.models.Evaluation.create.mockResolvedValue({ data: null, errors });
      await expect(
        graphQLClient.createEvaluation({ name: 'Quiz', subCompetencyId: 'sub-1' }),
      ).rejects.toThrow(`GraphQL errors: ${JSON.stringify(errors)}`);
    });
  });

  describe('EvaluationAttempt operations', () => {
    const mockAttempt = { id: 'attempt-1', evaluationId: 'eval-1', studentId: 'student-1' };

    it('creates and updates evaluation attempts', async () => {
      mockAmplifyClient.models.EvaluationAttempt.create.mockResolvedValue({
        data: mockAttempt,
        errors: null,
      });
      mockAmplifyClient.models.EvaluationAttempt.update.mockResolvedValue({
        data: mockAttempt,
        errors: null,
      });

      await expect(
        graphQLClient.createEvaluationAttempt({ evaluationId: 'eval-1', studentId: 'student-1' }),
      ).resolves.toEqual(mockAttempt);
      await expect(
        graphQLClient.updateEvaluationAttempt({ id: 'attempt-1', status: 'Completed' }),
      ).resolves.toEqual(mockAttempt);
    });
  });

  describe('Project operations', () => {
    const mockProject = {
      id: 'project-1',
      studentId: 'student-1',
      subCompetencyId: 'sub-1',
      name: 'My Science Project',
      status: 'Draft',
    };

    it('handles CRUD for projects', async () => {
      mockAmplifyClient.models.Project.create.mockResolvedValue({
        data: mockProject,
        errors: null,
      });
      mockAmplifyClient.models.Project.update.mockResolvedValue({
        data: mockProject,
        errors: null,
      });
      mockAmplifyClient.models.Project.delete.mockResolvedValue({
        data: mockProject,
        errors: null,
      });
      mockAmplifyClient.models.Project.get.mockResolvedValue({
        data: mockProject,
        errors: null,
      });
      mockAmplifyClient.models.Project.list.mockResolvedValue({
        data: [mockProject],
        errors: null,
      });

      await expect(
        graphQLClient.createProject({
          studentId: 'student-1',
          subCompetencyId: 'sub-1',
          name: 'My Science Project',
        }),
      ).resolves.toEqual(mockProject);
      await expect(
        graphQLClient.updateProject({ id: 'project-1', name: 'Updated Project' }),
      ).resolves.toEqual(mockProject);
      await expect(graphQLClient.deleteProject('project-1')).resolves.toEqual(mockProject);
      await expect(graphQLClient.getProject('project-1')).resolves.toEqual(mockProject);
    });

    it('propagates errors for project operations', async () => {
      const graphQLErrors = [{ message: 'Access denied' }];
      mockAmplifyClient.models.Project.create.mockResolvedValue({
        data: null,
        errors: graphQLErrors,
      });

      await expect(
        graphQLClient.createProject({
          studentId: 'student-1',
          subCompetencyId: 'sub-1',
          name: 'My Project',
        }),
      ).rejects.toThrow(`GraphQL errors: ${JSON.stringify(graphQLErrors)}`);
    });
  });

  describe('Message operations', () => {
    const rawMessage = {
      id: 'message-1',
      senderId: 'user-1',
      title: 'Hello',
      body: 'Welcome aboard',
      kind: 'Message',
    };

    it('creates and updates messages', async () => {
      mockAmplifyClient.models.Message.create.mockResolvedValue({
        data: rawMessage,
        errors: null,
      });
      mockAmplifyClient.models.Message.update.mockResolvedValue({
        data: rawMessage,
        errors: null,
      });
      mockAmplifyClient.models.Message.delete.mockResolvedValue({
        data: rawMessage,
        errors: null,
      });

      await expect(
        graphQLClient.createMessage({
          senderId: 'user-1',
          title: 'Hello',
          kind: 'Message',
        }),
      ).resolves.toEqual(rawMessage);

      await expect(
        graphQLClient.updateMessage({ id: 'message-1', body: 'Updated body' }),
      ).resolves.toEqual(rawMessage);

      await expect(graphQLClient.deleteMessage('message-1')).resolves.toEqual(rawMessage);
    });

    it('retrieves messages with and without replies', async () => {
      mockAmplifyClient.models.Message.get.mockResolvedValue({
        data: rawMessage,
        errors: null,
      });

      await graphQLClient.getMessage('message-1');
      expect(mockAmplifyClient.models.Message.get).toHaveBeenCalledWith(
        { id: 'message-1' },
        expect.objectContaining({
          selectionSet: expect.arrayContaining(['targets.user.*', 'parent.*']),
        }),
      );

      await graphQLClient.getMessageWithReplies('message-1');
      expect(mockAmplifyClient.models.Message.get).toHaveBeenLastCalledWith(
        { id: 'message-1' },
        expect.objectContaining({
          selectionSet: expect.arrayContaining([
            'replies.*',
            'replies.sender.*',
            'parent.*',
            'parent.sender.*',
          ]),
        }),
      );
    });

    it('lists messages with filters', async () => {
      mockAmplifyClient.models.Message.list.mockResolvedValue({
        data: [rawMessage],
        errors: null,
      });

      const result = await graphQLClient.listMessages({ senderId: { eq: 'user-1' } });

      expect(result).toEqual([rawMessage]);
      expect(mockAmplifyClient.models.Message.list).toHaveBeenCalledWith({
        authMode: 'userPool',
        selectionSet: expect.arrayContaining(['targets.user.*']),
        filter: { senderId: { eq: 'user-1' } },
      });
    });
  });

  describe('Message target operations', () => {
    const rawTarget = {
      id: 'target-1',
      messageId: 'message-1',
      userId: 'user-2',
      read: false,
      archived: false,
    };

    it('creates and updates message targets', async () => {
      mockAmplifyClient.models.MessageTarget.create.mockResolvedValue({
        data: rawTarget,
        errors: null,
      });
      mockAmplifyClient.models.MessageTarget.update.mockResolvedValue({
        data: rawTarget,
        errors: null,
      });
      mockAmplifyClient.models.MessageTarget.delete.mockResolvedValue({
        data: rawTarget,
        errors: null,
      });

      await expect(
        graphQLClient.createMessageTarget({ messageId: 'message-1', userId: 'user-2' }),
      ).resolves.toEqual(rawTarget);

      await expect(
        graphQLClient.updateMessageTarget({ id: 'target-1', read: true }),
      ).resolves.toEqual(rawTarget);

      await expect(graphQLClient.deleteMessageTarget('target-1')).resolves.toEqual(rawTarget);
    });

    it('retrieves and lists message targets with selection sets', async () => {
      mockAmplifyClient.models.MessageTarget.get.mockResolvedValue({
        data: rawTarget,
        errors: null,
      });

      await graphQLClient.getMessageTarget('target-1');
      expect(mockAmplifyClient.models.MessageTarget.get).toHaveBeenCalledWith(
        { id: 'target-1' },
        expect.objectContaining({
          selectionSet: expect.arrayContaining(['user.*', 'message.*']),
        }),
      );

      mockAmplifyClient.models.MessageTarget.list.mockResolvedValue({
        data: [rawTarget],
        errors: null,
      });

      const targets = await graphQLClient.listMessageTargets({ userId: { eq: 'user-2' } });

      expect(targets).toEqual([rawTarget]);
      expect(mockAmplifyClient.models.MessageTarget.list).toHaveBeenCalledWith({
        authMode: 'userPool',
        selectionSet: expect.arrayContaining(['user.*', 'message.*']),
        filter: { userId: { eq: 'user-2' } },
      });
    });
  });

  describe('Teaching assignments and parent links', () => {
    const mockAssignment = { id: 'assign-1' };
    const mockLink = { id: 'link-1' };

    it('handles teaching assignment CRUD', async () => {
      mockAmplifyClient.models.TeachingAssignment.list.mockResolvedValue({
        data: [mockAssignment],
        errors: null,
      });
      mockAmplifyClient.models.TeachingAssignment.create.mockResolvedValue({
        data: mockAssignment,
        errors: null,
      });
      mockAmplifyClient.models.TeachingAssignment.delete.mockResolvedValue({
        data: mockAssignment,
        errors: null,
      });

      await expect(graphQLClient.listTeachingAssignments()).resolves.toEqual([mockAssignment]);
      await expect(
        graphQLClient.createTeachingAssignment({ studentId: 's', educatorId: 'e' }),
      ).resolves.toEqual(mockAssignment);
      await expect(graphQLClient.deleteTeachingAssignment('assign-1')).resolves.toEqual(
        mockAssignment,
      );
    });

    it('handles parent link CRUD', async () => {
      mockAmplifyClient.models.ParentLink.list.mockResolvedValue({
        data: [mockLink],
        errors: null,
      });
      mockAmplifyClient.models.ParentLink.create.mockResolvedValue({
        data: mockLink,
        errors: null,
      });
      mockAmplifyClient.models.ParentLink.delete.mockResolvedValue({
        data: mockLink,
        errors: null,
      });

      await expect(graphQLClient.listParentLinks()).resolves.toEqual([mockLink]);
      await expect(
        graphQLClient.createParentLink({ studentId: 's', parentId: 'p' }),
      ).resolves.toEqual(mockLink);
      await expect(graphQLClient.deleteParentLink('link-1')).resolves.toEqual(mockLink);
    });
  });

  describe('Domain operations', () => {
    const rawDomain = { id: 'domain-1', name: 'Mathematics', colorCode: '#FF0000' };

    it('creates a domain', async () => {
      mockAmplifyClient.models.Domain.create.mockResolvedValue({ data: rawDomain, errors: null });

      const result = await graphQLClient.createDomain({
        name: 'Mathematics',
        colorCode: '#FF0000',
      });

      expect(result).toEqual(rawDomain);
      expect(mockAmplifyClient.models.Domain.create).toHaveBeenCalledWith(
        { name: 'Mathematics', colorCode: '#FF0000' },
        { authMode: 'userPool' },
      );
    });

    it('lists domains', async () => {
      mockAmplifyClient.models.Domain.list.mockResolvedValue({ data: [rawDomain], errors: null });

      const result = await graphQLClient.listDomains();

      expect(result).toEqual([rawDomain]);
      expect(mockAmplifyClient.models.Domain.list).toHaveBeenCalled();
    });
  });

  describe('Competency operations', () => {
    const rawCompetency = {
      id: 'comp-1',
      domainId: 'domain-1',
      name: 'Foundations',
      description: 'Basics',
      objectives: 'Understand fundamentals',
    };

    it('creates a competency', async () => {
      mockAmplifyClient.models.Competency.create.mockResolvedValue({
        data: rawCompetency,
        errors: null,
      });

      const result = await graphQLClient.createCompetency({
        domainId: 'domain-1',
        name: 'Foundations',
        description: 'Basics',
        objectives: 'Understand fundamentals',
      });

      expect(result).toEqual(rawCompetency);
      expect(mockAmplifyClient.models.Competency.create).toHaveBeenCalledWith(
        {
          domainId: 'domain-1',
          name: 'Foundations',
          description: 'Basics',
          objectives: 'Understand fundamentals',
        },
        { authMode: 'userPool' },
      );
    });

    it('retrieves competency with details', async () => {
      mockAmplifyClient.models.Competency.get.mockResolvedValue({
        data: rawCompetency,
        errors: null,
      });

      await graphQLClient.getCompetency('comp-1');

      expect(mockAmplifyClient.models.Competency.get).toHaveBeenCalledWith(
        { id: 'comp-1' },
        {
          authMode: 'userPool',
        },
      );
    });

    it('lists competencies with filter', async () => {
      mockAmplifyClient.models.Competency.list.mockResolvedValue({
        data: [rawCompetency],
        errors: null,
      });

      const result = await graphQLClient.listCompetencies({ domainId: { eq: 'domain-1' } });

      expect(result).toEqual([rawCompetency]);
      expect(mockAmplifyClient.models.Competency.list).toHaveBeenCalledWith({
        authMode: 'userPool',
        filter: { domainId: { eq: 'domain-1' } },
      });
    });
  });

  describe('Sub-competency operations', () => {
    const rawSubCompetency = {
      id: 'sub-1',
      competencyId: 'comp-1',
      name: 'Stage 1',
      level: 1,
    };

    it('creates a sub-competency', async () => {
      mockAmplifyClient.models.SubCompetency.create.mockResolvedValue({
        data: rawSubCompetency,
        errors: null,
      });

      const result = await graphQLClient.createSubCompetency({
        competencyId: 'comp-1',
        name: 'Stage 1',
        level: 1,
      });

      expect(result).toEqual(rawSubCompetency);
      expect(mockAmplifyClient.models.SubCompetency.create).toHaveBeenCalledWith(
        { competencyId: 'comp-1', name: 'Stage 1', level: 1 },
        { authMode: 'userPool' },
      );
    });
  });

  describe('Resource operations', () => {
    const rawResource = {
      id: 'res-1',
      subCompetencyId: 'sub-1',
      type: 'Link',
      name: 'Overview',
      url: 'https://example.com',
    };

    it('creates a resource', async () => {
      mockAmplifyClient.models.Resource.create.mockResolvedValue({
        data: rawResource,
        errors: null,
      });

      const result = await graphQLClient.createResource({
        subCompetencyId: 'sub-1',
        type: 'Link',
        name: 'Overview',
        url: 'https://example.com',
      });

      expect(result).toEqual(rawResource);
      expect(mockAmplifyClient.models.Resource.create).toHaveBeenCalledWith(
        { subCompetencyId: 'sub-1', type: 'Link', name: 'Overview', url: 'https://example.com' },
        { authMode: 'userPool' },
      );
    });
  });
  describe('GraphQL error handling (DRY)', () => {
    beforeEach(() => {
      // Ensure mocks are reset for each test
      vi.clearAllMocks();
    });

    testGraphQLErrors(
      'getUser',
      () => graphQLClient.getUser('id'),
      [],
      () => mockAmplifyClient.models.User.get,
    );
    testGraphQLErrors(
      'getUserWithRelations',
      () => graphQLClient.getUserWithRelations('id'),
      [],
      () => mockAmplifyClient.models.User.get,
    );
    testGraphQLErrors(
      'listUsers',
      () => graphQLClient.listUsers(),
      [],
      () => mockAmplifyClient.models.User.list,
    );
    testGraphQLErrors(
      'updateUser',
      () => graphQLClient.updateUser('id', { name: 'n' }),
      [],
      () => mockAmplifyClient.models.User.update,
    );
    testGraphQLErrors(
      'deleteUser',
      () => graphQLClient.deleteUser('id'),
      [],
      () => mockAmplifyClient.models.User.delete,
    );
    testGraphQLErrors(
      'getUserSentMessages',
      () => graphQLClient.getUserSentMessages('id'),
      [],
      () => mockAmplifyClient.models.User.get,
    );
    testGraphQLErrors(
      'getUserReceivedMessages',
      () => graphQLClient.getUserReceivedMessages('id'),
      [],
      () => mockAmplifyClient.models.User.get,
    );

    // TeachingAssignment
    testGraphQLErrors(
      'createTeachingAssignment',
      () => graphQLClient.createTeachingAssignment({ studentId: 's', educatorId: 'e' }),
      [],
      () => mockAmplifyClient.models.TeachingAssignment.create,
    );
    testGraphQLErrors(
      'deleteTeachingAssignment',
      () => graphQLClient.deleteTeachingAssignment('assign-1'),
      [],
      () => mockAmplifyClient.models.TeachingAssignment.delete,
    );
    testGraphQLErrors(
      'listTeachingAssignments',
      () => graphQLClient.listTeachingAssignments(),
      [],
      () => mockAmplifyClient.models.TeachingAssignment.list,
    );

    // ParentLink
    testGraphQLErrors(
      'createParentLink',
      () => graphQLClient.createParentLink({ studentId: 's', parentId: 'p' }),
      [],
      () => mockAmplifyClient.models.ParentLink.create,
    );
    testGraphQLErrors(
      'deleteParentLink',
      () => graphQLClient.deleteParentLink('link-1'),
      [],
      () => mockAmplifyClient.models.ParentLink.delete,
    );
    testGraphQLErrors(
      'listParentLinks',
      () => graphQLClient.listParentLinks(),
      [],
      () => mockAmplifyClient.models.ParentLink.list,
    );

    // Domain
    testGraphQLErrors(
      'createDomain',
      () => graphQLClient.createDomain({ name: 'n' }),
      [],
      () => mockAmplifyClient.models.Domain.create,
    );
    testGraphQLErrors(
      'updateDomain',
      () => graphQLClient.updateDomain({ id: 'domain-1', name: 'Updated' }),
      [],
      () => mockAmplifyClient.models.Domain.update,
    );
    testGraphQLErrors(
      'deleteDomain',
      () => graphQLClient.deleteDomain('domain-1'),
      [],
      () => mockAmplifyClient.models.Domain.delete,
    );
    testGraphQLErrors(
      'getDomain',
      () => graphQLClient.getDomain('domain-1'),
      [],
      () => mockAmplifyClient.models.Domain.get,
    );
    testGraphQLErrors(
      'getDomainWithHierarchy',
      () => graphQLClient.getDomainWithHierarchy('domain-1'),
      [],
      () => mockAmplifyClient.models.Domain.get,
    );
    testGraphQLErrors(
      'listDomains',
      () => graphQLClient.listDomains(),
      [],
      () => mockAmplifyClient.models.Domain.list,
    );

    // Competency
    testGraphQLErrors(
      'createCompetency',
      () => graphQLClient.createCompetency({ name: 'n', domainId: 'd' }),
      [],
      () => mockAmplifyClient.models.Competency.create,
    );
    testGraphQLErrors(
      'updateCompetency',
      () => graphQLClient.updateCompetency({ id: 'id', name: 'n' }),
      [],
      () => mockAmplifyClient.models.Competency.update,
    );
    testGraphQLErrors(
      'deleteCompetency',
      () => graphQLClient.deleteCompetency('id'),
      [],
      () => mockAmplifyClient.models.Competency.delete,
    );
    testGraphQLErrors(
      'getCompetency',
      () => graphQLClient.getCompetency('id'),
      [],
      () => mockAmplifyClient.models.Competency.get,
    );
    testGraphQLErrors(
      'getCompetencyWithDetails',
      () => graphQLClient.getCompetencyWithDetails('id'),
      [],
      () => mockAmplifyClient.models.Competency.get,
    );
    testGraphQLErrors(
      'listCompetencies',
      () => graphQLClient.listCompetencies(),
      [],
      () => mockAmplifyClient.models.Competency.list,
    );

    // SubCompetency
    testGraphQLErrors(
      'createSubCompetency',
      () => graphQLClient.createSubCompetency({ competencyId: 'c', name: 'n' }),
      [],
      () => mockAmplifyClient.models.SubCompetency.create,
    );
    testGraphQLErrors(
      'updateSubCompetency',
      () => graphQLClient.updateSubCompetency({ id: 'id', name: 'n' }),
      [],
      () => mockAmplifyClient.models.SubCompetency.update,
    );
    testGraphQLErrors(
      'deleteSubCompetency',
      () => graphQLClient.deleteSubCompetency('id'),
      [],
      () => mockAmplifyClient.models.SubCompetency.delete,
    );
    testGraphQLErrors(
      'getSubCompetency',
      () => graphQLClient.getSubCompetency('id'),
      [],
      () => mockAmplifyClient.models.SubCompetency.get,
    );
    testGraphQLErrors(
      'getSubCompetencyWithDetails',
      () => graphQLClient.getSubCompetencyWithDetails('id'),
      [],
      () => mockAmplifyClient.models.SubCompetency.get,
    );
    testGraphQLErrors(
      'listSubCompetencies',
      () => graphQLClient.listSubCompetencies(),
      [],
      () => mockAmplifyClient.models.SubCompetency.list,
    );

    // Resource
    testGraphQLErrors(
      'createResource',
      () => graphQLClient.createResource({ subCompetencyId: 's', name: 'n' }),
      [],
      () => mockAmplifyClient.models.Resource.create,
    );
    testGraphQLErrors(
      'updateResource',
      () => graphQLClient.updateResource({ id: 'id', name: 'n' }),
      [],
      () => mockAmplifyClient.models.Resource.update,
    );
    testGraphQLErrors(
      'deleteResource',
      () => graphQLClient.deleteResource('id'),
      [],
      () => mockAmplifyClient.models.Resource.delete,
    );
    testGraphQLErrors(
      'getResource',
      () => graphQLClient.getResource('id'),
      [],
      () => mockAmplifyClient.models.Resource.get,
    );
    testGraphQLErrors(
      'listResources',
      () => graphQLClient.listResources(),
      [],
      () => mockAmplifyClient.models.Resource.list,
    );

    // Evaluation
    testGraphQLErrors(
      'createEvaluation',
      () => graphQLClient.createEvaluation({ subCompetencyId: 's', name: 'n' }),
      [],
      () => mockAmplifyClient.models.Evaluation.create,
    );
    testGraphQLErrors(
      'updateEvaluation',
      () => graphQLClient.updateEvaluation({ id: 'id', name: 'n' }),
      [],
      () => mockAmplifyClient.models.Evaluation.update,
    );
    testGraphQLErrors(
      'deleteEvaluation',
      () => graphQLClient.deleteEvaluation('id'),
      [],
      () => mockAmplifyClient.models.Evaluation.delete,
    );
    testGraphQLErrors(
      'getEvaluation',
      () => graphQLClient.getEvaluation('id'),
      [],
      () => mockAmplifyClient.models.Evaluation.get,
    );

    // EvaluationAttempt
    testGraphQLErrors(
      'createEvaluationAttempt',
      () => graphQLClient.createEvaluationAttempt({ evaluationId: 'e', studentId: 's' }),
      [],
      () => mockAmplifyClient.models.EvaluationAttempt.create,
    );
    testGraphQLErrors(
      'updateEvaluationAttempt',
      () => graphQLClient.updateEvaluationAttempt({ id: 'id', status: 'Completed' }),
      [],
      () => mockAmplifyClient.models.EvaluationAttempt.update,
    );

    // StudentSubCompetencyProgress
    testGraphQLErrors(
      'createStudentProgress',
      () => graphQLClient.createStudentProgress({ studentId: 's', subCompetencyId: 'sc' }),
      [],
      () => mockAmplifyClient.models.StudentSubCompetencyProgress.create,
    );
    testGraphQLErrors(
      'updateStudentProgress',
      () => graphQLClient.updateStudentProgress({ id: 'id', status: 'Validated' }),
      [],
      () => mockAmplifyClient.models.StudentSubCompetencyProgress.update,
    );

    testGraphQLErrors(
      'createProject',
      () => graphQLClient.createProject({ studentId: 's', subCompetencyId: 'sc', name: 'n' }),
      [],
      () => mockAmplifyClient.models.Project.create,
    );

    testGraphQLErrors(
      'updateProject',
      () => graphQLClient.updateProject({ id: 'id', name: 'n' }),
      [],
      () => mockAmplifyClient.models.Project.update,
    );

    testGraphQLErrors(
      'deleteProject',
      () => graphQLClient.deleteProject('id'),
      [],
      () => mockAmplifyClient.models.Project.delete,
    );

    testGraphQLErrors(
      'getProject',
      () => graphQLClient.getProject('id'),
      [],
      () => mockAmplifyClient.models.Project.get,
    );

    // Message
    testGraphQLErrors(
      'createMessage',
      () => graphQLClient.createMessage({ senderId: 's', title: 'Hello', kind: 'Message' }),
      [],
      () => mockAmplifyClient.models.Message.create,
    );
    testGraphQLErrors(
      'getMessage',
      () => graphQLClient.getMessage('id'),
      [],
      () => mockAmplifyClient.models.Message.get,
    );
    testGraphQLErrors(
      'getMessageWithReplies',
      () => graphQLClient.getMessageWithReplies('id'),
      [],
      () => mockAmplifyClient.models.Message.get,
    );
    testGraphQLErrors(
      'listMessages',
      () => graphQLClient.listMessages(),
      [],
      () => mockAmplifyClient.models.Message.list,
    );
    testGraphQLErrors(
      'updateMessage',
      () => graphQLClient.updateMessage({ id: 'id', title: 'Updated' }),
      [],
      () => mockAmplifyClient.models.Message.update,
    );
    testGraphQLErrors(
      'deleteMessage',
      () => graphQLClient.deleteMessage('id'),
      [],
      () => mockAmplifyClient.models.Message.delete,
    );

    // MessageTarget
    testGraphQLErrors(
      'createMessageTarget',
      () => graphQLClient.createMessageTarget({ messageId: 'm', userId: 'u' }),
      [],
      () => mockAmplifyClient.models.MessageTarget.create,
    );
    testGraphQLErrors(
      'getMessageTarget',
      () => graphQLClient.getMessageTarget('id'),
      [],
      () => mockAmplifyClient.models.MessageTarget.get,
    );
    testGraphQLErrors(
      'listMessageTargets',
      () => graphQLClient.listMessageTargets(),
      [],
      () => mockAmplifyClient.models.MessageTarget.list,
    );
    testGraphQLErrors(
      'updateMessageTarget',
      () => graphQLClient.updateMessageTarget({ id: 'id', read: true }),
      [],
      () => mockAmplifyClient.models.MessageTarget.update,
    );
    testGraphQLErrors(
      'deleteMessageTarget',
      () => graphQLClient.deleteMessageTarget('id'),
      [],
      () => mockAmplifyClient.models.MessageTarget.delete,
    );
  });
});
