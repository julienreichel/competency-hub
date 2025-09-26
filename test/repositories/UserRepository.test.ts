import { beforeEach, describe, expect, it, vi } from 'vitest';
import { graphQLClient } from '../../src/models/base/GraphQLClient';
import { UserRepository } from '../../src/models/repositories/UserRepository';
import { User, UserRole } from '../../src/models/User';

// Mock the GraphQL client
vi.mock('../../src/models/base/GraphQLClient', () => ({
  graphQLClient: {
    getUser: vi.fn(),
    getUserWithRelations: vi.fn(),
    listUsers: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    addUserToGroup: vi.fn(),
    listTeachingAssignments: vi.fn(),
    createTeachingAssignment: vi.fn(),
    deleteTeachingAssignment: vi.fn(),
    listParentLinks: vi.fn(),
    createParentLink: vi.fn(),
    deleteParentLink: vi.fn(),
  },
}));

describe('UserRepository', () => {
  let userRepository: UserRepository;
  const mockGraphQLClient = graphQLClient as unknown as {
    getUser: ReturnType<typeof vi.fn>;
    getUserWithRelations: ReturnType<typeof vi.fn>;
    listUsers: ReturnType<typeof vi.fn>;
    updateUser: ReturnType<typeof vi.fn>;
    deleteUser: ReturnType<typeof vi.fn>;
    addUserToGroup: ReturnType<typeof vi.fn>;
    listTeachingAssignments: ReturnType<typeof vi.fn>;
    createTeachingAssignment: ReturnType<typeof vi.fn>;
    deleteTeachingAssignment: ReturnType<typeof vi.fn>;
    listParentLinks: ReturnType<typeof vi.fn>;
    createParentLink: ReturnType<typeof vi.fn>;
    deleteParentLink: ReturnType<typeof vi.fn>;
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

  beforeEach(() => {
    userRepository = new UserRepository();
    vi.clearAllMocks();
    mockGraphQLClient.listTeachingAssignments.mockResolvedValue([]);
    mockGraphQLClient.listParentLinks.mockResolvedValue([]);
  });

  describe('findById', () => {
    it('should find user by id and return User instance', async () => {
      mockGraphQLClient.getUserWithRelations.mockResolvedValue(validUserData);

      const result = await userRepository.findById('user-1');

      expect(mockGraphQLClient.getUserWithRelations).toHaveBeenCalledWith('user-1');
      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe('user-1');
    });

    it('should return null when user not found', async () => {
      mockGraphQLClient.getUserWithRelations.mockResolvedValue(null);

      const result = await userRepository.findById('nonexistent-id');

      expect(mockGraphQLClient.getUserWithRelations).toHaveBeenCalledWith('nonexistent-id');
      expect(result).toBeNull();
    });

    it('should handle GraphQL client errors', async () => {
      const error = new Error('GraphQL error');
      mockGraphQLClient.getUserWithRelations.mockRejectedValue(error);

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
      mockGraphQLClient.getUserWithRelations.mockResolvedValue(updatedUserData);

      const result = await userRepository.update('john@example.com', updateData);

      expect(mockGraphQLClient.updateUser).toHaveBeenCalledWith('john@example.com', updateData);
      expect(result).toBeInstanceOf(User);
      expect(result.email).toBe('john@example.com');
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

      const result = await userRepository.delete('john@example.com');

      expect(mockGraphQLClient.deleteUser).toHaveBeenCalledWith('john@example.com');
      expect(result).toBeInstanceOf(User);
      expect(result.email).toBe('john@example.com');
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
  });

  describe('repository integration', () => {
    it('should handle all CRUD operations in sequence', async () => {
      // Read
      mockGraphQLClient.getUserWithRelations.mockResolvedValue(validUserData);
      const foundUser = await userRepository.findById('user-1');
      expect(foundUser).toBeInstanceOf(User);

      // Update
      const updatedData = { ...validUserData, name: 'Updated Name' };
      mockGraphQLClient.updateUser.mockResolvedValue(updatedData);
      mockGraphQLClient.getUserWithRelations.mockResolvedValue(updatedData);
      const updatedUser = await userRepository.update('user-1', { name: 'Updated Name' });
      expect(updatedUser.name).toBe('Updated Name');

      // Delete
      mockGraphQLClient.deleteUser.mockResolvedValue(validUserData);
      const deletedUser = await userRepository.delete('user-1');
      expect(deletedUser).toBeInstanceOf(User);
    });
  });
  describe('admin mutations', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('addUserToGroup returns user on success', async () => {
      const updatedUser = {
        id: 'user-1',
        name: 'Updated',
        role: UserRole.STUDENT,
        email: 'updated@example.com',
        avatar: 'avatar',
        contactInfo: 'contact',
      };
      mockGraphQLClient.addUserToGroup.mockResolvedValue(updatedUser);
      mockGraphQLClient.getUserWithRelations.mockResolvedValue(updatedUser);

      const result = await userRepository.addUserToGroup('user-1', 'Admin');

      expect(mockGraphQLClient.addUserToGroup).toHaveBeenCalledWith('user-1', 'Admin');
      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe('user-1');
    });

    it('addUserToGroup returns null on failure', async () => {
      mockGraphQLClient.addUserToGroup.mockResolvedValue(null);
      const result = await userRepository.addUserToGroup('user-1', 'Admin');
      expect(result).toBeNull();
    });
  });

  describe('relationship management', () => {
    const educator = User.create({
      ...validUserData,
      id: 'educator-1',
      role: UserRole.EDUCATOR,
      email: 'educator@example.com',
      name: 'Educator One',
    });
    const student = User.create({
      ...validUserData,
      id: 'student-1',
      role: UserRole.STUDENT,
      email: 'student@example.com',
      name: 'Student One',
    });
    const parent = User.create({
      ...validUserData,
      id: 'parent-1',
      role: UserRole.PARENT,
      email: 'parent@example.com',
      name: 'Parent One',
    });

    it('links educator to student when no assignment exists', async () => {
      // Arrange
      mockGraphQLClient.listTeachingAssignments.mockResolvedValue([]);
      mockGraphQLClient.createTeachingAssignment.mockResolvedValue({});
      const findByIdSpy = vi
        .spyOn(userRepository, 'findById')
        .mockResolvedValueOnce(student)
        .mockResolvedValueOnce(educator);

      // Act
      const result = await userRepository.linkEducatorToStudent('student-1', 'educator-1');

      // Assert
      expect(mockGraphQLClient.createTeachingAssignment).toHaveBeenCalledWith({
        studentId: 'student-1',
        educatorId: 'educator-1',
      });
      expect(findByIdSpy).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ student, educator });

      findByIdSpy.mockRestore();
    });

    it('does not duplicate educator assignment when link exists', async () => {
      // Arrange
      mockGraphQLClient.listTeachingAssignments.mockResolvedValue([{ id: 'assignment-1' }]);
      const findByIdSpy = vi
        .spyOn(userRepository, 'findById')
        .mockResolvedValueOnce(student)
        .mockResolvedValueOnce(educator);

      // Act
      await userRepository.linkEducatorToStudent('student-1', 'educator-1');

      // Assert
      expect(mockGraphQLClient.createTeachingAssignment).not.toHaveBeenCalled();
      expect(findByIdSpy).toHaveBeenCalledTimes(2);

      findByIdSpy.mockRestore();
    });

    it('unlinks educator from student and refreshes users', async () => {
      // Arrange
      mockGraphQLClient.listTeachingAssignments.mockResolvedValue([{ id: 'assignment-1' }]);
      mockGraphQLClient.deleteTeachingAssignment.mockResolvedValue({});
      const findByIdSpy = vi
        .spyOn(userRepository, 'findById')
        .mockResolvedValueOnce(student)
        .mockResolvedValueOnce(educator);

      // Act
      const result = await userRepository.unlinkEducatorFromStudent('student-1', 'educator-1');

      // Assert
      expect(mockGraphQLClient.deleteTeachingAssignment).toHaveBeenCalledWith('assignment-1');
      expect(findByIdSpy).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ student, educator });

      findByIdSpy.mockRestore();
    });

    it('links parent to student when no link exists', async () => {
      // Arrange
      mockGraphQLClient.listParentLinks.mockResolvedValue([]);
      mockGraphQLClient.createParentLink.mockResolvedValue({});
      const findByIdSpy = vi
        .spyOn(userRepository, 'findById')
        .mockResolvedValueOnce(student)
        .mockResolvedValueOnce(parent);

      // Act
      const result = await userRepository.linkParentToStudent('student-1', 'parent-1');

      // Assert
      expect(mockGraphQLClient.createParentLink).toHaveBeenCalledWith({
        studentId: 'student-1',
        parentId: 'parent-1',
      });
      expect(result).toEqual({ student, parent });

      findByIdSpy.mockRestore();
    });

    it('unlinks parent from student removing all links', async () => {
      // Arrange
      mockGraphQLClient.listParentLinks.mockResolvedValue([{ id: 'link-1' }, { id: 'link-2' }]);
      mockGraphQLClient.deleteParentLink.mockResolvedValue({});
      const findByIdSpy = vi
        .spyOn(userRepository, 'findById')
        .mockResolvedValueOnce(student)
        .mockResolvedValueOnce(parent);

      // Act
      const result = await userRepository.unlinkParentFromStudent('student-1', 'parent-1');

      // Assert
      expect(mockGraphQLClient.deleteParentLink).toHaveBeenCalledTimes(2);
      expect(mockGraphQLClient.deleteParentLink).toHaveBeenCalledWith('link-1');
      expect(mockGraphQLClient.deleteParentLink).toHaveBeenCalledWith('link-2');
      expect(result).toEqual({ student, parent });

      findByIdSpy.mockRestore();
    });
  });
});
