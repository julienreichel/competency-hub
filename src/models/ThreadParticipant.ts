import type { Schema } from '../../amplify/data/resource';
import { BaseModel } from './base/BaseModel';
import { MessageThread } from './MessageThread';
import type { User, UserRelationInit } from './User';
import { mapSingularRelation } from './utils';

export type AmplifyThreadParticipant = NonNullable<Schema['ThreadParticipant']['type']>;

export interface ThreadParticipantInit extends Record<string, unknown> {
  id: string;
  threadId: string;
  thread: MessageThread | null;
  userId: string;
  user?: UserRelationInit | User | null;
  lastReadAt?: string | null;
  archived?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export class ThreadParticipant extends BaseModel {
  public readonly threadId: string;
  public readonly thread: MessageThread | null;
  public readonly userId: string;
  public readonly user: UserRelationInit | null;
  public lastReadAt: string | null;
  public archived: boolean;

  constructor(data: ThreadParticipantInit) {
    super(data);
    this.threadId = data.threadId;
    this.thread = data.thread;
    this.userId = data.userId;
    this.user = data.user ?? null;
    this.lastReadAt = data.lastReadAt ?? null;
    this.archived = Boolean(data.archived);

    this.validate();
  }

  static fromAmplify(this: void, raw: AmplifyThreadParticipant): ThreadParticipant {
    const user = mapSingularRelation(raw.user, (value) => value as UserRelationInit);
    const thread = mapSingularRelation(raw.thread, MessageThread.fromAmplify);
    return new ThreadParticipant({
      id: raw.id,
      threadId: raw.threadId,
      thread,
      userId: raw.userId,
      user,
      lastReadAt: raw.lastReadAt ?? null,
      archived: raw.archived ?? false,
      ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
    });
  }

  markRead(timestamp: string): ThreadParticipant {
    return new ThreadParticipant({
      id: this.id,
      threadId: this.threadId,
      thread: this.thread,
      userId: this.userId,
      user: this.user,
      lastReadAt: timestamp,
      archived: this.archived,
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(timestamp
        ? { updatedAt: timestamp }
        : this.updatedAt
          ? { updatedAt: this.updatedAt }
          : {}),
    });
  }

  validate(): void {
    if (!this.threadId?.trim()) {
      throw new Error('Thread participant requires threadId');
    }
    if (!this.userId?.trim()) {
      throw new Error('Thread participant requires userId');
    }
  }

  clone(): ThreadParticipant {
    return new ThreadParticipant({
      id: this.id,
      threadId: this.threadId,
      thread: this.thread?.clone() ?? null,
      userId: this.userId,
      user: this.user ? { ...this.user } : null,
      lastReadAt: this.lastReadAt,
      archived: this.archived,
      ...(this.createdAt ? { createdAt: this.createdAt } : {}),
      ...(this.updatedAt ? { updatedAt: this.updatedAt } : {}),
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      threadId: this.threadId,
      userId: this.userId,
      user: this.user ?? null,
      lastReadAt: this.lastReadAt,
      archived: this.archived,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
