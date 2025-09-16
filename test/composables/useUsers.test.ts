import { userRepository } from 'src/models/repositories/UserRepository';
import type { User } from 'src/models/User';
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
    status: 'Active',
  },
  {
    id: '2',
    name: 'Bob',
    role: 'Parent',
    email: 'bob@example.com',
    avatar: '',
    contactInfo: '',
    status: 'Active',
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
  });
});
