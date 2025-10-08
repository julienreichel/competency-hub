import { describe, expect, it } from 'vitest';
import { MessageTarget, type AmplifyMessageTarget } from '../../src/models/MessageTarget';
import { UserRole } from '../../src/models/User';

describe('MessageTarget model', () => {
  const baseInit = {
    id: 'target-1',
    messageId: 'message-1',
    userId: 'user-2',
  };

  it('constructs with sensible defaults', () => {
    const target = new MessageTarget(baseInit);

    expect(target.read).toBe(false);
    expect(target.readDate).toBeNull();
    expect(target.archived).toBe(false);
    expect(target.user).toBeNull();
  });

  it('hydrates related user when provided', () => {
    const target = new MessageTarget({
      ...baseInit,
      read: true,
      readDate: '2024-01-01T00:00:00.000Z',
      archived: true,
      user: {
        id: 'user-2',
        name: 'Jamie',
        email: 'jamie@example.com',
        role: UserRole.STUDENT,
      },
    });

    expect(target.user).not.toBeNull();
    expect(target.user?.name).toBe('Jamie');
    expect(target.read).toBe(true);
    expect(target.archived).toBe(true);
  });

  it('validates required identifiers', () => {
    expect(() => new MessageTarget({ ...baseInit, messageId: '' })).toThrow(
      'Message target messageId is required',
    );
    expect(() => new MessageTarget({ ...baseInit, userId: '' })).toThrow(
      'Message target userId is required',
    );
  });

  it('creates an instance from Amplify payload', () => {
    const raw = {
      id: 'target-1',
      messageId: 'message-1',
      userId: 'user-2',
      read: true,
      readDate: '2024-01-02T10:00:00.000Z',
      archived: false,
      user: {
        id: 'user-2',
        name: 'Jamie',
        role: 'Student',
        email: 'jamie@example.com',
        owner: 'user-2',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    } as unknown as AmplifyMessageTarget;

    const target = MessageTarget.fromAmplify(raw);

    expect(target.read).toBe(true);
    expect(target.readDate).toBe('2024-01-02T10:00:00.000Z');
    expect(target.user?.email).toBe('jamie@example.com');
    expect(target.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(target.updatedAt).toBe('2024-01-02T00:00:00.000Z');
  });

  it('marks the target as read', () => {
    const target = new MessageTarget(baseInit);
    const marked = target.markAsRead('2024-01-03T12:00:00.000Z');

    expect(marked.read).toBe(true);
    expect(marked.readDate).toBe('2024-01-03T12:00:00.000Z');
    expect(marked.archived).toBe(false);
    expect(target.read).toBe(false); // immutable
  });

  it('updates mutable flags immutably', () => {
    const original = new MessageTarget(baseInit);
    const updated = original.update({ archived: true, read: true });

    expect(updated.archived).toBe(true);
    expect(updated.read).toBe(true);
    expect(original.archived).toBe(false);
  });

  it('clones with deep copies', () => {
    const target = new MessageTarget({
      ...baseInit,
      user: {
        id: 'user-2',
        name: 'Jamie',
        email: 'jamie@example.com',
        role: UserRole.STUDENT,
      },
    });

    const clone = target.clone();

    expect(clone).not.toBe(target);
    expect(clone.user).not.toBe(target.user);
    expect(clone.user?.id).toBe(target.user?.id);
  });
});
