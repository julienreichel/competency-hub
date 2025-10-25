<template>
  <q-page class="conversation-page q-pa-md">
    <breadcrumb-header
      :title="conversation?.thread.name || t('messaging.conversation.titleFallback')"
      :breadcrumbs="breadcrumbs"
      :loading="loading"
      :back-target="{ name: 'messages-inbox' }"
    >
      <q-btn
        outline
        color="grey-7"
        :icon="isArchived ? 'unarchive' : 'archive'"
        :label="
          isArchived
            ? t('messaging.conversation.actions.unarchive')
            : t('messaging.conversation.actions.archive')
        "
        @click="toggleArchive"
        :loading="archiveInProgress"
      />
    </breadcrumb-header>

    <div v-if="threadProject || threadSubCompetency" class="q-mb-md">
      <project-card
        v-if="threadProject"
        :project="threadProject"
        show-open
        @view="openProjectAttachment"
      />
      <sub-competency-card
        v-else-if="threadSubCompetency"
        :sub="threadSubCompetency"
        show-open
        show-context
        @open="openSubCompetencyAttachment"
      />
    </div>

    <conversation-participants
      v-if="conversation"
      class="q-mb-md"
      :participants="participantSummaries"
      :count-label="participantLabel"
    />

    <q-separator class="q-mb-lg" />

    <q-banner v-if="errorMessage" class="bg-negative text-white q-mb-md" inline-actions>
      {{ errorMessage }}
      <template #action>
        <q-btn flat dense @click="loadConversationData">{{ t('common.retry') }}</q-btn>
      </template>
    </q-banner>

    <q-inner-loading :showing="loading" />

    <div v-if="conversation" class="q-gutter-md">
      <div v-for="message in conversation.messages" :key="message.id" class="row">
        <message-card
          :mine="message.mine"
          :sender-name="message.senderName"
          :kind="message.kind"
          :created-at="message.createdAt"
          :body="message.body"
        />
      </div>
      <message-composer class="q-mt-lg" :disabled="sending" @send="handleSend" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import BreadcrumbHeader from 'src/components/common/BreadcrumbHeader.vue';
import ConversationParticipants from 'src/components/messaging/ConversationParticipants.vue';
import MessageCard from 'src/components/messaging/MessageCard.vue';
import MessageComposer from 'src/components/messaging/MessageComposer.vue';
import ProjectCard from 'src/components/project/ProjectCard.vue';
import SubCompetencyCard from 'src/components/competency/SubCompetencyCard.vue';
import { useMessaging, type ConversationView } from 'src/composables/useMessaging';
import { useUsers } from 'src/composables/useUsers';
import type { Project } from 'src/models/Project';
import type { SubCompetency } from 'src/models/SubCompetency';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { getCurrentUser } = useUsers();
const { t } = useI18n();

const { loadConversation, replyToThread, setConversationArchived } = useMessaging();
const conversation = ref<ConversationView | null>(null);
const loading = ref(false);
const sending = ref(false);
const archiveInProgress = ref(false);
const errorMessage = ref<string | null>(null);
const currentUserId = ref<string | null>(null);

const participantSummaries = computed(() => conversation.value?.participants ?? []);
const participantCount = computed(() => participantSummaries.value.length);
const participantLabel = computed(() =>
  t('messaging.conversation.participants', { count: participantCount.value }),
);
const isArchived = computed(() => Boolean(conversation.value?.participant?.archived));
const threadProject = computed<Project | null>(() => conversation.value?.thread.project ?? null);
const threadSubCompetency = computed<SubCompetency | null>(
  () => conversation.value?.thread.subCompetency ?? null,
);

const breadcrumbs = computed(() => {
  const list: Array<{ label: string; to?: RouteLocationRaw }> = [
    { label: t('messaging.inbox.title'), to: { name: 'messages' } },
  ];
  const threadName = conversation.value?.thread.name ?? '';
  list.push({
    label: threadName || t('messaging.conversation.titleFallback'),
  });
  return list;
});

function openProjectAttachment(project: Project): void {
  if (!project?.id) return;
  void router.push({ name: 'project-detail', params: { projectId: project.id } });
}

function openSubCompetencyAttachment(target: SubCompetency | string): void {
  const sub = typeof target === 'string' ? threadSubCompetency.value : target;
  const subId = typeof target === 'string' ? target : sub?.id;
  const competencyId = sub?.competencyId ?? sub?.competency?.id;
  if (!competencyId || !subId) return;
  void router.push({
    name: 'sub-competency',
    params: { competencyId, subId },
  });
}

async function loadConversationData(): Promise<void> {
  if (!currentUserId.value) return;
  const threadId = route.params.rootId as string;
  if (!threadId) return;

  loading.value = true;
  errorMessage.value = null;
  try {
    conversation.value = await loadConversation(threadId, currentUserId.value);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('messaging.conversation.errors.loadFailed');
  } finally {
    loading.value = false;
  }
}

async function handleSend(body: string): Promise<void> {
  if (!conversation.value || !currentUserId.value) {
    return;
  }
  sending.value = true;
  try {
    await replyToThread(
      conversation.value.thread.id,
      currentUserId.value,
      body,
      conversation.value.participantIds,
    );
    await loadConversationData();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('messaging.conversation.errors.sendFailed');
  } finally {
    sending.value = false;
  }
}

async function toggleArchive(): Promise<void> {
  if (!conversation.value || !currentUserId.value) return;
  archiveInProgress.value = true;
  try {
    await setConversationArchived(
      conversation.value.thread.id,
      currentUserId.value,
      !isArchived.value,
    );
    await loadConversationData();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('messaging.conversation.errors.archiveFailed');
  } finally {
    archiveInProgress.value = false;
  }
}

watch(
  () => route.params.rootId,
  () => {
    void loadConversationData();
  },
);

onMounted(async () => {
  const user = await getCurrentUser();
  currentUserId.value = user?.id ?? null;
  await loadConversationData();
});
</script>

<style scoped></style>
