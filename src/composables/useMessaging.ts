import type { Message, MessageKind } from 'src/models/Message';
import type { MessageThread } from 'src/models/MessageThread';
import type { ThreadParticipant } from 'src/models/ThreadParticipant';
import {
  messageRepository,
  type ThreadWithParticipant,
} from 'src/models/repositories/MessageRepository';

export interface InboxParticipantSummary {
  id: string;
  name: string;
  archived: boolean;
  isCurrentUser: boolean;
}

export interface InboxItemSummary {
  id: string;
  title: string;
  kind: MessageKind;
  participants: InboxParticipantSummary[];
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  archived: boolean;
  bodyPreview: string;
}

export interface ConversationMessageView {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string | null;
  kind: MessageKind;
  mine: boolean;
  senderId: string;
  senderName: string;
}

export interface ConversationView {
  thread: MessageThread;
  messages: ConversationMessageView[];
  participantIds: string[];
  participant: ThreadParticipant | null;
  participants: InboxParticipantSummary[];
}

interface MessagingApi {
  getInboxSummaries: (userId: string) => Promise<InboxItemSummary[]>;
  getUnreadCount: (userId: string) => Promise<number>;
  loadConversation: (threadId: string, currentUserId: string) => Promise<ConversationView | null>;
  sendRootMessage: (payload: CreateMessagePayload) => Promise<MessageThread | null>;
  replyToThread: (
    threadId: string,
    senderId: string,
    body: string,
    participantIds?: string[],
  ) => Promise<MessageThread | null>;
  setConversationArchived: (threadId: string, userId: string, archived: boolean) => Promise<void>;
}

const BODY_PREVIEW_LENGTH = 160;

function createBodyPreview(body: string): string {
  if (!body) {
    return '';
  }
  if (body.length <= BODY_PREVIEW_LENGTH) {
    return body;
  }
  return `${body.slice(0, BODY_PREVIEW_LENGTH)}…`;
}

function getDisplayName(message: Message): string {
  const sender = message.sender;
  if (
    sender &&
    typeof (sender as unknown as { getDisplayName?: () => string }).getDisplayName === 'function'
  ) {
    return (sender as unknown as { getDisplayName: () => string }).getDisplayName();
  }
  return sender?.name ?? message.senderId;
}

function sortMessages(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => {
    const left = a.createdAt ?? '';
    const right = b.createdAt ?? '';
    return left.localeCompare(right);
  });
}

function resolveLastMessage(thread: MessageThread): { message: Message | null; timestamp: string } {
  const sorted = sortMessages(thread.messages ?? []);
  const message = sorted[sorted.length - 1] ?? null;
  const timestamp =
    message?.createdAt ?? thread.lastMessageAt ?? thread.updatedAt ?? thread.createdAt ?? '';
  return { message, timestamp };
}

function computeUnread(
  participant: ThreadParticipant,
  timestamp: string,
  hasMessage: boolean,
): number {
  if (!hasMessage) {
    return 0;
  }
  if (!participant.lastReadAt) {
    return 1;
  }
  return timestamp > participant.lastReadAt ? 1 : 0;
}

function resolveParticipantName(entry: ThreadParticipant): string {
  const userRecord = entry.user;
  if (userRecord && typeof userRecord === 'object' && 'name' in userRecord) {
    const name = String(userRecord.name ?? '').trim();
    if (name.length > 0) {
      return name;
    }
  }
  return entry.userId;
}

function mapParticipants(thread: MessageThread, currentUserId: string): InboxParticipantSummary[] {
  return (thread.participants ?? []).map((entry) => ({
    id: entry.userId,
    name: resolveParticipantName(entry),
    archived: Boolean(entry.archived),
    isCurrentUser: entry.userId === currentUserId,
  }));
}

function toInboxSummary(record: ThreadWithParticipant, currentUserId: string): InboxItemSummary {
  const { thread, participant } = record;
  const { message: lastMessage, timestamp } = resolveLastMessage(thread);
  const unreadCount = computeUnread(participant, timestamp, Boolean(lastMessage));
  const participants = mapParticipants(thread, currentUserId);

  return {
    id: thread.id,
    title: thread.name,
    kind: lastMessage?.kind ?? 'Message',
    participants,
    createdAt: thread.createdAt ?? '',
    updatedAt: timestamp,
    unreadCount,
    archived: Boolean(participant.archived),
    bodyPreview: createBodyPreview(lastMessage?.body ?? ''),
  };
}

async function getInboxSummaries(userId: string): Promise<InboxItemSummary[]> {
  const threads = await messageRepository.listThreadsForUser(userId);
  return threads.map((record) => toInboxSummary(record, userId));
}

async function getUnreadCount(userId: string): Promise<number> {
  const summaries = await getInboxSummaries(userId);
  return summaries
    .filter((summary) => !summary.archived)
    .reduce((total, summary) => total + summary.unreadCount, 0);
}

async function loadConversation(
  threadId: string,
  currentUserId: string,
): Promise<ConversationView | null> {
  const thread = await messageRepository.getThreadById(threadId);
  if (!thread) {
    return null;
  }

  const participantRecords = await messageRepository.listThreadsForUser(currentUserId);
  const participantEntry =
    participantRecords.find((entry) => entry.thread.id === threadId)?.participant ?? null;

  const messages = sortMessages(thread.messages ?? []).map((message) => ({
    id: message.id,
    body: message.body,
    createdAt: message.createdAt ?? '',
    updatedAt: message.updatedAt ?? null,
    kind: message.kind,
    mine: message.senderId === currentUserId,
    senderId: message.senderId,
    senderName: getDisplayName(message),
  }));

  const participantIds = (thread.participants ?? [])
    .map((participant) => participant.userId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  await messageRepository.markThreadAsRead(thread.id, currentUserId);

  return {
    thread,
    messages,
    participantIds,
    participant: participantEntry,
    participants: mapParticipants(thread, currentUserId),
  };
}

interface CreateMessagePayload {
  senderId: string;
  title: string;
  body: string;
  kind?: MessageKind;
  participantIds: string[];
}

async function sendRootMessage(payload: CreateMessagePayload): Promise<MessageThread | null> {
  const thread = await messageRepository.createThread({
    name: payload.title,
    createdById: payload.senderId,
    participantIds: payload.participantIds,
  });

  await messageRepository.sendMessage({
    threadId: thread.id,
    senderId: payload.senderId,
    body: payload.body,
    kind: payload.kind ?? 'Message',
  });

  return messageRepository.getThreadById(thread.id);
}

async function replyToThread(
  threadId: string,
  senderId: string,
  body: string,
  participantIds: string[] = [],
): Promise<MessageThread | null> {
  await messageRepository.ensureParticipants(threadId, participantIds);
  await messageRepository.sendMessage({
    threadId,
    senderId,
    body,
    kind: 'Message',
  });
  return messageRepository.getThreadById(threadId);
}

async function setConversationArchived(
  threadId: string,
  userId: string,
  archived: boolean,
): Promise<void> {
  await messageRepository.setParticipantArchived(threadId, userId, archived);
}

export const useMessaging = (): MessagingApi => ({
  getInboxSummaries,
  getUnreadCount,
  loadConversation,
  sendRootMessage,
  replyToThread,
  setConversationArchived,
});

export type { CreateMessagePayload };
