import { beforeEach, describe, expect, it, vi } from 'vitest';
import { graphQLClient } from '../../src/models/base/GraphQLClient';
import { UserRepository } from '../../src/models/repositories/UserRepository';
import { User, UserRole, UserStatus } from '../../src/models/User';

// Mock the GraphQL client
vi.mock('../../src/models/base/GraphQLClient', () => ({
  graphQLClient: {
    createUser: vi.fn(),
    getUser: vi.fn(),
    listUsers: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

describe('UserRepository', () => {
  let userRepository: UserRepository;
  const mockGraphQLClient = graphQLClient as unknown as {
    createUser: ReturnType<typeof vi.fn>;
    getUser: ReturnType<typeof vi.fn>;
    listUsers: ReturnType<typeof vi.fn>;
    updateUser: ReturnType<typeof vi.fn>;
    deleteUser: ReturnType<typeof vi.fn>;
  };

  const validUserData = {
    id: 'user-1',
    name: 'John Doe',
    role: UserRole.STUDENT,
    email: 'john@example.com',
    avatar: 'avatar-url',
    contactInfo: 'contact-info',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const createUserData = {
    name: 'Jane Doe',
    role: UserRole.EDUCATOR,
    email: 'jane@example.com',
    avatar: 'avatar-url-2',
    contactInfo: 'contact-info-2',
    status: UserStatus.ACTIVE,
  };

  beforeEach(() => {
    userRepository = new UserRepository();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user and return User instance', async () => {
      mockGraphQLClient.createUser.mockResolvedValue(validUserData);

      const result = await userRepository.create(createUserData);

      expect(mockGraphQLClient.createUser).toHaveBeenCalledWith(createUserData);
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe('user-1');
      expect(result.name).toBe('John Doe');
    });

    it('should handle GraphQL client errors', async () => {
      const error = new Error('GraphQL error');
      mockGraphQLClient.createUser.mockRejectedValue(error);

      await expect(userRepository.create(createUserData)).rejects.toThrow('GraphQL error');
      expect(mockGraphQLClient.createUser).toHaveBeenCalledWith(createUserData);
    });
  });

  describe('findById', () => {
    it('should find user by ID and return User instance', async () => {
      mockGraphQLClient.getUser.mockResolvedValue(validUserData);

      const result = await userRepository.findById('user-1');

      expect(mockGraphQLClient.getUser).toHaveBeenCalledWith('user-1');
      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe('user-1');
    });

    it('should return null when user not found', async () => {
      mockGraphQLClient.getUser.mockResolvedValue(null);

      const result = await userRepository.findById('non-existent');

      expect(mockGraphQLClient.getUser).toHaveBeenCalledWith('non-existent');
      expect(result).toBeNull();
    });

    it('should handle GraphQL client errors', async () => {
      const error = new Error('GraphQL error');
      mockGraphQLClient.getUser.mockRejectedValue(error);

      await expect(userRepository.findById('user-1')).rejects.toThrow('GraphQL error');
    });
  });

  describe('findAll', () => {
    it('should find all users and return User instances', async () => {
      const usersData = [validUserData, { ...validUserData, id: 'user-2', name: 'Jane Doe' }];
      mockGraphQLClient.listUsers.mockResolvedValue(usersData);

      const result = await userRepository.findAll();

      expect(mockGraphQLClient.listUsers).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(User);
      expect(result[1]).toBeInstanceOf(User);
      expect(result[0]?.id).toBe('user-1');
      expect(result[1]?.id).toBe('user-2');
    });

    it('should find users with filter', async () => {
      const filter = { role: { eq: 'STUDENT' } };
      mockGraphQLClient.listUsers.mockResolvedValue([validUserData]);

      const result = await userRepository.findAll(filter);

      expect(mockGraphQLClient.listUsers).toHaveBeenCalledWith(filter);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(User);
    });

    it('should return empty array when no users found', async () => {
      mockGraphQLClient.listUsers.mockResolvedValue([]);

      const result = await userRepository.findAll();

      expect(result).toHaveLength(0);
    });

    it('should handle GraphQL client errors', async () => {
      const error = new Error('GraphQL error');
      mockGraphQLClient.listUsers.mockRejectedValue(error);

      await expect(userRepository.findAll()).rejects.toThrow('GraphQL error');
    });
  });

  describe('update', () => {
    it('should update user and return updated User instance', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedUserData = { ...validUserData, name: 'Updated Name' };
      mockGraphQLClient.updateUser.mockResolvedValue(updatedUserData);

      const result = await userRepository.update('user-1', updateData);

      expect(mockGraphQLClient.updateUser).toHaveBeenCalledWith('user-1', updateData);
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe('user-1');
      expect(result.name).toBe('Updated Name');
    });

    it('should handle GraphQL client errors', async () => {
      const error = new Error('GraphQL error');
      mockGraphQLClient.updateUser.mockRejectedValue(error);

      await expect(userRepository.update('user-1', { name: 'Updated Name' })).rejects.toThrow(
        'GraphQL error',
      );
    });
  });

  describe('delete', () => {
    it('should delete user and return deleted User instance', async () => {
      mockGraphQLClient.deleteUser.mockResolvedValue(validUserData);

      const result = await userRepository.delete('user-1');

      expect(mockGraphQLClient.deleteUser).toHaveBeenCalledWith('user-1');
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe('user-1');
    });

    it('should handle GraphQL client errors', async () => {
      const error = new Error('GraphQL error');
      mockGraphQLClient.deleteUser.mockRejectedValue(error);

      await expect(userRepository.delete('user-1')).rejects.toThrow('GraphQL error');
    });
  });

  describe('findByRole', () => {
    it('should find multiple users by role', async () => {
      const mockUsers = [validUserData, { ...validUserData, id: 'user-2', name: 'Jane Smith' }];
      mockGraphQLClient.listUsers.mockResolvedValue(mockUsers);

      const result = await userRepository.findByRole(UserRole.STUDENT);

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('user-1');
      expect(result[1]?.id).toBe('user-2');
      expect(mockGraphQLClient.listUsers).toHaveBeenCalledWith({ role: { eq: UserRole.STUDENT } });
    });

    it('should return empty array when no users found for role', async () => {
      mockGraphQLClient.listUsers.mockResolvedValue([]);

      const result = await userRepository.findByRole('EDUCATOR');

      expect(result).toHaveLength(0);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      mockGraphQLClient.listUsers.mockResolvedValue([validUserData]);

      const result = await userRepository.findByEmail('john@example.com');

      expect(mockGraphQLClient.listUsers).toHaveBeenCalledWith({
        email: { eq: 'john@example.com' },
      });
      expect(result).toBeInstanceOf(User);
      expect(result?.email).toBe('john@example.com');
    });

    it('should return null when no user found with email', async () => {
      mockGraphQLClient.listUsers.mockResolvedValue([]);

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should return first user when multiple users found (edge case)', async () => {
      const usersData = [
        validUserData,
        { ...validUserData, id: 'user-2', name: 'Duplicate Email User' },
      ];
      mockGraphQLClient.listUsers.mockResolvedValue(usersData);

      const result = await userRepository.findByEmail('john@example.com');

      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe('user-1');
    });
  });

  describe('repository integration', () => {
    it('should handle all CRUD operations in sequence', async () => {
      // Create
      mockGraphQLClient.createUser.mockResolvedValue(validUserData);
      const createdUser = await userRepository.create(createUserData);
      expect(createdUser).toBeInstanceOf(User);

      // Read
      mockGraphQLClient.getUser.mockResolvedValue(validUserData);
      const foundUser = await userRepository.findById('user-1');
      expect(foundUser).toBeInstanceOf(User);

      // Update
      const updatedData = { ...validUserData, name: 'Updated Name' };
      mockGraphQLClient.updateUser.mockResolvedValue(updatedData);
      const updatedUser = await userRepository.update('user-1', { name: 'Updated Name' });
      expect(updatedUser.name).toBe('Updated Name');

      // Delete
      mockGraphQLClient.deleteUser.mockResolvedValue(validUserData);
      const deletedUser = await userRepository.delete('user-1');
      expect(deletedUser).toBeInstanceOf(User);
    });
  });
});
