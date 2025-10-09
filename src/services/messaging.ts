import type { Message, MessageKind } from 'src/models/Message';
import type { MessageTarget } from 'src/models/MessageTarget';
import { messageRepository } from 'src/models/repositories/MessageRepository';

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
  message: Message;
}

export interface ConversationView {
  root: Message;
  parent: Message | null;
  messages: ConversationMessageView[];
  participants: string[];
  rootTarget: MessageTarget | null;
}

const DEFAULT_PREVIEW_LENGTH = 160;

function normaliseTimestamp(message: Message): string {
  return message.updatedAt ?? message.createdAt ?? '';
}

function createBodyPreview(body: string | null): string {
  if (!body) {
    return '';
  }

  if (body.length <= DEFAULT_PREVIEW_LENGTH) {
    return body;
  }

  return `${body.slice(0, DEFAULT_PREVIEW_LENGTH)}…`;
}

function collectParticipantIds(root: Message, parent: Message | null): string[] {
  const identifiers = new Set<string>();

  identifiers.add(root.senderId);
  root.targets.forEach((target) => identifiers.add(target.userId));

  if (parent) {
    identifiers.add(parent.senderId);
    parent.targets.forEach((target) => identifiers.add(target.userId));
  }

  const stack: Message[] = [...root.replies];
  while (stack.length > 0) {
    const current = stack.shift();
    if (!current) continue;
    identifiers.add(current.senderId);
    current.targets.forEach((target) => identifiers.add(target.userId));
    if (current.replies.length > 0) {
      stack.push(...current.replies);
    }
  }

  return Array.from(identifiers);
}

function formatConversationMessages(
  parent: Message | null,
  root: Message,
  currentUserId: string,
): ConversationMessageView[] {
  const sequence: Message[] = [];
  if (parent) {
    sequence.push(parent);
  }
  sequence.push(root);
  const replies = [...root.replies].sort((a, b) => {
    const left = a.createdAt ?? '';
    const right = b.createdAt ?? '';
    return left.localeCompare(right);
  });
  sequence.push(...replies);

  return sequence.map((message) => ({
    id: message.id,
    body: message.body ?? '',
    createdAt: message.createdAt ?? '',
    updatedAt: message.updatedAt ?? null,
    kind: message.kind,
    mine: message.senderId === currentUserId,
    senderId: message.senderId,
    senderName: message.sender?.getDisplayName() ?? '',
    message,
  }));
}

export async function getInboxSummaries(userId: string): Promise<InboxItemSummary[]> {
  const threads = await messageRepository.listInbox(userId);

  return threads.map((thread) => {
    const unreadCount = thread.target.read ? 0 : 1;
    const archived = Boolean(thread.target.archived);
    const updatedAt = normaliseTimestamp(thread.root);
    const senderName = thread.root.sender?.getDisplayName() ?? '';
    return {
      id: thread.root.id,
      title: thread.root.title,
      kind: thread.root.kind,
      senderName,
      senderId: thread.root.senderId,
      createdAt: thread.root.createdAt ?? '',
      updatedAt,
      unreadCount,
      archived,
      bodyPreview: createBodyPreview(thread.root.body ?? ''),
    };
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  const summaries = await getInboxSummaries(userId);
  return summaries.reduce((total, summary) => total + summary.unreadCount, 0);
}

export async function loadConversation(
  rootId: string,
  currentUserId: string,
): Promise<ConversationView | null> {
  const root = await messageRepository.findById(rootId, { includeReplies: true });
  if (!root) {
    return null;
  }

  const parent = root.parent;

  const rootTarget = root.targets.find((t) => t.userId === currentUserId);
  if (!rootTarget) {
    return null;
  }
  const participants = collectParticipantIds(root, parent ?? null).filter(
    (id) => id && id !== currentUserId,
  );
  const messages = formatConversationMessages(parent, root, currentUserId);

  await messageRepository.markTargetAsRead(rootTarget.id);

  return {
    root,
    parent,
    messages,
    participants,
    rootTarget,
  };
}

export interface CreateMessagePayload {
  senderId: string;
  title: string;
  body?: string | null;
  kind?: MessageKind;
  targetUserIds: string[];
  subCompetencyId?: string | null;
  projectId?: string | null;
}

export async function sendRootMessage(payload: CreateMessagePayload): Promise<Message | null> {
  const message = await messageRepository.sendMessage({
    senderId: payload.senderId,
    title: payload.title,
    kind: payload.kind ?? 'Message',
    body: payload.body ?? null,
    parentId: null,
    subCompetencyId: payload.subCompetencyId ?? null,
    projectId: payload.projectId ?? null,
    targetUserIds: Array.from(new Set(payload.targetUserIds)),
  });

  return messageRepository.findById(message.id, { includeReplies: true });
}

export async function replyToThread(
  rootId: string,
  currentUserId: string,
  body: string,
): Promise<Message | null> {
  const thread = await messageRepository.findById(rootId, { includeReplies: true });
  if (!thread) {
    return null;
  }

  const participantIds = collectParticipantIds(thread, null).filter(
    (id) => id && id !== currentUserId,
  );

  const message = await messageRepository.sendMessage({
    senderId: currentUserId,
    title: thread.title,
    kind: 'Message',
    body,
    parentId: thread.id,
    subCompetencyId: thread.subCompetencyId ?? null,
    projectId: thread.projectId ?? null,
    targetUserIds: Array.from(new Set(participantIds)),
  });

  return messageRepository.findById(message.parentId ?? message.id, { includeReplies: true });
}

export async function setConversationArchived(
  rootId: string,
  userId: string,
  archived: boolean,
): Promise<void> {
  await messageRepository.setThreadArchived(rootId, userId, archived);
}
