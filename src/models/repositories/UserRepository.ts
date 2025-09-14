import type { Repository } from '../base/BaseModel';
import { graphQLClient } from '../base/GraphQLClient';
import { User, type CreateUserData, type UpdateUserData, type UserGraphQLData } from '../User';
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
  /**
   * Create a new user
   * @param data - User creation data
   * @returns Promise with created User instance
   */
  async create(data: CreateUserData): Promise<User> {
    const rawUser = await graphQLClient.createUser(data);
    return new User(rawUser as UserGraphQLData);
  }

  /**
   * Find user by ID
   * @param id - User ID
   * @returns Promise with User instance or null if not found
   */
  async findById(id: string): Promise<User | null> {
    const rawUser = await graphQLClient.getUser(id);
    return rawUser ? new User(rawUser as UserGraphQLData) : null;
  }

  /**
   * Find all users
   * @param filter - Optional filter criteria
   * @returns Promise with array of User instances
   */
  async findAll(filter?: UserFilter): Promise<User[]> {
    const rawUsers = await graphQLClient.listUsers(filter);
    return rawUsers.map((rawUser) => new User(rawUser as UserGraphQLData));
  }

  /**
   * Update a user
   * @param id - User ID
   * @param data - Updated user data
   * @returns Promise with updated User instance
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    const rawUser = await graphQLClient.updateUser(id, data);
    return new User(rawUser as UserGraphQLData);
  }

  /**
   * Delete a user
   * @param id - User ID
   * @returns Promise with deleted User instance
   */
  async delete(id: string): Promise<User> {
    const rawUser = await graphQLClient.deleteUser(id);
    return new User(rawUser as UserGraphQLData);
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
  async addUserToGroup(userId: string, groupName: string): Promise<boolean> {
    return graphQLClient.addUserToGroup(userId, groupName);
  }

  /**
   * Reset a user's password (admin mutation)
   */
  async resetUserPassword(userId: string, newPassword?: string): Promise<boolean> {
    return graphQLClient.resetUserPassword(userId, newPassword);
  }

  /**
   * Delete a user (admin mutation)
   */
  async deleteUser(userId: string): Promise<boolean> {
    return graphQLClient.adminDeleteUser(userId);
  }

  /**
   * Create a user (admin mutation)
   */
  async createUser(input: {
    userId: string;
    email: string;
    phone?: string;
    tempPassword?: string;
    suppressMessage?: boolean;
  }): Promise<boolean> {
    return graphQLClient.adminCreateUser(input);
  }
}

// Singleton instance

// Singleton instance
export const userRepository = new UserRepository();
