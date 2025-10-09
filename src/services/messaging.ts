import type { MessageKind } from 'src/models/Message';
import type { MessageThread } from 'src/models/MessageThread';
import type { ThreadParticipant } from 'src/models/ThreadParticipant';
import {
  messageRepository,
  type ThreadWithParticipant,
} from 'src/models/repositories/MessageRepository';
import type { Message } from 'src/models/Message';

export interface InboxItemSummary {
  id: string;
  title: string;
  kind: MessageKind;
  senderName: string;
  senderId: string;
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
}

const DEFAULT_PREVIEW_LENGTH = 160;

function createBodyPreview(body: string): string {
  if (!body) return '';
  if (body.length <= DEFAULT_PREVIEW_LENGTH) return body;
  return `${body.slice(0, DEFAULT_PREVIEW_LENGTH)}…`;
}

function getDisplayName(message: Message): string {
  if (
    message.sender &&
    typeof (message.sender as unknown as { getDisplayName?: () => string }).getDisplayName ===
      'function'
  ) {
    return (message.sender as unknown as { getDisplayName: () => string }).getDisplayName();
  }
  return message.sender?.name ?? message.senderId;
}

function sortMessages(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => {
    const left = a.createdAt ?? '';
    const right = b.createdAt ?? '';
    return left.localeCompare(right);
  });
}

function resolveLastMessage(thread: MessageThread): {
  lastMessage: Message | null;
  lastTimestamp: string;
} {
  const messages = sortMessages(thread.messages ?? []);
  const lastMessage = messages[messages.length - 1] ?? null;
  const lastTimestamp =
    lastMessage?.createdAt ?? thread.lastMessageAt ?? thread.updatedAt ?? thread.createdAt ?? '';
  return { lastMessage, lastTimestamp };
}

function computeUnreadCount(
  participant: ThreadParticipant,
  lastTimestamp: string,
  hasMessage: boolean,
): number {
  if (!hasMessage) {
    return 0;
  }
  if (!participant.lastReadAt) {
    return 1;
  }
  return lastTimestamp > participant.lastReadAt ? 1 : 0;
}

function toInboxSummary(record: ThreadWithParticipant): InboxItemSummary {
  const { thread, participant } = record;
  const { lastMessage, lastTimestamp } = resolveLastMessage(thread);
  const unread = computeUnreadCount(participant, lastTimestamp, Boolean(lastMessage));

  return {
    id: thread.id,
    title: thread.name,
    kind: lastMessage?.kind ?? 'Message',
    senderName: lastMessage ? getDisplayName(lastMessage) : thread.createdById,
    senderId: lastMessage?.senderId ?? thread.createdById,
    createdAt: thread.createdAt ?? '',
    updatedAt: lastTimestamp,
    unreadCount: unread,
    archived: Boolean(thread.archived),
    bodyPreview: createBodyPreview(lastMessage?.body ?? ''),
  };
}

export async function getInboxSummaries(userId: string): Promise<InboxItemSummary[]> {
  const records = await messageRepository.listThreadsForUser(userId);
  return records.map(toInboxSummary);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const summaries = await getInboxSummaries(userId);
  return summaries.reduce((total, summary) => total + summary.unreadCount, 0);
}

export async function loadConversation(
  threadId: string,
  currentUserId: string,
): Promise<ConversationView | null> {
  const thread = await messageRepository.getThreadById(threadId);
  if (!thread) {
    return null;
  }

  const participantRecords = await messageRepository.listThreadsForUser(currentUserId);
  const currentParticipant =
    participantRecords.find((record) => record.thread.id === threadId)?.participant ?? null;

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
    participant: currentParticipant,
  };
}

export interface CreateMessagePayload {
  senderId: string;
  title: string;
  body: string;
  kind?: MessageKind;
  participantIds: string[];
}

export async function sendRootMessage(
  payload: CreateMessagePayload,
): Promise<MessageThread | null> {
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

export async function replyToThread(
  threadId: string,
  senderId: string,
  body: string,
  additionalParticipantIds: string[] = [],
): Promise<MessageThread | null> {
  await messageRepository.ensureParticipants(threadId, additionalParticipantIds);

  await messageRepository.sendMessage({
    threadId,
    senderId,
    body,
    kind: 'Message',
  });

  return messageRepository.getThreadById(threadId);
}

export async function setConversationArchived(
  threadId: string,
  archived: boolean,
): Promise<MessageThread> {
  return messageRepository.setThreadArchived(threadId, archived);
}
