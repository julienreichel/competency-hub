import { userRepository } from 'src/models/repositories/UserRepository';
import type { User } from 'src/models/User';
import { ref } from 'vue';

export function useUsers(): {
  users: typeof users;
  loading: typeof loading;
  error: typeof error;
  fetchUsers: () => Promise<void>;
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

  return {
    users,
    loading,
    error,
    fetchUsers,
  };
}
