import type { Schema } from '../../../amplify/data/resource';
import type { Repository } from '../base/BaseModel';
import { graphQLClient } from '../base/GraphQLClient';
import { User, type CreateUserData, type UpdateUserData } from '../User';
/**
 * User filter type for queries
 */
interface UserFilter extends Record<string, unknown> {
  role?: { eq: string };
  email?: { eq: string };
}
export class UserRepository
  implements Repository<User, CreateUserData, UpdateUserData, UserFilter>
{
  private readonly toUser = (raw: Schema['User']['type'] | null): User | null =>
    raw ? User.fromAmplify(raw) : null;

  /**
   * Create a new user
   */
  async create(): Promise<User> {
    await Promise.resolve();
    throw new Error('Cannot create users, this must be done trough cognito registrations');
  }

  /**
   * Find user by ID
   * @param id - User ID
   * @returns Promise with User instance or null if not found
   */
  async findById(id: string): Promise<User | null> {
    const rawUser = await graphQLClient.getUserWithRelations(id);
    return this.toUser(rawUser);
  }

  /**
   * Find all users
   * @param filter - Optional filter criteria
   * @returns Promise with array of User instances
   */
  async findAll(filter?: UserFilter): Promise<User[]> {
    const rawUsers = await graphQLClient.listUsers(filter);
    return rawUsers.map((rawUser) => User.fromAmplify(rawUser));
  }

  /**
   * Update a user
   * @param id - User ID
   * @param data - Updated user data
   * @returns Promise with updated User instance
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    const rawUser = await graphQLClient.updateUser(id, data);
    if (!rawUser) {
      throw new Error(`Failed to update user with id ${id}`);
    }
    return User.fromAmplify(rawUser);
  }

  /**
   * Delete a user
   * @param id - User ID
   * @returns Promise with deleted User instance
   */
  async delete(id: string): Promise<User> {
    const rawUser = await graphQLClient.deleteUser(id);
    if (!rawUser) {
      throw new Error(`Failed to delete user with id ${id}`);
    }
    return User.fromAmplify(rawUser);
  }

  /**
   * Find users by role
   * @param role - User role to filter by
   * @returns Promise with array of User instances
   */
  async findByRole(role: string): Promise<User[]> {
    return this.findAll({ role: { eq: role } });
  }

  /**
   * Find user by email using a filter (since id is the primary key)
   * @param email - User email
   * @returns Promise with User instance or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    const users = await this.findAll({ email: { eq: email } });
    return users.length > 0 && users[0] ? users[0] : null;
  }

  /**
   * Add a user to a Cognito group (admin mutation)
   */
  async addUserToGroup(userId: string, groupName: string): Promise<User | null> {
    const rawUser = await graphQLClient.addUserToGroup(userId, groupName);
    if (!rawUser) return null;
    return (await this.findById(userId)) ?? User.fromAmplify(rawUser);
  }

  async linkEducatorToStudent(
    studentId: string,
    educatorId: string,
  ): Promise<{ student: User | null; educator: User | null }> {
    const existing = await graphQLClient.listTeachingAssignments({
      studentId: { eq: studentId },
      educatorId: { eq: educatorId },
    });

    if (existing.length === 0) {
      await graphQLClient.createTeachingAssignment({ studentId, educatorId });
    }

    const [student, educator] = await Promise.all([
      this.findById(studentId),
      this.findById(educatorId),
    ]);

    return { student, educator };
  }

  async unlinkEducatorFromStudent(
    studentId: string,
    educatorId: string,
  ): Promise<{ student: User | null; educator: User | null }> {
    const matches = await graphQLClient.listTeachingAssignments({
      studentId: { eq: studentId },
      educatorId: { eq: educatorId },
    });

    await Promise.all(
      matches
        .filter((assignment) => assignment.id)
        .map((assignment) => graphQLClient.deleteTeachingAssignment(assignment.id)),
    );

    const [student, educator] = await Promise.all([
      this.findById(studentId),
      this.findById(educatorId),
    ]);

    return { student, educator };
  }

  async linkParentToStudent(
    studentId: string,
    parentId: string,
  ): Promise<{ student: User | null; parent: User | null }> {
    const existing = await graphQLClient.listParentLinks({
      studentId: { eq: studentId },
      parentId: { eq: parentId },
    });

    if (existing.length === 0) {
      await graphQLClient.createParentLink({ studentId, parentId });
    }

    const [student, parent] = await Promise.all([
      this.findById(studentId),
      this.findById(parentId),
    ]);

    return { student, parent };
  }

  async unlinkParentFromStudent(
    studentId: string,
    parentId: string,
  ): Promise<{ student: User | null; parent: User | null }> {
    const matches = await graphQLClient.listParentLinks({
      studentId: { eq: studentId },
      parentId: { eq: parentId },
    });

    await Promise.all(
      matches.filter((link) => link.id).map((link) => graphQLClient.deleteParentLink(link.id)),
    );

    const [student, parent] = await Promise.all([
      this.findById(studentId),
      this.findById(parentId),
    ]);

    return { student, parent };
  }
}

// Singleton instance

// Singleton instance
export const userRepository = new UserRepository();
