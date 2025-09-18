import { describe, expect, it } from 'vitest';
import { User, UserRole, type UserRelationInit } from '../../src/models/User';

describe('User Model', () => {
  const buildRelation = (
    id: string,
    role: UserRole,
    overrides: Partial<UserRelationInit> = {},
  ): UserRelationInit => ({
    id,
    name: `${role} ${id}`,
    role,
    email: `${id}@example.com`,
    avatar: '',
    picture: null,
    contactInfo: '',
    lastActive: null,
    ...overrides,
  });

  const baseEducator = buildRelation('educator-1', UserRole.EDUCATOR);
  const baseParent = buildRelation('parent-1', UserRole.PARENT);
  const baseStudent = buildRelation('student-1', UserRole.STUDENT);

  const baseInit: Parameters<typeof User.create>[0] = {
    id: 'user-1',
    name: 'John Doe',
    role: UserRole.STUDENT,
    email: 'john@example.com',
    avatar: 'avatar-url',
    contactInfo: 'contact-info',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    educators: [baseEducator],
    parents: [baseParent],
    students: [baseStudent],
  };

  const makeUser = (overrides: Partial<Parameters<typeof User.create>[0]> = {}): User =>
    User.create({ ...baseInit, ...overrides });

  describe('constructor', () => {
    it('should create a valid user instance', () => {
      const user = makeUser();
      expect(user.id).toBe('user-1');
      expect(user.name).toBe('John Doe');
      expect(user.role).toBe(UserRole.STUDENT);
      expect(user.email).toBe('john@example.com');
      expect(user.avatar).toBe('avatar-url');
      expect(user.contactInfo).toBe('contact-info');
      expect(user.createdAt).toBe('2023-01-01T00:00:00Z');
      expect(user.updatedAt).toBe('2023-01-01T00:00:00Z');
      expect(user.educatorIds).toEqual(['educator-1']);
      expect(user.parentIds).toEqual(['parent-1']);
      expect(user.studentIds).toEqual(['student-1']);
    });

    it('should create user without optional timestamps', () => {
      const user = User.create({
        id: 'user-2',
        name: 'Jane Doe',
        role: UserRole.EDUCATOR,
        email: 'jane@example.com',
        avatar: 'avatar-url-2',
        contactInfo: 'contact-info-2',
        educators: [],
        parents: [],
        students: [],
      });

      expect(user.id).toBe('user-2');
      expect(user.createdAt).toBeUndefined();
      expect(user.updatedAt).toBeUndefined();
    });

    it('should throw error for invalid email', () => {
      expect(() => makeUser({ email: 'invalid-email' })).toThrow('Invalid email format');
    });

    it('should throw error for empty name', () => {
      expect(() => makeUser({ name: '' })).toThrow('User name is required');
    });

    it('should throw error for whitespace-only name', () => {
      expect(() => makeUser({ name: '   ' })).toThrow('User name is required');
    });

    it('should throw error for empty email', () => {
      expect(() => makeUser({ email: '' })).toThrow('User email is required');
    });

    it('should default to Unknown for invalid user role', () => {
      const user = makeUser({ role: 'INVALID_ROLE' as UserRole });
      expect(user.role).toBe(UserRole.UNKNOWN);
    });
  });

  describe('role checking methods', () => {
    it('should correctly identify student role', () => {
      const student = makeUser({ role: UserRole.STUDENT });

      expect(student.isStudent()).toBe(true);
      expect(student.isEducator()).toBe(false);
      expect(student.isParent()).toBe(false);
    });

    it('should correctly identify educator role', () => {
      const educator = makeUser({ role: UserRole.EDUCATOR });

      expect(educator.isStudent()).toBe(false);
      expect(educator.isEducator()).toBe(true);
      expect(educator.isParent()).toBe(false);
    });

    it('should correctly identify parent role', () => {
      const parent = makeUser({ role: UserRole.PARENT });

      expect(parent.isStudent()).toBe(false);
      expect(parent.isEducator()).toBe(false);
      expect(parent.isParent()).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should return correct display name', () => {
      const user = makeUser();

      expect(user.getDisplayName()).toBe('John Doe');
    });

    it('should trim display name', () => {
      const user = makeUser({ name: '  John Doe  ' });

      expect(user.getDisplayName()).toBe('John Doe');
    });

    it('should return correct initials for full name', () => {
      const user = makeUser();

      expect(user.getInitials()).toBe('JD');
    });

    it('should handle single name for initials', () => {
      const user = makeUser({ name: 'John' });

      expect(user.getInitials()).toBe('J');
    });

    it('should handle three names for initials (max 2)', () => {
      const user = makeUser({ name: 'John Michael Doe' });

      expect(user.getInitials()).toBe('JM');
    });

    it('should handle empty name parts for initials', () => {
      const user = makeUser({ name: 'John  Doe' });

      expect(user.getInitials()).toBe('JD');
    });
  });

  describe('update method', () => {
    it('should create updated user instance', () => {
      const user = makeUser();
      const updatedUser = user.update({ name: 'Jane Doe' });

      expect(updatedUser.name).toBe('Jane Doe');
      expect(updatedUser.email).toBe(baseInit.email); // unchanged
      expect(updatedUser.id).toBe(baseInit.id); // unchanged
      expect(updatedUser.role).toBe(baseInit.role); // unchanged
      expect(updatedUser.educatorIds).toEqual(['educator-1']);
      expect(updatedUser.parentIds).toEqual(['parent-1']);
      expect(updatedUser.studentIds).toEqual(['student-1']);
    });

    it('should handle multiple field updates', () => {
      const user = makeUser();
      const updatedUser = user.update({
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: UserRole.PARENT,
        students: [buildRelation('student-42', UserRole.STUDENT)],
      });

      expect(updatedUser.name).toBe('Jane Smith');
      expect(updatedUser.email).toBe('jane.smith@example.com');
      expect(updatedUser.role).toBe(UserRole.PARENT);
      expect(updatedUser.id).toBe(baseInit.id); // unchanged
      expect(updatedUser.studentIds).toEqual(['student-42']);
    });

    it('should preserve timestamps in updates', () => {
      const user = makeUser();
      const updatedUser = user.update({ name: 'Jane Doe' });

      expect(updatedUser.createdAt).toBe(baseInit.createdAt);
      expect(updatedUser.updatedAt).toBe(baseInit.updatedAt);
    });

    it('should validate updated data', () => {
      const user = makeUser();

      expect(() => user.update({ email: 'invalid-email' })).toThrow('Invalid email format');
      expect(() => user.update({ name: '' })).toThrow('User name is required');
    });
  });

  describe('clone method', () => {
    it('should create identical copy', () => {
      const user = makeUser();
      const clonedUser = user.clone();

      expect(clonedUser.equals(user)).toBe(true);
      expect(clonedUser).not.toBe(user); // different instances
      expect(clonedUser.id).toBe(user.id);
      expect(clonedUser.name).toBe(user.name);
      expect(clonedUser.email).toBe(user.email);
    });

    it('should handle user without timestamps', () => {
      const user = User.create({
        id: 'user-3',
        name: 'Jane Doe',
        role: UserRole.STUDENT,
        email: 'jane@example.com',
        educators: [],
        parents: [],
        students: [],
      });
      const clonedUser = user.clone();

      expect(clonedUser.createdAt).toBeUndefined();
      expect(clonedUser.updatedAt).toBeUndefined();
    });
  });

  describe('equals method', () => {
    it('should return true for same id', () => {
      const user1 = makeUser();
      const user2 = makeUser({ name: 'Different Name' });

      expect(user1.equals(user2)).toBe(true);
    });

    it('should return false for different ids', () => {
      const user1 = makeUser();
      const user2 = makeUser({ id: 'different-id' });

      expect(user1.equals(user2)).toBe(false);
    });
  });
});
