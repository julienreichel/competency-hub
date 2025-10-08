import { describe, expect, it, vi } from 'vitest';
import { User, UserRole } from '../../src/models/User';
import {
  createObject,
  extractUserRelation,
  hasToJSON,
  isObject,
  isPresent,
  mapArrayRelation,
  mapSingularRelation,
  normaliseCollection,
  unwrap,
} from '../../src/models/utils';

describe('models/utils', () => {
  describe('isObject', () => {
    it('returns true for plain objects', () => {
      expect(isObject({ a: 1 })).toBe(true);
    });

    it('returns false for primitives', () => {
      expect(isObject(42)).toBe(false);
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject('string')).toBe(false);
    });
  });

  describe('hasToJSON', () => {
    it('detects objects with toJSON method', () => {
      const candidate = { toJSON: vi.fn() };
      expect(hasToJSON(candidate)).toBe(true);
    });

    it('returns false when toJSON missing', () => {
      expect(hasToJSON({})).toBe(false);
      expect(hasToJSON(null)).toBe(false);
    });
  });

  describe('unwrap', () => {
    it('recursively unwraps toJSON payload', () => {
      const nested = {
        value: {
          id: '123',
        },
      };
      const chain = {
        toJSON: (): Record<string, unknown> => nested,
      };
      const result = unwrap({ toJSON: () => chain }) as { value: { id: string } };
      expect(result.value.id).toBe('123');
    });

    it('returns null when candidate not object', () => {
      expect(unwrap(null)).toBeNull();
      expect(unwrap('string')).toBeNull();
    });
  });

  describe('normaliseCollection', () => {
    it('returns empty array for falsy inputs', () => {
      expect(normaliseCollection(null)).toEqual([]);
      expect(normaliseCollection(undefined)).toEqual([]);
    });

    it('filters nullish values from arrays', () => {
      expect(normaliseCollection([1, null, 2, undefined])).toEqual([1, 2]);
    });

    it('handles objects with items array', () => {
      expect(normaliseCollection({ items: ['a', null, 'b'] })).toEqual(['a', 'b']);
    });

    it('handles objects with toArray function', () => {
      const input = { toArray: (): Array<unknown> => ['x', null, 'y'] };
      expect(normaliseCollection(input)).toEqual(['x', 'y']);
    });

    it('returns empty array for unsupported shapes', () => {
      expect(normaliseCollection({ foo: 'bar' })).toEqual([]);
    });
  });

  describe('extractUserRelation', () => {
    it('returns null for falsy input', () => {
      expect(extractUserRelation(null)).toBeNull();
    });

    it('unwraps nested toJSON payload and builds User instance', () => {
      const payload = {
        toJSON: (): Record<string, unknown> => ({
          id: 'user-1',
          email: 'user@example.com',
          name: 'User Example',
          role: 'Student',
          avatar: 'avatar',
          picture: 'picture',
          contactInfo: 'contact',
        }),
      };

      const user = extractUserRelation(payload);
      expect(user).toBeInstanceOf(User);
      expect(user?.role).toBe(UserRole.STUDENT);
      expect(user?.email).toBe('user@example.com');
    });

    it('normalises missing name and unknown roles', () => {
      const payload = {
        id: 'user-2',
        role: 'NonExistentRole',
        email: 'missingname@example.com',
      };

      const user = extractUserRelation(payload);
      expect(user).toBeInstanceOf(User);
      expect(user?.name).toBe('user-2');
      expect(user?.role).toBe(UserRole.UNKNOWN);
    });
  });

  describe('isPresent', () => {
    it('returns false for functions and empty values', () => {
      expect(isPresent(undefined)).toBe(false);
      expect(isPresent(null)).toBe(false);
      expect(isPresent(() => {})).toBe(false);
      expect(isPresent(async () => {})).toBe(false);
    });

    it('returns true for truthy non-function values', () => {
      expect(isPresent({})).toBe(true);
      expect(isPresent('hello')).toBe(true);
      expect(isPresent({ test: false })).toBe(true);
      expect(isPresent([])).toBe(true);
    });
  });

  describe('mapSingularRelation', () => {
    it('maps plain objects via mapper', () => {
      const result = mapSingularRelation(
        { id: '1', value: 'test' },
        (value: { id: string; value: string }) => ({ ...value, mapped: true }),
      );
      expect(result).toEqual({ id: '1', value: 'test', mapped: true });
    });

    it('returns null for unsupported shapes', () => {
      expect(mapSingularRelation(null, () => ({}))).toBeNull();
      expect(mapSingularRelation('string', () => ({}))).toBeNull();
      expect(
        mapSingularRelation(
          () => ({}),
          () => ({}),
        ),
      ).toBeNull();
    });
  });

  describe('mapArrayRelation', () => {
    it('maps array entries with mapper', () => {
      const result = mapArrayRelation(
        [
          { id: '1', value: 'a' },
          { id: '2', value: 'b' },
        ],
        (value: { id: string; value: string }) => ({ ...value, mapped: true }),
      );
      expect(result).toEqual([
        { id: '1', value: 'a', mapped: true },
        { id: '2', value: 'b', mapped: true },
      ]);
    });

    it('returns null for unsupported shapes', () => {
      expect(mapSingularRelation(null, () => ({}))).toBeNull();
      expect(mapSingularRelation('string', () => ({}))).toBeNull();
      expect(
        mapSingularRelation(
          () => ({}),
          () => ({}),
        ),
      ).toBeNull();
    });
  });

  describe('createObject', () => {
    class Dummy {
      value: string;
      constructor(args: { value: string }) {
        this.value = args.value;
      }
    }

    it('returns null for null/undefined input', () => {
      expect(createObject(null, Dummy)).toBeNull();
      expect(createObject(undefined, Dummy)).toBeNull();
    });

    it('returns instance if already constructed', () => {
      const instance = new Dummy({ value: 'foo' });
      expect(createObject(instance, Dummy)).toBe(instance);
    });

    it('constructs new instance from plain object', () => {
      const result = createObject({ value: 'bar' }, Dummy);
      expect(result).toBeInstanceOf(Dummy);
      expect(result?.value).toBe('bar');
    });
  });
});
