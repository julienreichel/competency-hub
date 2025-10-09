import { describe, expect, it } from 'vitest';
import { Message, type AmplifyMessage, type MessageKind } from '../../src/models/Message';
import { UserRole } from '../../src/models/User';

describe('Message model', () => {
  const baseInit = {
    id: 'message-1',
    threadId: 'thread-1',
    senderId: 'user-1',
    body: 'Hello world',
    kind: 'Message' as MessageKind,
  };

  it('constructs with required fields', () => {
    const message = new Message(baseInit);

    expect(message.threadId).toBe('thread-1');
    expect(message.senderId).toBe('user-1');
    expect(message.body).toBe('Hello world');
    expect(message.kind).toBe('Message');
  });

  it('validates mandatory fields', () => {
    expect(() => new Message({ ...baseInit, threadId: '' })).toThrow(
      'Message threadId is required',
    );
    expect(() => new Message({ ...baseInit, senderId: '' })).toThrow(
      'Message senderId is required',
    );
    expect(() => new Message({ ...baseInit, body: '' })).toThrow('Message body is required');
  });

  it('creates from Amplify payload with sender relation', () => {
    const raw = {
      id: 'message-1',
      threadId: 'thread-1',
      senderId: 'user-1',
      body: 'Hello world',
      kind: 'Message',
      createdAt: '2024-01-01T00:00:00.000Z',
      sender: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Sender',
        role: UserRole.EDUCATOR,
      },
    } as unknown as AmplifyMessage;

    const message = Message.fromAmplify(raw);

    expect(message.senderId).toBe('user-1');
    expect(message.sender?.name).toBe('Sender');
    expect(message.createdAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('defaults to generic kind when unknown kind provided', () => {
    const message = new Message({ ...baseInit, kind: 'Unknown' });
    expect(message.kind).toBe('Message');
  });

  it('clones message', () => {
    const original = new Message(baseInit);
    const cloned = original.clone();

    expect(cloned).not.toBe(original);
    expect(cloned.threadId).toBe(original.threadId);
  });

  it('serialises to JSON', () => {
    const message = new Message(baseInit);
    const json = message.toJSON();

    expect(json).toMatchObject({
      id: 'message-1',
      threadId: 'thread-1',
      senderId: 'user-1',
      body: 'Hello world',
      kind: 'Message',
    });
  });
});
