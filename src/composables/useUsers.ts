import { userRepository } from 'src/models/repositories/UserRepository';
import type { User } from 'src/models/User';
import { ref } from 'vue';

export function useUsers(): {
  users: typeof users;
  loading: typeof loading;
  error: typeof error;
  fetchUsers: () => Promise<void>;
  addUserToGroup: (userId: string, groupName: string) => Promise<boolean>;
  resetUserPassword: (userId: string, newPassword?: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  createUser: (input: {
    userId: string;
    email: string;
    phone?: string;
    tempPassword?: string;
    suppressMessage?: boolean;
  }) => Promise<boolean>;
} {
  const users = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchUsers = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      users.value = await userRepository.findAll();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch users';
    } finally {
      loading.value = false;
    }
  };

  // Admin mutation wrappers
  const addUserToGroup = async (userId: string, groupName: string): Promise<boolean> => {
    return userRepository.addUserToGroup(userId, groupName);
  };

  const resetUserPassword = async (userId: string, newPassword?: string): Promise<boolean> => {
    return userRepository.resetUserPassword(userId, newPassword);
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    // Note: userRepository method is named deleteUser for admin mutation
    return userRepository.deleteUser(userId);
  };

  const createUser = async (input: {
    userId: string;
    email: string;
    phone?: string;
    tempPassword?: string;
    suppressMessage?: boolean;
  }): Promise<boolean> => {
    // Note: userRepository method is named createUser for admin mutation
    return userRepository.createUser(input);
  };

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUserToGroup,
    resetUserPassword,
    deleteUser,
    createUser,
  };
}
