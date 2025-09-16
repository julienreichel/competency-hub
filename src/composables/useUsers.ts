import { userRepository } from 'src/models/repositories/UserRepository';
import type { User } from 'src/models/User';
import { ref } from 'vue';

export function useUsers(): {
  loading: typeof loading;
  error: typeof error;
  fetchUsers: () => Promise<User[]>;
  addUserToGroup: (userId: string, groupName: string) => Promise<User | null>;
} {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchUsers = async (): Promise<User[]> => {
    loading.value = true;
    error.value = null;
    let users;
    try {
      users = await userRepository.findAll();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch users';
    } finally {
      loading.value = false;
    }
    return users || [];
  };

  // Admin mutation wrappers
  const addUserToGroup = async (userId: string, groupName: string): Promise<User | null> => {
    let user;
    try {
      user = await userRepository.addUserToGroup(userId, groupName);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch users';
    } finally {
      loading.value = false;
    }
    return user || null;
  };

  return {
    loading,
    error,
    fetchUsers,
    addUserToGroup,
  };
}
