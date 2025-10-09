<template>
  <q-page class="conversation-page q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="column q-gutter-xs">
        <div class="text-h5 text-weight-bold">
          {{ conversation?.thread.name || t('messaging.conversation.titleFallback') }}
        </div>
        <div class="text-caption text-grey-7" v-if="conversation">
          {{ t('messaging.conversation.participants', { count: participantCount }) }}
        </div>
      </div>
      <div class="row items-center q-gutter-sm">
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
      :initial-targets="conversation?.participantIds ?? []"
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

const participantCount = computed(() => conversation.value?.participantIds.length ?? 0);
const isArchived = computed(() => Boolean(conversation.value?.thread.archived));

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

async function handleCreateMessage(payload: {
  title: string;
  body: string;
  participantIds: string[];
}): Promise<void> {
  if (!currentUserId.value) return;
  try {
    const thread = await sendRootMessage({
      senderId: currentUserId.value,
      title: payload.title,
      body: payload.body,
      participantIds: payload.participantIds,
    });
    if (thread) {
      void router.push({ path: `/messages/${thread.id}` });
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('messaging.conversation.errors.createFailed');
  }
}

async function toggleArchive(): Promise<void> {
  if (!conversation.value) return;
  archiveInProgress.value = true;
  try {
    await setConversationArchived(conversation.value.thread.id, !isArchived.value);
    await loadConversationData();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('messaging.conversation.errors.archiveFailed');
  } finally {
    archiveInProgress.value = false;
  }
}

function openNewMessage(): void {
  newDialogOpen.value = true;
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

<style scoped>
.conversation-page__messages {
  max-width: 720px;
  margin: 0 auto;
}
</style>
