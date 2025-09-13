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
    const { users, loading, error, fetchUsers } = useUsers();

    expect(users.value).toEqual([]);
    expect(loading.value).toBe(false);
    expect(error.value).toBe(null);

    const promise = fetchUsers();
    expect(loading.value).toBe(true);
    await promise;
    expect(users.value).toEqual(mockUsers);
    expect(loading.value).toBe(false);
    expect(error.value).toBe(null);
  });

  it('shows an error if fetching users fails', async () => {
    vi.spyOn(userRepository, 'findAll').mockRejectedValueOnce(new Error('Network error'));
    const { users, loading, error, fetchUsers } = useUsers();

    await fetchUsers();
    expect(users.value).toEqual([]);
    expect(loading.value).toBe(false);
    expect(error.value).toBe('Network error');
  });

  it('shows a generic error if thrown value is not an Error', async () => {
    vi.spyOn(userRepository, 'findAll').mockRejectedValueOnce('fail');
    const { users, loading, error, fetchUsers } = useUsers();

    await fetchUsers();
    expect(users.value).toEqual([]);
    expect(loading.value).toBe(false);
    expect(error.value).toBe('Failed to fetch users');
  });
});
