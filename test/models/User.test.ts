import { describe, expect, it } from 'vitest';
import { User, UserRole } from '../../src/models/User';

describe('User Model', () => {
  const validUserData = {
    id: 'user-1',
    name: 'John Doe',
    role: UserRole.STUDENT,
    email: 'john@example.com',
    avatar: 'avatar-url',
    contactInfo: 'contact-info',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  describe('constructor', () => {
    it('should create a valid user instance', () => {
      const user = new User(validUserData);

      expect(user.id).toBe('user-1');
      expect(user.name).toBe('John Doe');
      expect(user.role).toBe(UserRole.STUDENT);
      expect(user.email).toBe('john@example.com');
      expect(user.avatar).toBe('avatar-url');
      expect(user.contactInfo).toBe('contact-info');
      expect(user.createdAt).toBe('2023-01-01T00:00:00Z');
      expect(user.updatedAt).toBe('2023-01-01T00:00:00Z');
    });

    it('should create user without optional timestamps', () => {
      const userDataWithoutTimestamps = {
        id: 'user-2',
        name: 'Jane Doe',
        role: UserRole.EDUCATOR,
        email: 'jane@example.com',
        avatar: 'avatar-url-2',
        contactInfo: 'contact-info-2',
      };

      const user = new User(userDataWithoutTimestamps);

      expect(user.id).toBe('user-2');
      expect(user.createdAt).toBeUndefined();
      expect(user.updatedAt).toBeUndefined();
    });

    it('should throw error for invalid email', () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      expect(() => new User(invalidData)).toThrow('Invalid email format');
    });

    it('should throw error for empty name', () => {
      const invalidData = { ...validUserData, name: '' };

      expect(() => new User(invalidData)).toThrow('User name is required');
    });

    it('should throw error for whitespace-only name', () => {
      const invalidData = { ...validUserData, name: '   ' };

      expect(() => new User(invalidData)).toThrow('User name is required');
    });

    it('should throw error for empty email', () => {
      const invalidData = { ...validUserData, email: '' };

      expect(() => new User(invalidData)).toThrow('User email is required');
    });

    it('should throw error for invalid user role', () => {
      const invalidData = { ...validUserData, role: 'INVALID_ROLE' as UserRole };

      expect(() => new User(invalidData)).toThrow('Invalid user role');
    });
  });

  describe('role checking methods', () => {
    it('should correctly identify student role', () => {
      const student = new User({ ...validUserData, role: UserRole.STUDENT });

      expect(student.isStudent()).toBe(true);
      expect(student.isEducator()).toBe(false);
      expect(student.isParent()).toBe(false);
    });

    it('should correctly identify educator role', () => {
      const educator = new User({ ...validUserData, role: UserRole.EDUCATOR });

      expect(educator.isStudent()).toBe(false);
      expect(educator.isEducator()).toBe(true);
      expect(educator.isParent()).toBe(false);
    });

    it('should correctly identify parent role', () => {
      const parent = new User({ ...validUserData, role: UserRole.PARENT });

      expect(parent.isStudent()).toBe(false);
      expect(parent.isEducator()).toBe(false);
      expect(parent.isParent()).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should return correct display name', () => {
      const user = new User(validUserData);

      expect(user.getDisplayName()).toBe('John Doe');
    });

    it('should trim display name', () => {
      const user = new User({ ...validUserData, name: '  John Doe  ' });

      expect(user.getDisplayName()).toBe('John Doe');
    });

    it('should return correct initials for full name', () => {
      const user = new User(validUserData);

      expect(user.getInitials()).toBe('JD');
    });

    it('should handle single name for initials', () => {
      const user = new User({ ...validUserData, name: 'John' });

      expect(user.getInitials()).toBe('J');
    });

    it('should handle three names for initials (max 2)', () => {
      const user = new User({ ...validUserData, name: 'John Michael Doe' });

      expect(user.getInitials()).toBe('JM');
    });

    it('should handle empty name parts for initials', () => {
      const user = new User({ ...validUserData, name: 'John  Doe' });

      expect(user.getInitials()).toBe('JD');
    });
  });

  describe('update method', () => {
    it('should create updated user instance', () => {
      const user = new User(validUserData);
      const updatedUser = user.update({ name: 'Jane Doe' });

      expect(updatedUser.name).toBe('Jane Doe');
      expect(updatedUser.email).toBe(validUserData.email); // unchanged
      expect(updatedUser.id).toBe(validUserData.id); // unchanged
      expect(updatedUser.role).toBe(validUserData.role); // unchanged
    });

    it('should handle multiple field updates', () => {
      const user = new User(validUserData);
      const updatedUser = user.update({
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: UserRole.PARENT,
      });

      expect(updatedUser.name).toBe('Jane Smith');
      expect(updatedUser.email).toBe('jane.smith@example.com');
      expect(updatedUser.role).toBe(UserRole.PARENT);
      expect(updatedUser.id).toBe(validUserData.id); // unchanged
    });

    it('should preserve timestamps in updates', () => {
      const user = new User(validUserData);
      const updatedUser = user.update({ name: 'Jane Doe' });

      expect(updatedUser.createdAt).toBe(validUserData.createdAt);
      expect(updatedUser.updatedAt).toBe(validUserData.updatedAt);
    });

    it('should validate updated data', () => {
      const user = new User(validUserData);

      expect(() => user.update({ email: 'invalid-email' })).toThrow('Invalid email format');
      expect(() => user.update({ name: '' })).toThrow('User name is required');
    });
  });

  describe('clone method', () => {
    it('should create identical copy', () => {
      const user = new User(validUserData);
      const clonedUser = user.clone();

      expect(clonedUser.equals(user)).toBe(true);
      expect(clonedUser).not.toBe(user); // different instances
      expect(clonedUser.id).toBe(user.id);
      expect(clonedUser.name).toBe(user.name);
      expect(clonedUser.email).toBe(user.email);
    });

    it('should handle user without timestamps', () => {
      const userDataWithoutTimestamps = {
        id: 'user-2',
        name: 'Jane Doe',
        role: UserRole.EDUCATOR,
        email: 'jane@example.com',
        avatar: 'avatar-url-2',
        contactInfo: 'contact-info-2',
      };

      const user = new User(userDataWithoutTimestamps);
      const clonedUser = user.clone();

      expect(clonedUser.equals(user)).toBe(true);
      expect(clonedUser.createdAt).toBeUndefined();
      expect(clonedUser.updatedAt).toBeUndefined();
    });
  });

  describe('toJSON method', () => {
    it('should return complete object representation', () => {
      const user = new User(validUserData);
      const json = user.toJSON();

      expect(json).toEqual({
        id: 'user-1',
        name: 'John Doe',
        role: UserRole.STUDENT,
        email: 'john@example.com',
        avatar: 'avatar-url',
        contactInfo: 'contact-info',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      });
    });

    it('should handle undefined timestamps', () => {
      const userDataWithoutTimestamps = {
        id: 'user-2',
        name: 'Jane Doe',
        role: UserRole.EDUCATOR,
        email: 'jane@example.com',
        avatar: 'avatar-url-2',
        contactInfo: 'contact-info-2',
      };

      const user = new User(userDataWithoutTimestamps);
      const json = user.toJSON();

      expect(json.createdAt).toBeUndefined();
      expect(json.updatedAt).toBeUndefined();
    });
  });

  describe('equals method', () => {
    it('should return true for users with same ID', () => {
      const user1 = new User(validUserData);
      const user2 = new User({ ...validUserData, name: 'Different Name' });

      expect(user1.equals(user2)).toBe(true);
    });

    it('should return false for users with different IDs', () => {
      const user1 = new User(validUserData);
      const user2 = new User({ ...validUserData, id: 'different-id' });

      expect(user1.equals(user2)).toBe(false);
    });
  });

  describe('email validation', () => {
    const testCases = [
      { email: 'test@example.com', valid: true },
      { email: 'user.name@domain.co.uk', valid: true },
      { email: 'user+tag@example.org', valid: true },
      { email: 'invalid-email', valid: false },
      { email: '@example.com', valid: false },
      { email: 'test@', valid: false },
      { email: 'test.example.com', valid: false },
      { email: '', valid: false },
    ];

    testCases.forEach(({ email, valid }) => {
      it(`should ${valid ? 'accept' : 'reject'} email: ${email}`, () => {
        const userData = { ...validUserData, email };

        if (valid) {
          expect(() => new User(userData)).not.toThrow();
        } else {
          expect(() => new User(userData)).toThrow();
        }
      });
    });
  });
});
