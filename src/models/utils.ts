// Utility functions for model normalization and type guards
import { User, UserRole } from './User';

/**
 * Checks if a value is a non-null object.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

/**
 * Checks if a value has a toJSON method.
 */
export function hasToJSON(value: unknown): value is { toJSON: () => unknown } {
  return isObject(value) && typeof value.toJSON === 'function';
}

/**
 * Recursively unwraps a value if it has a toJSON method.
 */
export function unwrap(candidate: unknown): Record<string, unknown> | null {
  if (!isObject(candidate)) return null;
  if (hasToJSON(candidate)) return unwrap(candidate.toJSON());
  return candidate;
}

/**
 * Normalizes a collection to an array of T, filtering out null/undefined.
 */
export type RelationCollection<T> =
  | T
  | T[]
  | { items?: T[] }
  | { toArray?: () => T[] }
  | null
  | undefined;

export function normaliseCollection<T>(input: RelationCollection<T>): T[];
export function normaliseCollection<T>(input: unknown): T[];
export function normaliseCollection<T>(input: unknown): T[] {
  const candidate = input as RelationCollection<T>;

  if (!candidate) {
    return [];
  }

  if (Array.isArray(candidate)) {
    return candidate.filter((item): item is T => item !== null && item !== undefined);
  }

  if (typeof candidate === 'object') {
    const items = (candidate as { items?: unknown }).items;
    if (Array.isArray(items)) {
      return items.filter((item): item is T => item !== null && item !== undefined);
    }

    const toArray = (candidate as { toArray?: () => unknown }).toArray;
    if (typeof toArray === 'function') {
      const array = toArray();
      if (Array.isArray(array)) {
        return array.filter((item): item is T => item !== null && item !== undefined);
      }
    }
  }

  return [];
}

export const extractUserRelation = (value: unknown): User | null => {
  if (!value) return null;
  const record = unwrap(value);
  if (!record) return null;
  const id = record.id;
  if (typeof id !== 'string' || id.trim().length === 0) return null;
  const roleCandidate =
    typeof record.role === 'string'
      ? Object.values(UserRole).find((candidate) => candidate === record.role)
      : undefined;
  const normalisedRole = roleCandidate ?? UserRole.UNKNOWN;
  const email = typeof record.email === 'string' ? record.email : '';
  const name = typeof record.name === 'string' && record.name.trim().length > 0 ? record.name : id;
  return new User({
    id,
    name,
    role: normalisedRole,
    email,
    avatar: typeof record.avatar === 'string' ? record.avatar : '',
    picture: typeof record.picture === 'string' ? record.picture : '',
    contactInfo: typeof record.contactInfo === 'string' ? record.contactInfo : '',
    lastActive: typeof record.lastActive === 'string' ? record.lastActive : '',
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
  });
};
/**
 * Checks if a value is present (not null/undefined).
 */
export function isPresent(field: unknown): boolean {
  return typeof field !== 'function' && Boolean(field);
}
