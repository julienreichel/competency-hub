import { userRepository } from 'src/models/repositories/UserRepository';
import { User, UserRole } from 'src/models/User';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserFormatters } from '../../src/composables/useUserFormatters';
import { useUsers } from '../../src/composables/useUsers';

vi.mock('aws-amplify/storage', () => ({
  getUrl: vi.fn(),
}));

import { getUrl } from 'aws-amplify/storage';
const mockedGetUrl = vi.mocked(getUrl);

const baseUserData = {
  id: 'user-base',
  name: 'Test User',
  role: UserRole.STUDENT,
  email: 'user@example.com',
  avatar: '',
  picture: null,
  contactInfo: '',
  educatorIds: [] as string[],
  parentIds: [] as string[],
  studentIds: [] as string[],
};

function buildUser(overrides: Partial<typeof baseUserData>): User {
  return User.create({
    ...baseUserData,
    ...overrides,
  });
}

const mockUsers = [
  {
    id: '1',
    name: 'Alice',
    role: 'Student',
    email: 'alice@example.com',
    avatar: '',
    contactInfo: '',
    educatorIds: [],
    parentIds: [],
    studentIds: [],
  },
  {
    id: '2',
    name: 'Bob',
    role: 'Parent',
    email: 'bob@example.com',
    avatar: '',
    contactInfo: '',
    educatorIds: [],
    parentIds: [],
    studentIds: [],
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
        avatar: '',
        picture: null,
      } as unknown as User;
      const updatedUser = {
        id: 'user-1',
        name: 'Updated Name',
        role: UserRole.STUDENT,
        avatar: '',
        picture: null,
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

    it('updateUser persists picture changes when provided', async () => {
      const originalUser = {
        id: 'user-1',
        role: UserRole.STUDENT,
        avatar: '',
        picture: null,
      } as unknown as User;
      const updatedUser = {
        id: 'user-1',
        role: UserRole.STUDENT,
        avatar: '',
        picture: 'protected/profile/new-photo',
      } as unknown as User;
      vi.spyOn(userRepository, 'findById').mockResolvedValueOnce(originalUser);
      const updateSpy = vi.spyOn(userRepository, 'update').mockResolvedValueOnce(updatedUser);
      const { updateUser } = useUsers();

      await updateUser('user-1', { picture: 'protected/profile/new-photo' });

      expect(updateSpy).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ picture: 'protected/profile/new-photo' }),
      );
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

  describe('assignment helpers', () => {
    it('assigns an educator to a student and updates both records', async () => {
      const student = buildUser({ id: 'student-1', role: UserRole.STUDENT, educatorIds: [] });
      const educator = buildUser({
        id: 'educator-1',
        role: UserRole.EDUCATOR,
        studentIds: [],
      });

      vi.spyOn(userRepository, 'findById').mockImplementation((id: string) => {
        if (id === 'student-1') return Promise.resolve(student);
        if (id === 'educator-1') return Promise.resolve(educator);
        return Promise.resolve(null);
      });

      const linkSpy = vi.spyOn(userRepository, 'linkEducatorToStudent').mockResolvedValue({
        student: buildUser({
          id: 'student-1',
          role: UserRole.STUDENT,
          educatorIds: ['educator-1'],
        }),
        educator: buildUser({
          id: 'educator-1',
          role: UserRole.EDUCATOR,
          studentIds: ['student-1'],
        }),
      });

      const { assignEducatorToStudent } = useUsers();

      const result = await assignEducatorToStudent('student-1', 'educator-1');

      expect(result.student?.educatorIds).toEqual(['educator-1']);
      expect(result.educator?.studentIds).toEqual(['student-1']);
      expect(linkSpy).toHaveBeenCalledWith('student-1', 'educator-1');
    });

    it('unassigns an educator from a student', async () => {
      const student = buildUser({
        id: 'student-1',
        role: UserRole.STUDENT,
        educatorIds: ['educator-1'],
      });
      const educator = buildUser({
        id: 'educator-1',
        role: UserRole.EDUCATOR,
        studentIds: ['student-1'],
      });

      vi.spyOn(userRepository, 'findById').mockImplementation((id: string) => {
        if (id === 'student-1') return Promise.resolve(student);
        if (id === 'educator-1') return Promise.resolve(educator);
        return Promise.resolve(null);
      });

      const unlinkSpy = vi.spyOn(userRepository, 'unlinkEducatorFromStudent').mockResolvedValue({
        student: buildUser({
          id: 'student-1',
          role: UserRole.STUDENT,
          educatorIds: [],
        }),
        educator: buildUser({
          id: 'educator-1',
          role: UserRole.EDUCATOR,
          studentIds: [],
        }),
      });

      const { unassignEducatorFromStudent } = useUsers();

      const result = await unassignEducatorFromStudent('student-1', 'educator-1');

      expect(result.student?.educatorIds).toEqual([]);
      expect(result.educator?.studentIds).toEqual([]);
      expect(unlinkSpy).toHaveBeenCalledWith('student-1', 'educator-1');
    });

    it('assigns and removes parents for a student', async () => {
      const student = buildUser({ id: 'student-1', role: UserRole.STUDENT, parentIds: [] });
      const parent = buildUser({ id: 'parent-1', role: UserRole.PARENT, studentIds: [] });

      const findByIdSpy = vi.spyOn(userRepository, 'findById').mockImplementation((id: string) => {
        if (id === 'student-1') return Promise.resolve(student);
        if (id === 'parent-1') return Promise.resolve(parent);
        return Promise.resolve(null);
      });

      const linkParentSpy = vi.spyOn(userRepository, 'linkParentToStudent').mockResolvedValue({
        student: buildUser({
          id: 'student-1',
          role: UserRole.STUDENT,
          parentIds: ['parent-1'],
        }),
        parent: buildUser({
          id: 'parent-1',
          role: UserRole.PARENT,
          studentIds: ['student-1'],
        }),
      });
      const unlinkParentSpy = vi
        .spyOn(userRepository, 'unlinkParentFromStudent')
        .mockResolvedValue({
          student: buildUser({
            id: 'student-1',
            role: UserRole.STUDENT,
            parentIds: [],
          }),
          parent: buildUser({
            id: 'parent-1',
            role: UserRole.PARENT,
            studentIds: [],
          }),
        });

      const { assignParentToStudent, removeParentFromStudent } = useUsers();

      const assignmentResult = await assignParentToStudent('student-1', 'parent-1');

      expect(assignmentResult.student?.parentIds).toEqual(['parent-1']);
      expect(assignmentResult.parent?.studentIds).toEqual(['student-1']);

      // Simulate updated users for removal
      findByIdSpy.mockImplementation((id: string) => {
        if (id === 'student-1')
          return Promise.resolve(
            buildUser({ id: 'student-1', role: UserRole.STUDENT, parentIds: ['parent-1'] }),
          );
        if (id === 'parent-1')
          return Promise.resolve(
            buildUser({ id: 'parent-1', role: UserRole.PARENT, studentIds: ['student-1'] }),
          );
        return Promise.resolve(null);
      });

      const removalResult = await removeParentFromStudent('student-1', 'parent-1');
      expect(removalResult.student?.parentIds).toEqual([]);
      expect(removalResult.parent?.studentIds).toEqual([]);

      expect(findByIdSpy).toHaveBeenCalledTimes(4);
      expect(linkParentSpy).toHaveBeenCalledWith('student-1', 'parent-1');
      expect(unlinkParentSpy).toHaveBeenCalledWith('student-1', 'parent-1');
    });
  });

  it('retrieves multiple users by ids', async () => {
    const alice = buildUser({ id: 'alice', role: UserRole.STUDENT });
    const bob = buildUser({ id: 'bob', role: UserRole.EDUCATOR });

    vi.spyOn(userRepository, 'findById').mockImplementation((id: string) => {
      if (id === 'alice') return Promise.resolve(alice);
      if (id === 'bob') return Promise.resolve(bob);
      return Promise.resolve(null);
    });

    const { getUsersByIds } = useUsers();

    const results = await getUsersByIds(['alice', 'missing', 'bob']);

    expect(results).toHaveLength(2);
    expect(results[0]?.id).toBe('alice');
    expect(results[1]?.id).toBe('bob');
  });

  describe('resolvePictureUrl', () => {
    it('returns null when input is empty', async () => {
      const { resolvePictureUrl } = useUserFormatters();
      const result = await resolvePictureUrl(null);
      expect(result).toBeNull();
    });

    it('returns the original url when already absolute', async () => {
      const { resolvePictureUrl } = useUserFormatters();
      const url = 'https://example.com/photo.jpg';
      const result = await resolvePictureUrl(url);
      expect(result).toBe(url);
      expect(mockedGetUrl).not.toHaveBeenCalled();
    });

    it('resolves storage path via getUrl', async () => {
      const { resolvePictureUrl } = useUserFormatters();
      mockedGetUrl.mockResolvedValueOnce({
        url: new URL('https://example.com/photo.jpg'),
        expiresAt: new Date(),
      });

      const result = await resolvePictureUrl('protected/profile/photo.jpg');

      expect(result).toBe('https://example.com/photo.jpg');
      expect(mockedGetUrl).toHaveBeenCalledWith({ path: 'protected/profile/photo.jpg' });
    });

    it('returns null when getUrl fails', async () => {
      const { resolvePictureUrl } = useUserFormatters();
      mockedGetUrl.mockRejectedValueOnce(new Error('boom'));

      const result = await resolvePictureUrl('protected/profile/photo.jpg');

      expect(result).toBeNull();
    });
  });
});
