import type { MessageTarget } from 'src/models/MessageTarget';
import {
  messageTargetRepository,
  type MessageTargetFilter,
  type MessageTargetRepository,
} from 'src/models/repositories/MessageTargetRepository';
import { graphQLClient } from '../base/GraphQLClient';
import { Message, type MessageKind } from '../Message';

export interface CreateMessageInput {
  senderId: string;
  title: string;
  kind: MessageKind;
  body?: string | null;
  parentId?: string | null;
  subCompetencyId?: string | null;
  projectId?: string | null;
}

export type UpdateMessageInput = Partial<
  Omit<CreateMessageInput, 'senderId'> & {
    senderId?: never;
  }
>;

export interface SendMessageInput extends CreateMessageInput {
  targetUserIds: string[];
}

export type MessageFilter = Record<string, unknown>;

export interface InboxThread {
  root: Message;
  target: MessageTarget;
}

export class MessageRepository {
  targets: MessageTargetRepository = messageTargetRepository;

  async sendMessage(input: SendMessageInput): Promise<Message> {
    const { targetUserIds, ...messageData } = input;
    const message = await this.create(messageData);

    if (targetUserIds.length > 0) {
      await Promise.all(
        targetUserIds.map((userId) =>
          this.targets.create({
            messageId: message.id,
            userId,
          }),
        ),
      );
    }
    return message;
  }

  async replyToMessage(parentId: string, input: SendMessageInput): Promise<Message> {
    return this.sendMessage({
      ...input,
      parentId,
    });
  }
  async listTargetsForUser(
    userId: string,
    options: { includeArchived?: boolean } = {},
  ): Promise<MessageTarget[]> {
    const filter: MessageTargetFilter = {
      userId: { eq: userId },
    };

    if (!options.includeArchived) {
      filter.archived = { eq: false };
    }

    return this.targets.findAll(filter);
  }

  async listInbox(
    userId: string,
    options: { includeArchived?: boolean } = {},
  ): Promise<InboxThread[]> {
    const targets = await this.targets.findAllForUser(userId);
    if (targets.length === 0) {
      return [];
    }
    return targets
      .filter((t) => options.includeArchived || !t.archived)
      .filter((t) => Boolean(t.message))
      .map((t) => ({
        target: t,
        root: t.message as Message,
      }));
  }

  async create(data: CreateMessageInput): Promise<Message> {
    const payload = { ...data };
    if (!payload.parentId) delete payload.parentId;
    if (!payload.projectId) delete payload.projectId;
    if (!payload.subCompetencyId) delete payload.subCompetencyId;

    const raw = await graphQLClient.createMessage(payload);

    if (!raw) {
      throw new Error('Failed to create message');
    }

    return Message.fromAmplify(raw);
  }

  async markTargetAsRead(
    targetId: string,
    readDate: string | null = new Date().toISOString(),
  ): Promise<MessageTarget> {
    return this.targets.update(targetId, { read: true, readDate });
  }

  async markTargetAsUnread(targetId: string): Promise<MessageTarget> {
    return this.targets.update(targetId, { read: false, readDate: null });
  }

  async archiveTarget(targetId: string): Promise<MessageTarget> {
    return this.targets.update(targetId, { archived: true });
  }

  async unarchiveTarget(targetId: string): Promise<MessageTarget> {
    return this.targets.update(targetId, { archived: false });
  }

  async setThreadArchived(
    rootMessageId: string,
    userId: string,
    archived: boolean,
  ): Promise<MessageTarget | null> {
    const target = await this.targets.findByMessageAndUser(rootMessageId, userId);
    if (!target) {
      return null;
    }
    if (archived) {
      return this.archiveTarget(target.id);
    }
    return this.unarchiveTarget(target.id);
  }

  async findById(id: string, options: { includeReplies?: boolean } = {}): Promise<Message | null> {
    const raw = options.includeReplies
      ? await graphQLClient.getMessageWithReplies(id)
      : await graphQLClient.getMessage(id);

    return raw ? Message.fromAmplify(raw) : null;
  }

  async findAll(filter?: MessageFilter): Promise<Message[]> {
    const messages = await graphQLClient.listMessages(filter);
    return messages.map((raw) => Message.fromAmplify(raw));
  }

  async update(id: string, data: UpdateMessageInput): Promise<Message> {
    const raw = await graphQLClient.updateMessage({ id, ...data });
    if (!raw) {
      throw new Error(`Failed to update message ${id}`);
    }

    return Message.fromAmplify(raw);
  }

  async delete(id: string): Promise<Message> {
    const raw = await graphQLClient.deleteMessage(id);
    if (!raw) {
      throw new Error(`Failed to delete message ${id}`);
    }

    return Message.fromAmplify(raw);
  }
}

export const messageRepository = new MessageRepository();
