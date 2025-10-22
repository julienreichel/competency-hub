import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Schema } from '../../amplify/data/resource';
import { graphQLClient } from '../../src/models/base/GraphQLClient';
import { MessageRepository } from '../../src/models/repositories/MessageRepository';

const mockGraphQLClient = graphQLClient as unknown as {
  createMessageThread: ReturnType<typeof vi.fn>;
  updateMessageThread: ReturnType<typeof vi.fn>;
  getUserMessageThreads: ReturnType<typeof vi.fn>;
  getMessageThread: ReturnType<typeof vi.fn>;
  listMessageThreads: ReturnType<typeof vi.fn>;
  createThreadParticipant: ReturnType<typeof vi.fn>;
  updateThreadParticipant: ReturnType<typeof vi.fn>;
  deleteThreadParticipant: ReturnType<typeof vi.fn>;
  listThreadParticipants: ReturnType<typeof vi.fn>;
  createMessage: ReturnType<typeof vi.fn>;
  setParticipantArchived?: ReturnType<typeof vi.fn>;
};

vi.mock('../../src/models/base/GraphQLClient', () => ({
  graphQLClient: {
    createMessageThread: vi.fn(),
    updateMessageThread: vi.fn(),
    getUserMessageThreads: vi.fn(),
    getMessageThread: vi.fn(),
    listMessageThreads: vi.fn(),
    createThreadParticipant: vi.fn(),
    updateThreadParticipant: vi.fn(),
    deleteThreadParticipant: vi.fn(),
    listThreadParticipants: vi.fn(),
    createMessage: vi.fn(),
  },
}));

const rawThread = {
  id: 'thread-1',
  name: 'General',
  createdById: 'user-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  lastMessageAt: '2024-01-01T00:00:00.000Z',
  participants: [],
  messages: [],
};

describe('MessageRepository (threads)', () => {
  let repository: MessageRepository;

  beforeEach(() => {
    repository = new MessageRepository();
    vi.clearAllMocks();

    mockGraphQLClient.createMessageThread.mockResolvedValue(rawThread);
    mockGraphQLClient.getMessageThread.mockResolvedValue(rawThread);
    mockGraphQLClient.updateMessageThread.mockResolvedValue(rawThread);
    mockGraphQLClient.listThreadParticipants.mockResolvedValue([]);
    mockGraphQLClient.createThreadParticipant.mockResolvedValue({
      id: 'tp-1',
      threadId: 'thread-1',
      userId: 'user-1',
      lastReadAt: null,
      archived: false,
    } as Schema['ThreadParticipant']['type']);
    mockGraphQLClient.createMessage.mockResolvedValue({
      id: 'message-1',
      threadId: 'thread-1',
      senderId: 'user-1',
      body: 'Hello',
      kind: 'Message',
      createdAt: '2024-01-01T00:00:00.000Z',
    } as Schema['Message']['type']);
  });

  it('creates threads and participants', async () => {
    const result = await repository.createThread({
      name: 'General',
      createdById: 'user-1',
      participantIds: ['user-2', 'user-3'],
    });

    expect(mockGraphQLClient.createMessageThread).toHaveBeenCalledWith({
      name: 'General',
      createdById: 'user-1',
    });
    expect(mockGraphQLClient.createThreadParticipant).toHaveBeenCalledTimes(3);
    expect(result.id).toBe('thread-1');
  });

  it('lists threads for user', async () => {
    mockGraphQLClient.getUserMessageThreads.mockResolvedValue([
      {
        id: 'tp-1',
        threadId: 'thread-1',
        userId: 'user-2',
        lastReadAt: null,
        archived: false,
        thread: {
          ...rawThread,
          lastMessageAt: '2024-01-02T00:00:00.000Z',
          messages: [],
          participants: [],
        },
      } as unknown as Schema['ThreadParticipant']['type'],
    ]);

    const result = await repository.listThreadsForUser('user-2');
    expect(mockGraphQLClient.getUserMessageThreads).toHaveBeenCalledWith('user-2');
    expect(result).toHaveLength(1);
    expect(result[0]?.thread?.id).toBe('thread-1');
  });

  it('sends messages and updates last activity', async () => {
    await repository.sendMessage({
      threadId: 'thread-1',
      senderId: 'user-1',
      body: 'Hello world',
    });

    expect(mockGraphQLClient.createMessage).toHaveBeenCalledWith({
      threadId: 'thread-1',
      senderId: 'user-1',
      body: 'Hello world',
      kind: 'Message',
    });
    expect(mockGraphQLClient.updateMessageThread).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'thread-1', lastMessageAt: expect.any(String) }),
    );
  });

  it('marks thread as read when participant exists', async () => {
    mockGraphQLClient.getMessageThread.mockResolvedValueOnce({
      ...rawThread,
      participants: [
        {
          id: 'tp-1',
          threadId: 'thread-1',
          userId: 'user-2',
          lastReadAt: null,
          archived: false,
        } as Schema['ThreadParticipant']['type'],
      ],
    });

    await repository.markThreadAsRead('thread-1', 'user-2', '2024-01-03T00:00:00.000Z');

    expect(mockGraphQLClient.updateThreadParticipant).toHaveBeenCalledWith({
      id: 'tp-1',
      lastReadAt: '2024-01-03T00:00:00.000Z',
    });
  });

  it('creates participant when marking thread read and record missing', async () => {
    await repository.markThreadAsRead('thread-1', 'user-2');

    expect(mockGraphQLClient.createThreadParticipant).toHaveBeenCalledWith(
      expect.objectContaining({ threadId: 'thread-1', userId: 'user-2' }),
    );
  });

  it('ensures participants are added only when missing', async () => {
    mockGraphQLClient.getMessageThread.mockResolvedValueOnce({
      ...rawThread,
      participants: [
        {
          id: 'tp-existing',
          threadId: 'thread-1',
          userId: 'user-2',
          lastReadAt: null,
          archived: false,
        } as Schema['ThreadParticipant']['type'],
      ],
    });

    await repository.ensureParticipants('thread-1', ['user-2', 'user-3']);

    expect(mockGraphQLClient.createThreadParticipant).toHaveBeenCalledTimes(1);
    expect(mockGraphQLClient.createThreadParticipant).toHaveBeenCalledWith({
      threadId: 'thread-1',
      userId: 'user-3',
    });
  });

  it('archives participant thread view', async () => {
    mockGraphQLClient.getMessageThread.mockResolvedValueOnce({
      ...rawThread,
      participants: [
        {
          id: 'tp-1',
          threadId: 'thread-1',
          userId: 'user-1',
          lastReadAt: null,
          archived: false,
        } as Schema['ThreadParticipant']['type'],
      ],
    });

    await repository.setParticipantArchived('thread-1', 'user-1', true);

    expect(mockGraphQLClient.updateThreadParticipant).toHaveBeenCalledWith({
      id: 'tp-1',
      archived: true,
    });
  });
});
