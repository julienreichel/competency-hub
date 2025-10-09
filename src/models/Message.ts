import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';
import { MessageThread } from './MessageThread';
import { User, type UserRelationInit } from './User';
import { mapSingularRelation } from './utils';

export type AmplifyMessage = NonNullable<Schema['Message']['type']>;

export type MessageKind =
  | 'Message'
  | 'ValidationSubmitted'
  | 'ProjectSubmitted'
  | 'ProjectApproved'
  | 'ProjectRejected';

const MESSAGE_KINDS: MessageKind[] = [
  'Message',
  'ValidationSubmitted',
  'ProjectSubmitted',
  'ProjectApproved',
  'ProjectRejected',
];

const normaliseKind = (value: string): MessageKind => {
  if (MESSAGE_KINDS.includes(value as MessageKind)) {
    return value as MessageKind;
  }
  return 'Message';
};

export interface MessageInit extends Record<string, unknown> {
  id: string;
  threadId: string;
  thread?: MessageThread | null;
  senderId: string;
  body: string;
  kind: string;
  sender?: UserRelationInit | User | null;
  createdAt?: string;
  updatedAt?: string;
}

export class Message extends BaseModel {
  public readonly threadId: string;
  public readonly thread: MessageThread | null;
  public readonly senderId: string;
  public body: string;
  public kind: MessageKind;
  public readonly sender: User | null;

  constructor(data: MessageInit) {
    super(data);
    this.threadId = data.threadId;
    this.senderId = data.senderId;
    this.body = data.body;
    this.kind = normaliseKind(data.kind);
    this.sender = data.sender ? User.create(data.sender) : null;

    this.thread = data.thread ?? null;
    this.validate();
  }

  static fromAmplify(this: void, raw: AmplifyMessage): Message {
    const sender = mapSingularRelation(raw.sender, User.fromAmplify);
    const thread = mapSingularRelation(raw.thread, MessageThread.fromAmplify);

    return new Message({
      id: raw.id,
      threadId: raw.threadId,
      thread,
      senderId: raw.senderId,
      body: raw.body,
      kind: normaliseKind((raw.kind as string) ?? 'Message'),
      sender,
      ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
    });
  }

  validate(): void {
    if (!this.threadId?.trim()) {
      throw new Error('Message threadId is required');
    }
    if (!this.senderId?.trim()) {
      throw new Error('Message senderId is required');
    }
    if (!this.body?.trim()) {
      throw new Error('Message body is required');
    }
  }

  clone(): Message {
    return new Message({
      id: this.id,
      threadId: this.threadId,
      thread: this.thread?.clone() ?? null,
      senderId: this.senderId,
      body: this.body,
      kind: this.kind,
      sender: this.sender ? this.sender.clone() : null,
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(this.updatedAt ? { updatedAt: this.updatedAt } : {}),
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      threadId: this.threadId,
      senderId: this.senderId,
      body: this.body,
      kind: this.kind,
      sender: this.sender ? this.sender.toJSON() : null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
