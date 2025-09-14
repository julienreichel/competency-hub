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
      Competency: {
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
    Competency: {
      create: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
      list: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };
}

describe('GraphQLClient', () => {
  let graphQLClient: GraphQLClient;
  let mockAmplifyClient: MockAmplifyClient;

  beforeEach(() => {
    vi.clearAllMocks();
    graphQLClient = new GraphQLClient();
    // Get the mocked client instance
    mockAmplifyClient = (graphQLClient as unknown as { client: MockAmplifyClient }).client;
  });

  // --- Admin user mutations ---
  type AdminMutations = {
    addUserToGroup: ReturnType<typeof vi.fn>;
    resetUserPassword: ReturnType<typeof vi.fn>;
    adminDeleteUser: ReturnType<typeof vi.fn>;
    adminCreateUser: ReturnType<typeof vi.fn>;
  };
  describe('Admin user mutations', () => {
    let adminMutations: AdminMutations;
    beforeEach(() => {
      adminMutations = {
        addUserToGroup: vi.fn(),
        resetUserPassword: vi.fn(),
        adminDeleteUser: vi.fn(),
        adminCreateUser: vi.fn(),
      };
      // @ts-expect-error: override for test
      graphQLClient.client = { mutations: adminMutations };
    });

    describe('addUserToGroup', () => {
      it('should return true on success', async () => {
        adminMutations.addUserToGroup.mockResolvedValue({ errors: null });
        const result = await graphQLClient.addUserToGroup('user-1', 'Admin');
        expect(result).toBe(true);
        expect(adminMutations.addUserToGroup).toHaveBeenCalledWith(
          { userId: 'user-1', groupName: 'Admin' },
          { authMode: 'userPool' },
        );
      });
      it('should return false on GraphQL errors', async () => {
        adminMutations.addUserToGroup.mockResolvedValue({
          errors: [{ message: 'Denied' }],
        });
        const result = await graphQLClient.addUserToGroup('user-1', 'Admin');
        expect(result).toBe(false);
      });
      it('should return false on network error', async () => {
        adminMutations.addUserToGroup.mockRejectedValue(new Error('Network error'));
        const result = await graphQLClient.addUserToGroup('user-1', 'Admin');
        expect(result).toBe(false);
      });
    });

    describe('resetUserPassword', () => {
      it('should return true on success', async () => {
        adminMutations.resetUserPassword.mockResolvedValue({ errors: null });
        const result = await graphQLClient.resetUserPassword('user-1', 'newpass');
        expect(result).toBe(true);
        expect(adminMutations.resetUserPassword).toHaveBeenCalledWith(
          { userId: 'user-1', newPassword: 'newpass' },
          { authMode: 'userPool' },
        );
      });
      it('should return false on GraphQL errors', async () => {
        adminMutations.resetUserPassword.mockResolvedValue({
          errors: [{ message: 'Denied' }],
        });
        const result = await graphQLClient.resetUserPassword('user-1', 'newpass');
        expect(result).toBe(false);
      });
      it('should return false on network error', async () => {
        adminMutations.resetUserPassword.mockRejectedValue(new Error('Network error'));
        const result = await graphQLClient.resetUserPassword('user-1', 'newpass');
        expect(result).toBe(false);
      });
    });

    describe('adminDeleteUser', () => {
      it('should return true on success', async () => {
        adminMutations.adminDeleteUser.mockResolvedValue({ errors: null });
        const result = await graphQLClient.adminDeleteUser('user-1');
        expect(result).toBe(true);
        expect(adminMutations.adminDeleteUser).toHaveBeenCalledWith(
          { userId: 'user-1' },
          { authMode: 'userPool' },
        );
      });
      it('should return false on GraphQL errors', async () => {
        adminMutations.adminDeleteUser.mockResolvedValue({
          errors: [{ message: 'Denied' }],
        });
        const result = await graphQLClient.adminDeleteUser('user-1');
        expect(result).toBe(false);
      });
      it('should return false on network error', async () => {
        adminMutations.adminDeleteUser.mockRejectedValue(new Error('Network error'));
        const result = await graphQLClient.adminDeleteUser('user-1');
        expect(result).toBe(false);
      });
    });

    describe('adminCreateUser', () => {
      const input = {
        userId: 'user-1',
        email: 'john@example.com',
        phone: '123',
        tempPassword: 'pw',
        suppressMessage: false,
      };
      it('should return true on success', async () => {
        adminMutations.adminCreateUser.mockResolvedValue({ errors: null });
        const result = await graphQLClient.adminCreateUser(input);
        expect(result).toBe(true);
        expect(adminMutations.adminCreateUser).toHaveBeenCalledWith(input, {
          authMode: 'userPool',
        });
      });
      it('should return false on GraphQL errors', async () => {
        adminMutations.adminCreateUser.mockResolvedValue({
          errors: [{ message: 'Denied' }],
        });
        const result = await graphQLClient.adminCreateUser(input);
        expect(result).toBe(false);
      });
      it('should return false on network error', async () => {
        adminMutations.adminCreateUser.mockRejectedValue(new Error('Network error'));
        const result = await graphQLClient.adminCreateUser(input);
        expect(result).toBe(false);
      });
    });
  });

  describe('User operations', () => {
    const mockUserData = {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
    };

    describe('createUser', () => {
      it('should create a user successfully', async () => {
        const createData = { id: 'user-1', name: 'John Doe', email: 'john@example.com' };
        mockAmplifyClient.models.User.create.mockResolvedValue({
          data: mockUserData,
          errors: null,
        });

        const result = await graphQLClient.createUser(createData);

        expect(result).toEqual(mockUserData);
        expect(mockAmplifyClient.models.User.create).toHaveBeenCalledWith(createData, {
          authMode: 'userPool',
        });
      });

      it('should handle GraphQL errors during user deletion', async () => {
        const email = 'john@example.com';
        const graphQLErrors = [{ message: 'Delete failed' }];

        mockAmplifyClient.models.User.delete.mockResolvedValue({
          data: null,
          errors: graphQLErrors,
        });

        await expect(graphQLClient.deleteUser(email)).rejects.toThrow(
          `GraphQL errors: ${JSON.stringify(graphQLErrors)}`,
        );
      });
      it('should handle network errors during user creation', async () => {
        const createData = { id: 'user-1', name: 'John Doe', email: 'john@example.com' };
        const networkError = new Error('Network error');
        mockAmplifyClient.models.User.create.mockRejectedValue(networkError);

        await expect(graphQLClient.createUser(createData)).rejects.toThrow('Network error');
      });
    });

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
  });

  describe('Competency operations', () => {
    const mockCompetencyData = {
      id: 'comp-1',
      name: 'JavaScript',
      description: 'Programming language',
    };

    describe('createCompetency', () => {
      it('should create a competency successfully', async () => {
        const createData = { name: 'JavaScript', description: 'Programming language' };
        mockAmplifyClient.models.Competency.create.mockResolvedValue({
          data: mockCompetencyData,
          errors: null,
        });

        const result = await graphQLClient.createCompetency(createData);

        expect(result).toEqual(mockCompetencyData);
        expect(mockAmplifyClient.models.Competency.create).toHaveBeenCalledWith(createData, {
          authMode: 'identityPool',
        });
      });

      it('should handle GraphQL errors during competency creation', async () => {
        const createData = { name: 'JavaScript' };
        const graphQLErrors = [{ message: 'Name already exists' }];
        mockAmplifyClient.models.Competency.create.mockResolvedValue({
          data: null,
          errors: graphQLErrors,
        });

        await expect(graphQLClient.createCompetency(createData)).rejects.toThrow(
          `GraphQL errors: ${JSON.stringify(graphQLErrors)}`,
        );
      });
    });

    describe('getCompetency', () => {
      it('should get a competency successfully', async () => {
        const competencyId = 'comp-1';
        mockAmplifyClient.models.Competency.get.mockResolvedValue({
          data: mockCompetencyData,
          errors: null,
        });

        const result = await graphQLClient.getCompetency(competencyId);

        expect(result).toEqual(mockCompetencyData);
        expect(mockAmplifyClient.models.Competency.get).toHaveBeenCalledWith(
          { id: competencyId },
          { authMode: 'identityPool' },
        );
      });

      it('should handle GraphQL errors during competency retrieval', async () => {
        const competencyId = 'comp-1';
        const graphQLErrors = [{ message: 'Competency not found' }];
        mockAmplifyClient.models.Competency.get.mockResolvedValue({
          data: null,
          errors: graphQLErrors,
        });

        await expect(graphQLClient.getCompetency(competencyId)).rejects.toThrow(
          `GraphQL errors: ${JSON.stringify(graphQLErrors)}`,
        );
      });

      it('should handle network errors during competency retrieval', async () => {
        const competencyId = 'comp-1';
        const networkError = new Error('Network timeout');
        mockAmplifyClient.models.Competency.get.mockRejectedValue(networkError);

        await expect(graphQLClient.getCompetency(competencyId)).rejects.toThrow('Network timeout');
      });
    });

    describe('listCompetencies', () => {
      it('should list competencies without filter', async () => {
        const mockCompetencies = [mockCompetencyData];
        mockAmplifyClient.models.Competency.list.mockResolvedValue({
          data: mockCompetencies,
          errors: null,
        });

        const result = await graphQLClient.listCompetencies();

        expect(result).toEqual(mockCompetencies);
        expect(mockAmplifyClient.models.Competency.list).toHaveBeenCalledWith({
          authMode: 'identityPool',
        });
      });

      it('should list competencies with filter', async () => {
        const filter = { name: { contains: 'Script' } };
        const mockCompetencies = [mockCompetencyData];
        mockAmplifyClient.models.Competency.list.mockResolvedValue({
          data: mockCompetencies,
          errors: null,
        });

        const result = await graphQLClient.listCompetencies(filter);

        expect(result).toEqual(mockCompetencies);
        expect(mockAmplifyClient.models.Competency.list).toHaveBeenCalledWith({
          authMode: 'identityPool',
          filter,
        });
      });

      it('should handle GraphQL errors during competency listing', async () => {
        const graphQLErrors = [{ message: 'Access denied' }];
        mockAmplifyClient.models.Competency.list.mockResolvedValue({
          data: [],
          errors: graphQLErrors,
        });

        await expect(graphQLClient.listCompetencies()).rejects.toThrow(
          `GraphQL errors: ${JSON.stringify(graphQLErrors)}`,
        );
      });

      it('should handle network errors during competency listing', async () => {
        const networkError = new Error('Connection failed');
        mockAmplifyClient.models.Competency.list.mockRejectedValue(networkError);

        await expect(graphQLClient.listCompetencies()).rejects.toThrow('Connection failed');
      });
    });

    describe('updateCompetency', () => {
      it('should update a competency successfully', async () => {
        const competencyId = 'comp-1';
        const updateData = { description: 'Updated description' };
        const updatedCompetency = { ...mockCompetencyData, ...updateData };

        mockAmplifyClient.models.Competency.update.mockResolvedValue({
          data: updatedCompetency,
          errors: null,
        });

        const result = await graphQLClient.updateCompetency(competencyId, updateData);

        expect(result).toEqual(updatedCompetency);
        expect(mockAmplifyClient.models.Competency.update).toHaveBeenCalledWith(
          { id: competencyId, ...updateData },
          { authMode: 'identityPool' },
        );
      });

      it('should handle GraphQL errors during competency update', async () => {
        const competencyId = 'comp-1';
        const updateData = { name: 'Updated name' };
        const graphQLErrors = [{ message: 'Validation failed' }];

        mockAmplifyClient.models.Competency.update.mockResolvedValue({
          data: null,
          errors: graphQLErrors,
        });

        await expect(graphQLClient.updateCompetency(competencyId, updateData)).rejects.toThrow(
          `GraphQL errors: ${JSON.stringify(graphQLErrors)}`,
        );
      });

      it('should handle network errors during competency update', async () => {
        const competencyId = 'comp-1';
        const updateData = { name: 'Updated name' };
        const networkError = new Error('Update failed');
        mockAmplifyClient.models.Competency.update.mockRejectedValue(networkError);

        await expect(graphQLClient.updateCompetency(competencyId, updateData)).rejects.toThrow(
          'Update failed',
        );
      });
    });

    describe('deleteCompetency', () => {
      it('should delete a competency successfully', async () => {
        const competencyId = 'comp-1';
        mockAmplifyClient.models.Competency.delete.mockResolvedValue({
          data: mockCompetencyData,
          errors: null,
        });

        const result = await graphQLClient.deleteCompetency(competencyId);

        expect(result).toEqual(mockCompetencyData);
        expect(mockAmplifyClient.models.Competency.delete).toHaveBeenCalledWith(
          { id: competencyId },
          { authMode: 'identityPool' },
        );
      });

      it('should handle GraphQL errors during competency deletion', async () => {
        const competencyId = 'comp-1';
        const graphQLErrors = [{ message: 'Cannot delete competency' }];

        mockAmplifyClient.models.Competency.delete.mockResolvedValue({
          data: null,
          errors: graphQLErrors,
        });

        await expect(graphQLClient.deleteCompetency(competencyId)).rejects.toThrow(
          `GraphQL errors: ${JSON.stringify(graphQLErrors)}`,
        );
      });

      it('should handle network errors during competency deletion', async () => {
        const competencyId = 'comp-1';
        const networkError = new Error('Delete failed');
        mockAmplifyClient.models.Competency.delete.mockRejectedValue(networkError);

        await expect(graphQLClient.deleteCompetency(competencyId)).rejects.toThrow('Delete failed');
      });
    });
  });

  describe('Error handling', () => {
    it('should handle network errors during competency creation', async () => {
      const createData = { name: 'TypeScript' };
      const networkError = new Error('Network error');
      mockAmplifyClient.models.Competency.create.mockRejectedValue(networkError);

      await expect(graphQLClient.createCompetency(createData)).rejects.toThrow('Network error');
    });
  });
});
