import { getUrl } from 'aws-amplify/storage';
import { userRepository } from 'src/models/repositories/UserRepository';
import type { UpdateUserData, User, UserRole } from 'src/models/User';
import { ref } from 'vue';

type UpdatableUserFields = {
  name?: string;
  role?: UserRole;
  avatar?: string | null | undefined;
  picture?: string | null | undefined;
  contactInfo?: string | null | undefined;
  lastActive?: string | null | undefined;
};

export function useUsers(): {
  loading: typeof loading;
  error: typeof error;
  fetchUsers: () => Promise<User[]>;
  getUserById: (id: string) => Promise<User | null>;
  addUserToGroup: (userId: string, groupName: string) => Promise<User | null>;
  updateUser: (id: string, data: UpdatableUserFields) => Promise<User | null>;
  resolvePictureUrl: (picture?: string | null) => Promise<string | null>;
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

  const getUserById = async (id: string): Promise<User | null> => {
    loading.value = true;
    error.value = null;
    try {
      return await userRepository.findById(id);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch user';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Admin mutation wrappers
  const addUserToGroup = async (userId: string, groupName: string): Promise<User | null> => {
    loading.value = true;
    error.value = null;
    let user;
    try {
      user = await userRepository.addUserToGroup(userId, groupName);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update user role';
    } finally {
      loading.value = false;
    }
    return user || null;
  };

  const updateUser = async (id: string, data: UpdatableUserFields): Promise<User | null> => {
    loading.value = true;
    error.value = null;
    try {
      const originalUser = await userRepository.findById(id);

      const updatePayload: UpdateUserData = {};
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.role !== undefined) updatePayload.role = data.role;
      if (data.avatar !== undefined) updatePayload.avatar = data.avatar ?? '';
      if (data.picture !== undefined) updatePayload.picture = data.picture ?? '';
      if (data.contactInfo !== undefined) updatePayload.contactInfo = data.contactInfo ?? '';
      if (data.lastActive !== undefined) updatePayload.lastActive = data.lastActive ?? '';

      const updatedUser = await userRepository.update(id, updatePayload);

      if (data.role && originalUser && originalUser.role !== data.role) {
        await userRepository.addUserToGroup(id, data.role);
      }

      return updatedUser;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update user';
      return null;
    } finally {
      loading.value = false;
    }
  };

  const resolvePictureUrl = async (picture?: string | null): Promise<string | null> => {
    if (!picture) {
      return null;
    }

    if (/^https?:\/\//i.test(picture)) {
      return picture;
    }

    try {
      const { url } = await getUrl({ path: picture });
      return url.toString();
    } catch (error) {
      console.error('Failed to resolve picture URL', error);
      return null;
    }
  };

  return {
    loading,
    error,
    fetchUsers,
    getUserById,
    addUserToGroup,
    updateUser,
    resolvePictureUrl,
  };
}
