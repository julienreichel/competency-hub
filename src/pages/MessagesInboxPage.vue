<template>
  <q-page class="messages-inbox-page q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="column q-gutter-xs">
        <div class="text-h5 text-weight-bold">{{ t('messaging.inbox.title') }}</div>
        <div class="text-caption text-grey-7">{{ t('messaging.inbox.subtitle') }}</div>
      </div>
      <q-btn
        color="primary"
        icon="add"
        :label="t('messaging.inbox.actions.newMessage')"
        @click="openNewMessage"
      />
    </div>

    <q-card bordered>
      <q-inner-loading :showing="loading" />
      <q-card-section>
        <message-list :items="items" @select="handleSelect" @archive="handleArchive">
          <template #empty>
            <div class="column items-center q-gutter-sm q-pa-xl text-grey-6">
              <q-icon name="mail_outline" size="48px" />
              <div>{{ t('messaging.inbox.empty') }}</div>
            </div>
          </template>
        </message-list>
      </q-card-section>
    </q-card>

    <q-banner v-if="errorMessage" class="bg-negative text-white q-mt-md" inline-actions>
      {{ errorMessage }}
      <template #action>
        <q-btn flat dense @click="loadInbox">{{ t('common.retry') }}</q-btn>
      </template>
    </q-banner>

    <new-message-dialog v-model="newDialogOpen" @create="handleCreateMessage" />
  </q-page>
</template>

<script setup lang="ts">
import MessageList from 'src/components/messaging/MessageList.vue';
import NewMessageDialog from 'src/components/messaging/NewMessageDialog.vue';
import { useUsers } from 'src/composables/useUsers';
import type { InboxItemSummary } from 'src/services/messaging';
import {
  getInboxSummaries,
  sendRootMessage,
  setConversationArchived,
} from 'src/services/messaging';
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { getCurrentUser } = useUsers();
const { t } = useI18n();
const router = useRouter();

const items = ref<InboxItemSummary[]>([]);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const newDialogOpen = ref(false);
const currentUserId = ref<string | null>(null);

async function loadInbox(): Promise<void> {
  if (!currentUserId.value) return;

  loading.value = true;
  errorMessage.value = null;
  try {
    items.value = await getInboxSummaries(currentUserId.value);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('messaging.inbox.errors.loadFailed');
  } finally {
    loading.value = false;
  }
}

function openNewMessage(): void {
  newDialogOpen.value = true;
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
    await loadInbox();
    if (message) {
      void router.push({ path: `/messages/${message.id}` });
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('messaging.inbox.errors.createFailed');
  }
}

function handleSelect(messageId: string): void {
  void router.push({ path: `/messages/${messageId}` });
}

async function handleArchive(messageId: string): Promise<void> {
  if (!currentUserId.value) return;
  try {
    await setConversationArchived(messageId, currentUserId.value, true);
    items.value = items.value.filter((item) => item.id !== messageId);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('messaging.inbox.errors.archiveFailed');
  }
}

onMounted(async () => {
  const user = await getCurrentUser();
  currentUserId.value = user?.id ?? null;
  await loadInbox();
});
</script>
