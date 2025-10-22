import { graphQLClient } from '../base/GraphQLClient';
import { Message, type MessageKind } from '../Message';
import { MessageThread } from '../MessageThread';
import { ThreadParticipant } from '../ThreadParticipant';
import { mapArrayRelation } from '../utils';

export interface CreateThreadInput {
  name: string;
  createdById: string;
  participantIds: string[];
}

export interface SendMessageInput {
  threadId: string;
  senderId: string;
  body: string;
  kind?: MessageKind;
}

export interface ThreadWithParticipant {
  thread: MessageThread;
  participant: ThreadParticipant;
}

export class MessageRepository {
  async createThread(input: CreateThreadInput): Promise<MessageThread> {
    const uniqueParticipants = Array.from(new Set([input.createdById, ...input.participantIds]));

    const rawThread = await graphQLClient.createMessageThread({
      name: input.name,
      createdById: input.createdById,
    });

    if (!rawThread) {
      throw new Error('Failed to create message thread');
    }

    const thread = MessageThread.fromAmplify(rawThread);

    const participants = await Promise.all(
      uniqueParticipants.map((userId) =>
        graphQLClient.createThreadParticipant({
          threadId: thread.id,
          userId,
        }),
      ),
    );
    thread.participants = mapArrayRelation(participants, ThreadParticipant.fromAmplify);

    return thread;
  }

  async listThreadsForUser(userId: string): Promise<ThreadWithParticipant[]> {
    const participants = await graphQLClient.getUserMessageThreads(userId);

    const enriched = participants.map((raw) => {
      const participant = ThreadParticipant.fromAmplify(raw);
      const thread = participant.thread;
      return thread ? { participant, thread } : null;
    });
    return enriched
      .filter((record): record is ThreadWithParticipant => Boolean(record))
      .sort((a, b) => {
        const left = a.thread.lastMessageAt ?? a.thread.updatedAt ?? a.thread.createdAt ?? '';
        const right = b.thread.lastMessageAt ?? b.thread.updatedAt ?? b.thread.createdAt ?? '';
        return right.localeCompare(left);
      });
  }

  async getThreadById(id: string): Promise<MessageThread | null> {
    const raw = await graphQLClient.getMessageThread(id);
    return raw ? MessageThread.fromAmplify(raw) : null;
  }

  async setParticipantArchived(threadId: string, userId: string, archived: boolean): Promise<void> {
    const thread = await this.getThreadById(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    const participant = thread.participants.find((entry) => entry.userId === userId);
    if (!participant) {
      throw new Error(`Participant ${userId} not found in thread ${threadId}`);
    }

    await graphQLClient.updateThreadParticipant({ id: participant.id, archived });
  }

  async sendMessage(input: SendMessageInput): Promise<Message> {
    const raw = await graphQLClient.createMessage({
      threadId: input.threadId,
      senderId: input.senderId,
      body: input.body,
      kind: input.kind ?? 'Message',
    });

    if (!raw) {
      throw new Error('Failed to create message');
    }

    const message = Message.fromAmplify(raw);

    await graphQLClient.updateMessageThread({
      id: input.threadId,
      lastMessageAt: message.createdAt ?? new Date().toISOString(),
    });

    return message;
  }

  async markThreadAsRead(threadId: string, userId: string, timestamp?: string): Promise<void> {
    const thread = await this.getThreadById(threadId);

    const participant = thread?.participants?.find((p) => p.userId === userId);

    const lastReadAt = timestamp ?? new Date().toISOString();

    if (participant) {
      await graphQLClient.updateThreadParticipant({ id: participant.id, lastReadAt });
      return;
    }

    await graphQLClient.createThreadParticipant({
      threadId,
      userId,
      lastReadAt,
    });
  }

  async ensureParticipants(threadId: string, participantIds: string[]): Promise<void> {
    if (!participantIds.length) return;

    const thread = await this.getThreadById(threadId);

    const existing = thread?.participants ?? [];
    const existingIds = new Set(existing.map((item) => item.userId));
    const newIds = participantIds.filter((id) => !existingIds.has(id));
    await Promise.all(
      newIds.map((userId) =>
        graphQLClient.createThreadParticipant({
          threadId,
          userId,
        }),
      ),
    );
  }
}

export const messageRepository = new MessageRepository();
