import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';
import type { MessageTargetInit } from './MessageTarget';
import { MessageTarget } from './MessageTarget';
import { User, type UserRelationInit } from './User';
import { createObject, mapArrayRelation, mapSingularRelation } from './utils';

export type AmplifyMessage = NonNullable<Schema['Message']['type']>;

const MESSAGE_KINDS = [
  'Message',
  'ValidationSubmitted',
  'ProjectSubmitted',
  'ProjectApproved',
  'ProjectRejected',
] as const;

export type MessageKind = (typeof MESSAGE_KINDS)[number];

const isMessageKind = (value: unknown): value is MessageKind =>
  typeof value === 'string' && (MESSAGE_KINDS as readonly string[]).includes(value);

const normaliseKind = (value: unknown): MessageKind => (isMessageKind(value) ? value : 'Message');

export interface MessageInit extends Record<string, unknown> {
  id: string;
  senderId: string;
  title: string;
  kind: MessageKind;
  body?: string | null;
  parentId?: string | null;
  parent?: Message;
  subCompetencyId?: string | null;
  projectId?: string | null;
  sender?: UserRelationInit | User | null;
  targets?: Array<MessageTargetInit | MessageTarget> | null;
  replies?: Array<MessageInit | Message> | null;
  createdAt?: string;
  updatedAt?: string;
}

export class Message extends BaseModel {
  public readonly senderId: string;
  public readonly parentId: string | null;
  public readonly subCompetencyId: string | null;
  public readonly projectId: string | null;
  public title: string;
  public body: string | null;
  public kind: MessageKind;
  public readonly sender: User | null;
  public readonly targets: MessageTarget[];
  public readonly replies: Message[];
  public readonly parent: Message | null;

  constructor(data: MessageInit) {
    super(data);
    this.senderId = data.senderId;
    this.parentId = data.parentId ?? null;
    this.subCompetencyId = data.subCompetencyId ?? null;
    this.projectId = data.projectId ?? null;
    this.title = data.title;
    this.body = data.body ?? null;
    this.kind = normaliseKind(data.kind);
    this.sender = data.sender ? User.create(data.sender) : null;
    this.targets = Array.isArray(data.targets)
      ? data.targets.map((target) =>
          target instanceof MessageTarget ? target.clone() : new MessageTarget(target),
        )
      : [];
    this.replies = Array.isArray(data.replies)
      ? data.replies.map((reply) => (reply instanceof Message ? reply.clone() : new Message(reply)))
      : [];
    this.parent = createObject(data.parent, Message);

    this.validate();
  }

  static fromAmplify(this: void, raw: AmplifyMessage): Message {
    const sender = mapSingularRelation(raw.sender, User.fromAmplify);

    const targets = mapArrayRelation(raw.targets, MessageTarget.fromAmplify);
    const replies = mapArrayRelation(raw.replies, Message.fromAmplify);

    const parent = mapSingularRelation(raw.parent, Message.fromAmplify) || undefined;

    return new Message({
      id: raw.id,
      senderId: raw.senderId,
      parentId: raw.parentId ?? null,
      parent,
      subCompetencyId: raw.subCompetencyId ?? null,
      projectId: raw.projectId ?? null,
      title: raw.title,
      body: raw.body ?? null,
      kind: normaliseKind(raw.kind),
      sender,
      targets,
      replies,
      ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
    });
  }

  validate(): void {
    if (!this.title?.trim()) {
      throw new Error('Message title is required');
    }
    if (!this.senderId?.trim()) {
      throw new Error('Message senderId is required');
    }
  }

  isRoot(): boolean {
    return this.parentId === null;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      senderId: this.senderId,
      parentId: this.parentId,
      subCompetencyId: this.subCompetencyId,
      projectId: this.projectId,
      title: this.title,
      body: this.body,
      kind: this.kind,
      sender: this.sender ? this.sender.toJSON() : null,
      targets: this.targets.map((target) => target.toJSON()),
      replies: this.replies.map((reply) => reply.toJSON()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  clone(): Message {
    return new Message({
      id: this.id,
      senderId: this.senderId,
      parentId: this.parentId,
      subCompetencyId: this.subCompetencyId,
      projectId: this.projectId,
      title: this.title,
      body: this.body,
      kind: this.kind,
      sender: this.sender ? this.sender.clone() : null,
      targets: this.targets.map((target) => target.clone()),
      replies: this.replies.map((reply) => reply.clone()),
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(this.updatedAt ? { updatedAt: this.updatedAt } : {}),
    });
  }

  withReplies(replies: Message[]): Message {
    return new Message({
      id: this.id,
      senderId: this.senderId,
      parentId: this.parentId,
      subCompetencyId: this.subCompetencyId,
      projectId: this.projectId,
      title: this.title,
      body: this.body,
      kind: this.kind,
      sender: this.sender,
      targets: this.targets,
      replies,
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(this.updatedAt ? { updatedAt: this.updatedAt } : {}),
    });
  }

  static create(data: MessageInit | Message | null | undefined): Message | null {
    if (!data) return null;
    if (data instanceof Message) return data;
    return new Message(data);
  }
}
