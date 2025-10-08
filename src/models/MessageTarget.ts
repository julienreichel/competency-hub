import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';
import { Message, type MessageInit } from './Message';
import { User, type UserRelationInit } from './User';
import { createObject, mapSingularRelation } from './utils';

export type AmplifyMessageTarget = NonNullable<Schema['MessageTarget']['type']>;

export interface MessageTargetInit extends Record<string, unknown> {
  id: string;
  messageId: string;
  message?: Message | MessageInit;
  userId: string;
  read?: boolean;
  readDate?: string | null;
  archived?: boolean;
  user?: UserRelationInit | User | null;
  createdAt?: string;
  updatedAt?: string;
}

export class MessageTarget extends BaseModel {
  public readonly messageId: string;
  public readonly message: Message | null;
  public readonly userId: string;
  public read: boolean;
  public readDate: string | null;
  public archived: boolean;
  public readonly user: User | null;

  constructor(data: MessageTargetInit) {
    super(data);
    this.messageId = data.messageId;
    this.message = Message.create(data.message);
    this.userId = data.userId;
    this.read = data.read ?? false;
    this.readDate = data.readDate ?? null;
    this.archived = data.archived ?? false;
    this.user = createObject(data.user, User);

    this.validate();
  }

  static fromAmplify(this: void, raw: AmplifyMessageTarget): MessageTarget {
    const user = mapSingularRelation(raw.user, User.fromAmplify);
    const message = mapSingularRelation(raw.message, Message.fromAmplify) || undefined;

    return new MessageTarget({
      id: raw.id,
      messageId: raw.messageId,
      userId: raw.userId,
      read: raw.read ?? false,
      readDate: raw.readDate ?? null,
      archived: raw.archived ?? false,
      user,
      message,
      ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
    });
  }

  validate(): void {
    if (!this.messageId?.trim()) {
      throw new Error('Message target messageId is required');
    }
    if (!this.userId?.trim()) {
      throw new Error('Message target userId is required');
    }
  }

  markAsRead(readDate: string | null = new Date().toISOString()): MessageTarget {
    return this.update({
      read: true,
      readDate,
    });
  }

  update(data: Partial<MessageTargetInit>): MessageTarget {
    return new MessageTarget({
      id: this.id,
      messageId: this.messageId,
      userId: this.userId,
      read: data.read ?? this.read,
      readDate: data.readDate ?? this.readDate,
      archived: data.archived ?? this.archived,
      user: data.user ?? this.user,
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(data.updatedAt
        ? { updatedAt: data.updatedAt }
        : this.updatedAt
          ? { updatedAt: this.updatedAt }
          : {}),
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      messageId: this.messageId,
      userId: this.userId,
      read: this.read,
      readDate: this.readDate,
      archived: this.archived,
      user: this.user ? this.user.toJSON() : null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  clone(): MessageTarget {
    return new MessageTarget({
      id: this.id,
      messageId: this.messageId,
      userId: this.userId,
      read: this.read,
      readDate: this.readDate,
      archived: this.archived,
      user: this.user ? this.user.clone() : null,
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(this.updatedAt ? { updatedAt: this.updatedAt } : {}),
    });
  }
}
