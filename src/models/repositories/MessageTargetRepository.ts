import { graphQLClient } from '../base/GraphQLClient';
import { MessageTarget } from '../MessageTarget';

export interface CreateMessageTargetInput {
  messageId: string;
  userId: string;
  read?: boolean;
  readDate?: string | null;
  archived?: boolean;
}

export type UpdateMessageTargetInput = Partial<
  Omit<CreateMessageTargetInput, 'messageId' | 'userId'>
>;

export type MessageTargetFilter = Record<string, unknown>;

export class MessageTargetRepository {
  async create(data: CreateMessageTargetInput): Promise<MessageTarget> {
    const raw = await graphQLClient.createMessageTarget(data);
    if (!raw) {
      throw new Error('Failed to create message target');
    }

    return MessageTarget.fromAmplify(raw);
  }

  async findById(id: string): Promise<MessageTarget | null> {
    const raw = await graphQLClient.getMessageTarget(id);
    return raw ? MessageTarget.fromAmplify(raw) : null;
  }

  async findAll(filter?: MessageTargetFilter): Promise<MessageTarget[]> {
    const targets = await graphQLClient.listMessageTargets(filter);
    return targets.map((raw) => MessageTarget.fromAmplify(raw));
  }

  async findByMessageAndUser(messageId: string, userId: string): Promise<MessageTarget | null> {
    const [target] = await this.findAll({
      messageId: { eq: messageId },
      userId: { eq: userId },
    });
    return target ?? null;
  }

  async findAllForUser(userId: string): Promise<MessageTarget[]> {
    const targets = await graphQLClient.getUserReceivedMessages(userId);
    return targets.map((raw) => MessageTarget.fromAmplify(raw));
  }

  async update(id: string, data: UpdateMessageTargetInput): Promise<MessageTarget> {
    const raw = await graphQLClient.updateMessageTarget({ id, ...data });
    if (!raw) {
      throw new Error(`Failed to update message target ${id}`);
    }

    return MessageTarget.fromAmplify(raw);
  }

  async delete(id: string): Promise<MessageTarget> {
    const raw = await graphQLClient.deleteMessageTarget(id);
    if (!raw) {
      throw new Error(`Failed to delete message target ${id}`);
    }

    return MessageTarget.fromAmplify(raw);
  }
}

export const messageTargetRepository = new MessageTargetRepository();
