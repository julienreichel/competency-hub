import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageTarget } from '../../src/models/MessageTarget';
import { graphQLClient } from '../../src/models/base/GraphQLClient';
import { Message } from '../../src/models/Message';
import { MessageRepository } from '../../src/models/repositories/MessageRepository';
import type { MessageTargetRepository as MessageTargetRepositoryType } from '../../src/models/repositories/MessageTargetRepository';

const mockGraphQLClient = graphQLClient as unknown as {
  createMessage: ReturnType<typeof vi.fn>;
  getMessage: ReturnType<typeof vi.fn>;
  getMessageWithReplies: ReturnType<typeof vi.fn>;
  listMessages: ReturnType<typeof vi.fn>;
  updateMessage: ReturnType<typeof vi.fn>;
  deleteMessage: ReturnType<typeof vi.fn>;
};

vi.mock('../../src/models/base/GraphQLClient', () => ({
  graphQLClient: {
    createMessage: vi.fn(),
    getMessage: vi.fn(),
    getMessageWithReplies: vi.fn(),
    listMessages: vi.fn(),
    updateMessage: vi.fn(),
    deleteMessage: vi.fn(),
  },
}));

const rawMessage = {
  id: 'message-1',
  senderId: 'user-1',
  title: 'Hello',
  body: 'Welcome aboard',
  kind: 'Message',
  parentId: null,
  subCompetencyId: null,
  projectId: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('MessageRepository', () => {
  let repository: MessageRepository;
  let targetsMock: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findAllForUser: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repository = new MessageRepository();
    vi.clearAllMocks();

    targetsMock = {
      create: vi.fn(),
      findAll: vi.fn(),
      findAllForUser: vi.fn(),
      update: vi.fn(),
    };
    repository.targets = targetsMock as unknown as MessageTargetRepositoryType;

    targetsMock.create.mockResolvedValue(
      new MessageTarget({
        id: 'target-1',
        messageId: 'message-1',
        userId: 'user-2',
      }),
    );
    targetsMock.findAll.mockResolvedValue([]);
    targetsMock.findAllForUser.mockResolvedValue([]);
    targetsMock.update.mockResolvedValue(
      new MessageTarget({
        id: 'target-1',
        messageId: 'message-1',
        userId: 'user-2',
      }),
    );
  });

  it('creates a message and returns model instance', async () => {
    mockGraphQLClient.createMessage.mockResolvedValue(rawMessage);

    const result = await repository.create({
      senderId: 'user-1',
      title: 'Hello',
      kind: 'Message',
      body: 'Welcome aboard',
    });

    expect(mockGraphQLClient.createMessage).toHaveBeenCalledWith({
      senderId: 'user-1',
      title: 'Hello',
      kind: 'Message',
      body: 'Welcome aboard',
    });
    expect(result).toBeInstanceOf(Message);
    expect(result.title).toBe('Hello');
  });

  it('throws when creation returns null', async () => {
    mockGraphQLClient.createMessage.mockResolvedValue(null);

    await expect(
      repository.create({
        senderId: 'user-1',
        title: 'Hello',
        kind: 'Message',
      }),
    ).rejects.toThrow('Failed to create message');
  });

  it('finds a message by id using basic query', async () => {
    mockGraphQLClient.getMessage.mockResolvedValue(rawMessage);

    const result = await repository.findById('message-1');

    expect(mockGraphQLClient.getMessage).toHaveBeenCalledWith('message-1');
    expect(result).toBeInstanceOf(Message);
  });

  it('finds a message by id including replies', async () => {
    mockGraphQLClient.getMessageWithReplies.mockResolvedValue(rawMessage);

    await repository.findById('message-1', { includeReplies: true });

    expect(mockGraphQLClient.getMessageWithReplies).toHaveBeenCalledWith('message-1');
    expect(mockGraphQLClient.getMessage).not.toHaveBeenCalled();
  });

  it('returns null when message does not exist', async () => {
    mockGraphQLClient.getMessage.mockResolvedValue(null);

    const result = await repository.findById('missing');

    expect(result).toBeNull();
  });

  it('lists messages using provided filter', async () => {
    mockGraphQLClient.listMessages.mockResolvedValue([rawMessage]);

    const result = await repository.findAll({ senderId: { eq: 'user-1' } });

    expect(mockGraphQLClient.listMessages).toHaveBeenCalledWith({ senderId: { eq: 'user-1' } });
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Message);
  });

  it('updates a message and returns model', async () => {
    mockGraphQLClient.updateMessage.mockResolvedValue({
      ...rawMessage,
      title: 'Updated',
    });

    const result = await repository.update('message-1', { title: 'Updated' });

    expect(mockGraphQLClient.updateMessage).toHaveBeenCalledWith({
      id: 'message-1',
      title: 'Updated',
    });
    expect(result.title).toBe('Updated');
  });

  it('throws when update returns null', async () => {
    mockGraphQLClient.updateMessage.mockResolvedValue(null);

    await expect(repository.update('message-1', { title: 'Updated' })).rejects.toThrow(
      'Failed to update message message-1',
    );
  });

  it('deletes a message and returns model', async () => {
    mockGraphQLClient.deleteMessage.mockResolvedValue(rawMessage);

    const result = await repository.delete('message-1');

    expect(mockGraphQLClient.deleteMessage).toHaveBeenCalledWith('message-1');
    expect(result).toBeInstanceOf(Message);
  });

  it('throws when delete returns null', async () => {
    mockGraphQLClient.deleteMessage.mockResolvedValue(null);

    await expect(repository.delete('message-1')).rejects.toThrow(
      'Failed to delete message message-1',
    );
  });

  it('sends a message and creates targets', async () => {
    mockGraphQLClient.createMessage.mockResolvedValue(rawMessage);

    const result = await repository.sendMessage({
      senderId: 'user-1',
      title: 'Hello',
      kind: 'Message',
      body: 'Welcome aboard',
      targetUserIds: ['user-2', 'user-3'],
    });

    expect(mockGraphQLClient.createMessage).toHaveBeenCalledWith({
      senderId: 'user-1',
      title: 'Hello',
      kind: 'Message',
      body: 'Welcome aboard',
    });
    expect(targetsMock.create).toHaveBeenCalledTimes(2);
    expect(targetsMock.create).toHaveBeenNthCalledWith(1, {
      messageId: 'message-1',
      userId: 'user-2',
    });
    expect(targetsMock.create).toHaveBeenNthCalledWith(2, {
      messageId: 'message-1',
      userId: 'user-3',
    });
    expect(result).toBeInstanceOf(Message);
  });

  it('does not create targets when sending message without recipients', async () => {
    mockGraphQLClient.createMessage.mockResolvedValue(rawMessage);

    await repository.sendMessage({
      senderId: 'user-1',
      title: 'Hello',
      kind: 'Message',
      targetUserIds: [],
    });

    expect(targetsMock.create).not.toHaveBeenCalled();
  });

  it('replies to a message with parent reference', async () => {
    mockGraphQLClient.createMessage.mockResolvedValue(rawMessage);

    await repository.replyToMessage('parent-1', {
      senderId: 'user-1',
      title: 'Re: Hello',
      kind: 'Message',
      targetUserIds: [],
    });

    expect(mockGraphQLClient.createMessage).toHaveBeenCalledWith({
      senderId: 'user-1',
      title: 'Re: Hello',
      kind: 'Message',
      parentId: 'parent-1',
    });
  });

  it('lists targets for a user excluding archived by default', async () => {
    await repository.listTargetsForUser('user-2');

    expect(targetsMock.findAll).toHaveBeenCalledWith({
      userId: { eq: 'user-2' },
      archived: { eq: false },
    });
  });

  it('includes archived targets when requested', async () => {
    await repository.listTargetsForUser('user-2', { includeArchived: true });

    expect(targetsMock.findAll).toHaveBeenCalledWith({
      userId: { eq: 'user-2' },
    });
  });

  it('lists inbox entries mapped to messages', async () => {
    const targetVisible = new MessageTarget({
      id: 'target-1',
      messageId: 'message-1',
      userId: 'user-2',
      archived: false,
      message: {
        id: 'message-1',
        senderId: 'user-1',
        title: 'Hello',
        kind: 'Message',
      },
    });
    const targetArchived = new MessageTarget({
      id: 'target-2',
      messageId: 'message-2',
      userId: 'user-2',
      archived: true,
      message: {
        id: 'message-2',
        senderId: 'user-3',
        title: 'Update',
        kind: 'Message',
      },
    });
    targetsMock.findAllForUser.mockResolvedValue([targetVisible, targetArchived]);

    const result = await repository.listInbox('user-2');

    expect(result).toEqual([{ target: targetVisible, message: targetVisible.message }]);
  });

  it('includes archived inbox entries when requested', async () => {
    const targetArchived = new MessageTarget({
      id: 'target-2',
      messageId: 'message-2',
      userId: 'user-2',
      archived: true,
      message: {
        id: 'message-2',
        senderId: 'user-3',
        title: 'Update',
        kind: 'Message',
      },
    });
    targetsMock.findAllForUser.mockResolvedValue([targetArchived]);

    const result = await repository.listInbox('user-2', { includeArchived: true });

    expect(result).toEqual([{ target: targetArchived, message: targetArchived.message }]);
  });

  it('returns empty inbox when no targets found', async () => {
    targetsMock.findAllForUser.mockResolvedValue([]);

    const result = await repository.listInbox('user-2');

    expect(result).toEqual([]);
  });

  it('marks target as read', async () => {
    await repository.markTargetAsRead('target-1', '2024-01-01T00:00:00.000Z');

    expect(targetsMock.update).toHaveBeenCalledWith('target-1', {
      read: true,
      readDate: '2024-01-01T00:00:00.000Z',
    });
  });

  it('marks target as unread', async () => {
    await repository.markTargetAsUnread('target-1');

    expect(targetsMock.update).toHaveBeenCalledWith('target-1', {
      read: false,
      readDate: null,
    });
  });

  it('archives target', async () => {
    await repository.archiveTarget('target-1');

    expect(targetsMock.update).toHaveBeenCalledWith('target-1', { archived: true });
  });

  it('unarchives target', async () => {
    await repository.unarchiveTarget('target-1');

    expect(targetsMock.update).toHaveBeenCalledWith('target-1', { archived: false });
  });
});
