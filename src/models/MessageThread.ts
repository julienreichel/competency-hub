import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';
import { Message, type MessageInit } from './Message';
import { ThreadParticipant, type ThreadParticipantInit } from './ThreadParticipant';
import type { UserRelationInit } from './User';
import { mapArrayRelation, mapSingularRelation } from './utils';

export type AmplifyMessageThread = NonNullable<Schema['MessageThread']['type']>;

export interface MessageThreadInit extends Record<string, unknown> {
  id: string;
  name: string;
  createdById: string;
  createdBy?: UserRelationInit | null;
  messages?: Array<Message | MessageInit> | null;
  participants?: Array<ThreadParticipant | ThreadParticipantInit> | null;
  lastMessageAt?: string | null;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class MessageThread extends BaseModel {
  public name: string;
  public readonly createdById: string;
  public readonly createdBy: UserRelationInit | null;
  public participants: ThreadParticipant[];
  public readonly messages: Message[];
  public lastMessageAt: string | null;
  public archived: boolean;

  constructor(data: MessageThreadInit) {
    super(data);
    this.name = data.name;
    this.createdById = data.createdById;
    this.createdBy = data.createdBy ?? null;
    this.participants = Array.isArray(data.participants)
      ? data.participants.map((entry) =>
          entry instanceof ThreadParticipant ? entry.clone() : new ThreadParticipant(entry),
        )
      : [];
    this.messages = Array.isArray(data.messages)
      ? data.messages.map((entry) =>
          entry instanceof Message ? entry.clone() : new Message(entry),
        )
      : [];
    this.lastMessageAt = data.lastMessageAt ?? null;
    this.archived = data.archived ?? false;

    this.validate();
  }

  static fromAmplify(this: void, raw: AmplifyMessageThread): MessageThread {
    const participants = mapArrayRelation(raw.participants, ThreadParticipant.fromAmplify);

    const messages = mapArrayRelation(raw.messages, Message.fromAmplify);

    const createdBy = mapSingularRelation(raw.createdBy, (value) => value as UserRelationInit);

    return new MessageThread({
      id: raw.id,
      name: raw.name,
      createdById: raw.createdById,
      createdBy,
      participants,
      messages,
      lastMessageAt: raw.lastMessageAt ?? null,
      archived: raw.archived ?? false,
      ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
    });
  }

  validate(): void {
    if (!this.name?.trim()) {
      throw new Error('Message thread name is required');
    }
    if (!this.createdById?.trim()) {
      throw new Error('Message thread createdById is required');
    }
  }

  clone(): MessageThread {
    return new MessageThread({
      id: this.id,
      name: this.name,
      createdById: this.createdById,
      createdBy: this.createdBy ? { ...this.createdBy } : null,
      participants: this.participants.map((participant) => participant.clone()),
      messages: this.messages.map((message) => message.clone()),
      lastMessageAt: this.lastMessageAt,
      archived: this.archived,
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(this.updatedAt ? { updatedAt: this.updatedAt } : {}),
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      createdById: this.createdById,
      createdBy: this.createdBy ?? null,
      participants: this.participants.map((participant) => participant.toJSON()),
      messages: this.messages.map((message) => message.toJSON()),
      lastMessageAt: this.lastMessageAt,
      archived: this.archived,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
