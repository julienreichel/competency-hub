import { beforeEach, describe, expect, it, vi } from 'vitest';
import { graphQLClient } from '../../src/models/base/GraphQLClient';
import { MessageTarget } from '../../src/models/MessageTarget';
import { MessageTargetRepository } from '../../src/models/repositories/MessageTargetRepository';

const mockGraphQLClient = graphQLClient as unknown as {
  createMessageTarget: ReturnType<typeof vi.fn>;
  getMessageTarget: ReturnType<typeof vi.fn>;
  listMessageTargets: ReturnType<typeof vi.fn>;
  getUserReceivedMessages: ReturnType<typeof vi.fn>;
  updateMessageTarget: ReturnType<typeof vi.fn>;
  deleteMessageTarget: ReturnType<typeof vi.fn>;
};

vi.mock('../../src/models/base/GraphQLClient', () => ({
  graphQLClient: {
    createMessageTarget: vi.fn(),
    getMessageTarget: vi.fn(),
    listMessageTargets: vi.fn(),
    getUserReceivedMessages: vi.fn(),
    updateMessageTarget: vi.fn(),
    deleteMessageTarget: vi.fn(),
  },
}));

const rawTarget = {
  id: 'target-1',
  messageId: 'message-1',
  userId: 'user-2',
  read: false,
  readDate: null,
  archived: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('MessageTargetRepository', () => {
  let repository: MessageTargetRepository;

  beforeEach(() => {
    repository = new MessageTargetRepository();
    vi.clearAllMocks();
  });

  it('creates a message target and returns model instance', async () => {
    mockGraphQLClient.createMessageTarget.mockResolvedValue(rawTarget);

    const result = await repository.create({
      messageId: 'message-1',
      userId: 'user-2',
    });

    expect(mockGraphQLClient.createMessageTarget).toHaveBeenCalledWith({
      messageId: 'message-1',
      userId: 'user-2',
    });
    expect(result).toBeInstanceOf(MessageTarget);
  });

  it('throws when creation returns null', async () => {
    mockGraphQLClient.createMessageTarget.mockResolvedValue(null);

    await expect(
      repository.create({
        messageId: 'message-1',
        userId: 'user-2',
      }),
    ).rejects.toThrow('Failed to create message target');
  });

  it('finds a message target by id', async () => {
    mockGraphQLClient.getMessageTarget.mockResolvedValue(rawTarget);

    const result = await repository.findById('target-1');

    expect(mockGraphQLClient.getMessageTarget).toHaveBeenCalledWith('target-1');
    expect(result).toBeInstanceOf(MessageTarget);
  });

  it('returns null when target does not exist', async () => {
    mockGraphQLClient.getMessageTarget.mockResolvedValue(null);

    const result = await repository.findById('missing');

    expect(result).toBeNull();
  });

  it('lists message targets with optional filter', async () => {
    mockGraphQLClient.listMessageTargets.mockResolvedValue([rawTarget]);

    const result = await repository.findAll({ userId: { eq: 'user-2' } });

    expect(mockGraphQLClient.listMessageTargets).toHaveBeenCalledWith({
      userId: { eq: 'user-2' },
    });
    expect(result[0]).toBeInstanceOf(MessageTarget);
  });

  it('retrieves message targets for a user', async () => {
    mockGraphQLClient.getUserReceivedMessages.mockResolvedValue([rawTarget]);

    const result = await repository.findAllForUser('user-2');

    expect(mockGraphQLClient.getUserReceivedMessages).toHaveBeenCalledWith('user-2');
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(MessageTarget);
  });

  it('updates a message target and returns model', async () => {
    mockGraphQLClient.updateMessageTarget.mockResolvedValue({
      ...rawTarget,
      read: true,
    });

    const result = await repository.update('target-1', { read: true });

    expect(mockGraphQLClient.updateMessageTarget).toHaveBeenCalledWith({
      id: 'target-1',
      read: true,
    });
    expect(result.read).toBe(true);
  });

  it('throws when update returns null', async () => {
    mockGraphQLClient.updateMessageTarget.mockResolvedValue(null);

    await expect(repository.update('target-1', { read: true })).rejects.toThrow(
      'Failed to update message target target-1',
    );
  });

  it('deletes a message target and returns model', async () => {
    mockGraphQLClient.deleteMessageTarget.mockResolvedValue(rawTarget);

    const result = await repository.delete('target-1');

    expect(mockGraphQLClient.deleteMessageTarget).toHaveBeenCalledWith('target-1');
    expect(result).toBeInstanceOf(MessageTarget);
  });

  it('throws when delete returns null', async () => {
    mockGraphQLClient.deleteMessageTarget.mockResolvedValue(null);

    await expect(repository.delete('target-1')).rejects.toThrow(
      'Failed to delete message target target-1',
    );
  });
});
