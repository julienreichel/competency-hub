import { describe, expect, it } from 'vitest';
import { Message, type AmplifyMessage, type MessageKind } from '../../src/models/Message';
import { MessageTarget, type AmplifyMessageTarget } from '../../src/models/MessageTarget';
import { User, UserRole } from '../../src/models/User';

describe('Message model', () => {
  const baseInit = {
    id: 'message-1',
    senderId: 'user-1',
    title: 'Welcome!',
    kind: 'Message' as MessageKind,
  };

  it('constructs with defaults for optional fields', () => {
    const message = new Message(baseInit);

    expect(message.body).toBeNull();
    expect(message.parentId).toBeNull();
    expect(message.subCompetencyId).toBeNull();
    expect(message.projectId).toBeNull();
    expect(message.targets).toHaveLength(0);
    expect(message.replies).toHaveLength(0);
  });

  it('hydrates sender, targets, and replies', () => {
    const sender = new User({
      id: 'user-1',
      name: 'Avery',
      email: 'avery@example.com',
      role: UserRole.EDUCATOR,
    });

    const target = new MessageTarget({
      id: 'target-1',
      messageId: 'message-1',
      userId: 'user-2',
    });

    const reply = new Message({
      id: 'message-2',
      senderId: 'user-2',
      title: 'Re: Welcome',
      kind: 'Message',
      parentId: 'message-1',
    });

    const message = new Message({
      ...baseInit,
      sender,
      targets: [target],
      replies: [reply],
      body: 'Great to have you here.',
    });

    expect(message.sender?.name).toBe('Avery');
    expect(message.targets).toHaveLength(1);
    expect(message.targets[0]).not.toBe(target); // defensive copy
    expect(message.replies[0]?.parentId).toBe('message-1');
    expect(message.body).toBe('Great to have you here.');
  });

  it('validates required fields', () => {
    expect(() => new Message({ ...baseInit, title: '' })).toThrow('Message title is required');
    expect(() => new Message({ ...baseInit, senderId: '' })).toThrow(
      'Message senderId is required',
    );
  });

  it('creates from Amplify payload with relations', () => {
    const targetRaw = {
      id: 'target-1',
      messageId: 'message-1',
      userId: 'user-2',
      read: false,
      archived: false,
      user: {
        id: 'user-2',
        name: 'Jordan',
        email: 'jordan@example.com',
        owner: 'user-2',
        role: 'Student',
      },
    } as unknown as AmplifyMessageTarget;

    const replyRaw = {
      id: 'message-2',
      senderId: 'user-2',
      title: 'Re: Welcome!',
      kind: 'Message',
      parentId: 'message-1',
      subCompetencyId: null,
      projectId: null,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T01:00:00.000Z',
    } as unknown as AmplifyMessage;

    const raw = {
      id: 'message-1',
      senderId: 'user-1',
      title: 'Welcome!',
      body: 'Glad to have you.',
      kind: 'Message',
      parentId: null,
      subCompetencyId: 'sub-1',
      projectId: 'proj-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T01:00:00.000Z',
      sender: {
        id: 'user-1',
        name: 'Avery',
        role: 'Educator',
        email: 'avery@example.com',
        owner: 'user-1',
      },
      targets: [targetRaw],
      replies: [replyRaw],
    } as unknown as AmplifyMessage;

    const message = Message.fromAmplify(raw);

    expect(message.targets).toHaveLength(1);
    expect(message.replies).toHaveLength(1);
    expect(message.sender?.name).toBe('Avery');
    expect(message.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(message.replies[0]?.parentId).toBe('message-1');
  });

  it('defaults to generic kind when Amplify payload contains unknown value', () => {
    const raw = {
      ...baseInit,
      kind: 'UnknownKind',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    } as unknown as AmplifyMessage;

    const message = Message.fromAmplify(raw);
    expect(message.kind).toBe('Message');
  });

  it('reports whether message is a root node', () => {
    const root = new Message(baseInit);
    const child = new Message({ ...baseInit, id: 'message-2', parentId: 'message-1' });

    expect(root.isRoot()).toBe(true);
    expect(child.isRoot()).toBe(false);
  });

  it('clones deeply', () => {
    const message = new Message({
      ...baseInit,
      sender: {
        id: 'user-1',
        name: 'Avery',
        email: 'avery@example.com',
        role: UserRole.ADMIN,
      },
      targets: [
        {
          id: 'target-1',
          messageId: 'message-1',
          userId: 'user-2',
        },
      ],
    });

    const clone = message.clone();

    expect(clone).not.toBe(message);
    expect(clone.targets[0]).not.toBe(message.targets[0]);
    expect(clone.sender).not.toBe(message.sender);
  });

  it('creates a new instance with updated replies', () => {
    const message = new Message(baseInit);
    const reply = new Message({
      id: 'message-2',
      senderId: 'user-2',
      title: 'Reply',
      kind: 'Message',
      parentId: 'message-1',
    });

    const threaded = message.withReplies([reply]);

    expect(threaded.replies).toHaveLength(1);
    expect(threaded).not.toBe(message);
    expect(message.replies).toHaveLength(0);
  });

  it('serialises to JSON with relations', () => {
    const message = new Message({
      ...baseInit,
      body: 'Content',
      targets: [
        {
          id: 'target-1',
          messageId: 'message-1',
          userId: 'user-2',
        },
      ],
    });

    const json = message.toJSON();

    expect(json).toMatchObject({
      id: 'message-1',
      senderId: 'user-1',
      title: 'Welcome!',
      body: 'Content',
      kind: 'Message',
      targets: [
        expect.objectContaining({
          id: 'target-1',
          messageId: 'message-1',
        }),
      ],
    });
  });
});
