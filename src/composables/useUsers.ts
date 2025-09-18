import { userRepository } from 'src/models/repositories/UserRepository';
import { UserRole, type UpdateUserData, type User } from 'src/models/User';
import { ref } from 'vue';

type UpdatableUserFields = {
  name?: string;
  role?: UserRole;
  avatar?: string | null | undefined;
  picture?: string | null | undefined;
  contactInfo?: string | null | undefined;
  lastActive?: string | null | undefined;
};

// eslint-disable-next-line max-lines-per-function
export function useUsers(): {
  loading: typeof loading;
  error: typeof error;
  fetchUsers: () => Promise<User[]>;
  getUserById: (id: string) => Promise<User | null>;
  addUserToGroup: (userId: string, groupName: string) => Promise<User | null>;
  updateUser: (id: string, data: UpdatableUserFields) => Promise<User | null>;
  assignEducatorToStudent: (
    studentId: string,
    educatorId: string,
  ) => Promise<{ student: User | null; educator: User | null }>;
  unassignEducatorFromStudent: (
    studentId: string,
    educatorId: string,
  ) => Promise<{ student: User | null; educator: User | null }>;
  assignParentToStudent: (
    studentId: string,
    parentId: string,
  ) => Promise<{ student: User | null; parent: User | null }>;
  removeParentFromStudent: (
    studentId: string,
    parentId: string,
  ) => Promise<{ student: User | null; parent: User | null }>;
  getUsersByIds: (ids: string[]) => Promise<User[]>;
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

  const getUsersByIds = async (ids: string[]): Promise<User[]> => {
    if (ids.length === 0) {
      return [];
    }

    loading.value = true;
    error.value = null;

    try {
      const results = await Promise.all(
        ids.map((identifier) => userRepository.findById(identifier)),
      );
      return results.filter((user): user is User => user !== null);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load users';
      return [];
    } finally {
      loading.value = false;
    }
  };

  const assignEducatorToStudent = async (
    studentId: string,
    educatorId: string,
  ): Promise<{ student: User | null; educator: User | null }> => {
    loading.value = true;
    error.value = null;

    try {
      const [student, educator] = await Promise.all([
        userRepository.findById(studentId),
        userRepository.findById(educatorId),
      ]);

      if (!student || student.role !== UserRole.STUDENT) {
        throw new Error('Student not found');
      }

      if (!educator || educator.role !== UserRole.EDUCATOR) {
        throw new Error('Educator not found');
      }

      if (student.educators.some((relation) => relation.id === educatorId)) {
        return { student, educator };
      }

      const result = await userRepository.linkEducatorToStudent(studentId, educatorId);

      if (!result.student || !result.educator) {
        throw new Error('Failed to assign educator');
      }

      return result;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to assign educator';
      return { student: null, educator: null };
    } finally {
      loading.value = false;
    }
  };

  const unassignEducatorFromStudent = async (
    studentId: string,
    educatorId: string,
  ): Promise<{ student: User | null; educator: User | null }> => {
    loading.value = true;
    error.value = null;

    try {
      const [student, educator] = await Promise.all([
        userRepository.findById(studentId),
        userRepository.findById(educatorId),
      ]);

      if (!student || student.role !== UserRole.STUDENT) {
        throw new Error('Student not found');
      }

      if (!educator || educator.role !== UserRole.EDUCATOR) {
        throw new Error('Educator not found');
      }

      if (!student.educators.some((relation) => relation.id === educatorId)) {
        return { student, educator };
      }

      const result = await userRepository.unlinkEducatorFromStudent(studentId, educatorId);

      if (!result.student || !result.educator) {
        throw new Error('Failed to unassign educator');
      }

      return result;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to unassign educator';
      return { student: null, educator: null };
    } finally {
      loading.value = false;
    }
  };

  const assignParentToStudent = async (
    studentId: string,
    parentId: string,
  ): Promise<{ student: User | null; parent: User | null }> => {
    loading.value = true;
    error.value = null;

    try {
      const [student, parent] = await Promise.all([
        userRepository.findById(studentId),
        userRepository.findById(parentId),
      ]);

      if (!student || student.role !== UserRole.STUDENT) {
        throw new Error('Student not found');
      }

      if (!parent || parent.role !== UserRole.PARENT) {
        throw new Error('Parent not found');
      }

      if (student.parents.some((relation) => relation.id === parentId)) {
        return { student, parent };
      }

      const result = await userRepository.linkParentToStudent(studentId, parentId);

      if (!result.student || !result.parent) {
        throw new Error('Failed to assign parent');
      }

      return result;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to assign parent';
      return { student: null, parent: null };
    } finally {
      loading.value = false;
    }
  };

  const removeParentFromStudent = async (
    studentId: string,
    parentId: string,
  ): Promise<{ student: User | null; parent: User | null }> => {
    loading.value = true;
    error.value = null;

    try {
      const [student, parent] = await Promise.all([
        userRepository.findById(studentId),
        userRepository.findById(parentId),
      ]);

      if (!student || student.role !== UserRole.STUDENT) {
        throw new Error('Student not found');
      }

      if (!parent || parent.role !== UserRole.PARENT) {
        throw new Error('Parent not found');
      }

      if (!student.parents.some((relation) => relation.id === parentId)) {
        return { student, parent };
      }

      const result = await userRepository.unlinkParentFromStudent(studentId, parentId);

      if (!result.student || !result.parent) {
        throw new Error('Failed to remove parent');
      }

      return result;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to remove parent';
      return { student: null, parent: null };
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    fetchUsers,
    getUserById,
    addUserToGroup,
    updateUser,
    getUsersByIds,
    assignEducatorToStudent,
    unassignEducatorFromStudent,
    assignParentToStudent,
    removeParentFromStudent,
  };
}
