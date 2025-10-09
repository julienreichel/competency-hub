<template>
  <q-page class="conversation-page q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="column q-gutter-xs">
        <div class="text-h5 text-weight-bold">
          {{ conversation?.root.title || t('messaging.conversation.titleFallback') }}
        </div>
        <div class="text-caption text-grey-7" v-if="conversation">
          {{ t('messaging.conversation.participants', { count: participantCount }) }}
        </div>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-btn
          v-if="showNavigateButton"
          outline
          color="primary"
          icon="open_in_new"
          :label="t('messaging.conversation.actions.goToItem')"
          @click="goToRelatedItem"
        />
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
        <q-btn
          color="primary"
          icon="add"
          outline
          :label="t('messaging.conversation.actions.newMessage')"
          @click="openNewMessage"
        />
      </div>
    </div>

    <q-separator class="q-mb-lg" />

    <q-banner v-if="errorMessage" class="bg-negative text-white q-mb-md" inline-actions>
      {{ errorMessage }}
      <template #action>
        <q-btn flat dense @click="loadConversationData">{{ t('common.retry') }}</q-btn>
      </template>
    </q-banner>

    <q-inner-loading :showing="loading" />

    <div v-if="conversation" class="column q-gutter-md conversation-page__messages">
      <message-card
        v-for="message in conversation.messages"
        :key="message.id"
        :mine="message.mine"
        :sender-name="message.senderName"
        :kind="message.kind"
        :created-at="message.createdAt"
        :body="message.body"
      />

      <message-composer class="q-mt-lg" :disabled="sending" @send="handleSend" />
    </div>

    <new-message-dialog
      v-model="newDialogOpen"
      :initial-targets="conversation?.participants ?? []"
      @create="handleCreateMessage"
    />
  </q-page>
</template>

<script setup lang="ts">
import MessageCard from 'src/components/messaging/MessageCard.vue';
import MessageComposer from 'src/components/messaging/MessageComposer.vue';
import NewMessageDialog from 'src/components/messaging/NewMessageDialog.vue';
import {
  loadConversation,
  replyToThread,
  sendRootMessage,
  setConversationArchived,
  type ConversationView,
} from 'src/services/messaging';
import { subCompetencyRepository } from 'src/models/repositories/SubCompetencyRepository';
import { useUsers } from 'src/composables/useUsers';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { getCurrentUser } = useUsers();
const { t } = useI18n();

const conversation = ref<ConversationView | null>(null);
const loading = ref(false);
const sending = ref(false);
const archiveInProgress = ref(false);
const errorMessage = ref<string | null>(null);
const currentUserId = ref<string | null>(null);
const newDialogOpen = ref(false);

const participantCount = computed(() => conversation.value?.participants.length ?? 0);
const isArchived = computed(() => Boolean(conversation.value?.rootTarget?.archived));
const showNavigateButton = computed(() => {
  if (!conversation.value) return false;
  return Boolean(conversation.value.root.projectId || conversation.value.root.subCompetencyId);
});

async function loadConversationData(): Promise<void> {
  if (!currentUserId.value) return;
  const rootId = route.params.rootId as string;
  if (!rootId) return;

  loading.value = true;
  errorMessage.value = null;
  try {
    conversation.value = await loadConversation(rootId, currentUserId.value);
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
    await replyToThread(conversation.value.root.id, currentUserId.value, body);
    await loadConversationData();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('messaging.conversation.errors.sendFailed');
  } finally {
    sending.value = false;
  }
}

async function handleCreateMessage(payload: {
  title: string;
  body: string;
  targetIds: string[];
}): Promise<void> {
  if (!currentUserId.value) return;
  try {
    const message = await sendRootMessage({
      senderId: currentUserId.value,
      title: payload.title,
      body: payload.body,
      targetUserIds: payload.targetIds,
      kind: 'Message',
    });
    if (message) {
      void router.push({ path: `/messages/${message.id}` });
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('messaging.conversation.errors.createFailed');
  }
}

async function toggleArchive(): Promise<void> {
  if (!conversation.value || !currentUserId.value) return;
  archiveInProgress.value = true;
  try {
    await setConversationArchived(
      conversation.value.root.id,
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

async function goToRelatedItem(): Promise<void> {
  if (!conversation.value) return;
  const { projectId, subCompetencyId } = conversation.value.root;
  if (projectId) {
    void router.push({ name: 'project-detail', params: { projectId } });
    return;
  }

  if (subCompetencyId) {
    const sub = await subCompetencyRepository.findById(subCompetencyId);
    if (sub) {
      void router.push({
        name: 'sub-competency',
        params: { competencyId: sub.competencyId, subId: sub.id },
      });
    }
  }
}

function openNewMessage(): void {
  newDialogOpen.value = true;
}

watch(
  () => route.params.rootId,
  async () => {
    await loadConversationData();
  },
);

onMounted(async () => {
  const user = await getCurrentUser();
  currentUserId.value = user?.id ?? null;
  await loadConversationData();
});
</script>

<style scoped>
.conversation-page__messages {
  max-width: 720px;
  margin: 0 auto;
}
</style>
