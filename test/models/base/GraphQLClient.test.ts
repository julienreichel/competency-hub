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
      expect(mockAmplifyClient.models.Domain.list).toHaveBeenCalledWith({ authMode: 'userPool' });
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
});
