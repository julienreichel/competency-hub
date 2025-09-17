import { userRepository } from 'src/models/repositories/UserRepository';
import type { User } from 'src/models/User';
import { UserRole } from 'src/models/User';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUsers } from '../../src/composables/useUsers';

const mockUsers = [
  {
    id: '1',
    name: 'Alice',
    role: 'Student',
    email: 'alice@example.com',
    avatar: '',
    contactInfo: '',
  },
  {
    id: '2',
    name: 'Bob',
    role: 'Parent',
    email: 'bob@example.com',
    avatar: '',
    contactInfo: '',
  },
];

describe('useUsers - User Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and exposes users for the UI', async () => {
    vi.spyOn(userRepository, 'findAll').mockResolvedValueOnce(mockUsers as unknown as User[]);
    const { loading, error, fetchUsers } = useUsers();

    expect(loading.value).toBe(false);
    expect(error.value).toBe(null);

    const promise = fetchUsers();
    expect(loading.value).toBe(true);
    const users = await promise;
    expect(users).toEqual(mockUsers);
    expect(loading.value).toBe(false);
    expect(error.value).toBe(null);
  });

  it('shows an error if fetching users fails', async () => {
    vi.spyOn(userRepository, 'findAll').mockRejectedValueOnce(new Error('Network error'));
    const { loading, error, fetchUsers } = useUsers();

    const users = await fetchUsers();
    expect(users).toEqual([]);
    expect(loading.value).toBe(false);
    expect(error.value).toBe('Network error');
  });

  it('shows a generic error if thrown value is not an Error', async () => {
    vi.spyOn(userRepository, 'findAll').mockRejectedValueOnce('fail');
    const { loading, error, fetchUsers } = useUsers();

    const users = await fetchUsers();
    expect(users).toEqual([]);
    expect(loading.value).toBe(false);
    expect(error.value).toBe('Failed to fetch users');
  });

  describe('getUserById', () => {
    it('returns the user when found', async () => {
      const foundUser = { id: 'user-1' } as unknown as User;
      vi.spyOn(userRepository, 'findById').mockResolvedValueOnce(foundUser);
      const { getUserById, error, loading } = useUsers();

      const promise = getUserById('user-1');
      expect(loading.value).toBe(true);
      const result = await promise;

      expect(result).toBe(foundUser);
      expect(error.value).toBeNull();
      expect(loading.value).toBe(false);
    });

    it('returns null when the user is not found', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValueOnce(null);
      const { getUserById, error, loading } = useUsers();

      const result = await getUserById('missing-user');

      expect(result).toBeNull();
      expect(error.value).toBeNull();
      expect(loading.value).toBe(false);
    });

    it('records an error when lookup fails', async () => {
      vi.spyOn(userRepository, 'findById').mockRejectedValueOnce(new Error('boom'));
      const { getUserById, error, loading } = useUsers();

      const result = await getUserById('user-1');

      expect(result).toBeNull();
      expect(error.value).toBe('boom');
      expect(loading.value).toBe(false);
    });
  });

  describe('admin functions', () => {
    it('addUserToGroup returns the updated user on success', async () => {
      const updatedUser = { id: 'user-1' } as unknown as User;
      vi.spyOn(userRepository, 'addUserToGroup').mockResolvedValueOnce(updatedUser);
      const { addUserToGroup, error, loading } = useUsers();

      const result = await addUserToGroup('user-1', 'Admin');

      expect(result).toBe(updatedUser);
      expect(error.value).toBeNull();
      expect(loading.value).toBe(false);
    });

    it('addUserToGroup returns null and sets error on failure', async () => {
      const failure = new Error('fail');
      vi.spyOn(userRepository, 'addUserToGroup').mockRejectedValueOnce(failure);
      const { addUserToGroup, error, loading } = useUsers();

      const result = await addUserToGroup('user-1', 'Admin');

      expect(result).toBeNull();
      expect(error.value).toBe('fail');
      expect(loading.value).toBe(false);
    });

    it('updateUser returns updated user on success', async () => {
      const originalUser = {
        id: 'user-1',
        name: 'Original',
        role: UserRole.STUDENT,
      } as unknown as User;
      const updatedUser = {
        id: 'user-1',
        name: 'Updated Name',
        role: UserRole.STUDENT,
      } as unknown as User;
      vi.spyOn(userRepository, 'findById').mockResolvedValueOnce(originalUser);
      const updateSpy = vi.spyOn(userRepository, 'update').mockResolvedValueOnce(updatedUser);
      const addUserToGroupSpy = vi.spyOn(userRepository, 'addUserToGroup').mockResolvedValue(null);
      const { updateUser, error, loading } = useUsers();

      const result = await updateUser('user-1', { name: 'Updated Name' });

      expect(result).toBe(updatedUser);
      expect(error.value).toBeNull();
      expect(loading.value).toBe(false);
      expect(updateSpy).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ name: 'Updated Name' }),
      );
      expect(addUserToGroupSpy).not.toHaveBeenCalled();
    });

    it('updateUser returns null and records error on failure', async () => {
      const failure = new Error('Update failed');
      vi.spyOn(userRepository, 'findById').mockResolvedValueOnce({
        id: 'user-1',
        role: UserRole.STUDENT,
      } as unknown as User);
      vi.spyOn(userRepository, 'update').mockRejectedValueOnce(failure);
      const { updateUser, error, loading } = useUsers();

      const result = await updateUser('user-1', { name: 'Updated Name' });

      expect(result).toBeNull();
      expect(error.value).toBe('Update failed');
      expect(loading.value).toBe(false);
    });

    it('updateUser synchronizes role changes with group membership', async () => {
      const originalUser = { id: 'user-1', role: UserRole.STUDENT } as unknown as User;
      const updatedUser = { id: 'user-1', role: UserRole.EDUCATOR } as unknown as User;
      vi.spyOn(userRepository, 'findById').mockResolvedValueOnce(originalUser);
      vi.spyOn(userRepository, 'update').mockResolvedValueOnce(updatedUser);
      const addUserToGroupSpy = vi
        .spyOn(userRepository, 'addUserToGroup')
        .mockResolvedValueOnce(updatedUser);

      const { updateUser } = useUsers();

      await updateUser('user-1', { role: UserRole.EDUCATOR });

      expect(addUserToGroupSpy).toHaveBeenCalledWith('user-1', UserRole.EDUCATOR);
    });
  });
});
