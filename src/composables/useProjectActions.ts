import type { MessageKind } from 'src/models/Message';
import type { Project, ProjectStatus } from 'src/models/Project';
import { projectRepository } from 'src/models/repositories/ProjectRepository';
import type { User } from 'src/models/User';
import { ref, watch, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuth } from './useAuth';
import { useMessaging, type CreateMessagePayload } from './useMessaging';
import { useUsers } from './useUsers';

const uniqueIds = (ids: (string | null | undefined)[]): string[] =>
  Array.from(new Set(ids.filter((id): id is string => Boolean(id))));

const extractEducatorIds = (student: User | null): string[] => {
  if (!student?.educators) {
    return [];
  }
  return uniqueIds(student.educators.map((educator) => educator.id));
};

const buildProjectTitle = (
  translate: (key: string) => string,
  key: string,
  project: Project,
): string => {
  const base = translate(key);
  return project.name ? `${base} • ${project.name}` : base;
};

export interface ProjectNotificationContext {
  threadId?: string;
  projectId: string;
  senderId: string;
  title: string;
  participantIds: string[];
  kind: MessageKind;
}

export interface ProjectActionResult {
  project: Project;
  notification?: ProjectNotificationContext | null;
}

export interface NotificationComposerPayload {
  title: string;
  body: string;
  participantIds: string[];
  kind?: MessageKind;
}

export interface UseProjectActionsResult {
  submitProject: (project: Project) => Promise<ProjectActionResult>;
  approveProject: (project: Project) => Promise<ProjectActionResult>;
  rejectProject: (project: Project) => Promise<ProjectActionResult>;
  composerOpen: Ref<boolean>;
  composerContext: Ref<ProjectNotificationContext | null>;
  handleNotificationCreate: (payload: NotificationComposerPayload) => Promise<void>;
}

// eslint-disable-next-line max-lines-per-function
export function useProjectActions(): UseProjectActionsResult {
  const { t } = useI18n();
  const { userId } = useAuth();
  const { getCurrentUser } = useUsers();
  const { sendSystemMessage } = useMessaging();

  const composerOpen = ref(false);
  const composerContext = ref<ProjectNotificationContext | null>(null);

  function openComposer(context: ProjectNotificationContext | null): void {
    if (!context) {
      return;
    }
    composerContext.value = context;
    composerOpen.value = true;
  }

  async function updateStatus(project: Project, status: ProjectStatus): Promise<Project> {
    const updated = await projectRepository.update(project.id, { status });
    project.status = updated.status;
    return project;
  }

  async function submitProject(project: Project): Promise<ProjectActionResult> {
    const updated = await updateStatus(project, 'Submitted');
    const student = await getCurrentUser();
    const educatorIds = extractEducatorIds(student);
    let notification: ProjectNotificationContext | null = null;
    if (student && educatorIds.length) {
      notification = {
        projectId: project.id,
        threadId: project.thread?.id,
        senderId: student.id,
        title: buildProjectTitle(t, 'messaging.notifications.projectSubmittedTitle', updated),
        participantIds: educatorIds,
        kind: 'ProjectSubmitted',
      };
      openComposer(notification);
    }

    return { project: updated, notification };
  }

  async function approveProject(project: Project): Promise<ProjectActionResult> {
    const updated = await updateStatus(project, 'Approved');
    const studentId = project.studentId;
    const educatorId = userId.value ?? null;

    let notification: ProjectNotificationContext | null = null;
    if (studentId && educatorId) {
      notification = {
        projectId: project.id,
        threadId: project.thread?.id,
        senderId: educatorId,
        title: buildProjectTitle(t, 'messaging.notifications.projectApprovedTitle', updated),
        participantIds: [studentId],
        kind: 'ProjectApproved',
      };
      openComposer(notification);
    }

    return { project: updated, notification };
  }

  async function rejectProject(project: Project): Promise<ProjectActionResult> {
    const updated = await updateStatus(project, 'Rejected');
    const studentId = project.studentId;
    const educatorId = userId.value ?? null;

    let notification: ProjectNotificationContext | null = null;
    if (studentId && educatorId) {
      notification = {
        projectId: project.id,
        threadId: project.thread?.id,
        senderId: educatorId,
        title: buildProjectTitle(t, 'messaging.notifications.projectRejectedTitle', updated),
        participantIds: [studentId],
        kind: 'ProjectRejected',
      };
      openComposer(notification);
    }

    return { project: updated, notification };
  }

  async function handleNotificationCreate(payload: NotificationComposerPayload): Promise<void> {
    const context = composerContext.value;
    if (!context) {
      return;
    }
    const request: CreateMessagePayload = {
      threadId: context.threadId,
      projectId: context.projectId,
      senderId: context.senderId,
      title: context.title,
      body: payload.body.trim(),
      participantIds: payload.participantIds,
      kind: payload.kind ?? context.kind,
    };
    await sendSystemMessage(request);
    composerOpen.value = false;
    composerContext.value = null;
  }

  watch(composerOpen, (isOpen) => {
    if (!isOpen) {
      composerContext.value = null;
    }
  });

  return {
    submitProject,
    approveProject,
    rejectProject,
    composerOpen,
    composerContext,
    handleNotificationCreate,
  };
}
