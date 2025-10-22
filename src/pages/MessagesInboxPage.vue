<template>
  <q-page class="messages-inbox-page q-pa-md">
    <page-header
      :icon="'mail'"
      :title="t('messaging.inbox.title')"
      :subtitle="t('messaging.inbox.subtitle')"
    >
      <q-btn
        flat
        dense
        :icon="showArchived ? 'unarchive' : 'inventory_2'"
        :color="showArchived ? 'primary' : 'grey-7'"
        :label="
          showArchived
            ? t('messaging.inbox.actions.hideArchived')
            : t('messaging.inbox.actions.showArchived', { count: archivedCount })
        "
        @click="toggleShowArchived"
      />
      <q-btn
        color="primary"
        icon="add"
        :label="t('messaging.inbox.actions.newMessage')"
        @click="openNewMessage"
      />
    </page-header>

    <q-card bordered>
      <q-inner-loading :showing="loading" />
      <q-card-section>
        <message-list :items="visibleItems" @select="handleSelect" @archive="handleArchive">
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
import PageHeader from 'src/components/common/PageHeader.vue';
import MessageList from 'src/components/messaging/MessageList.vue';
import NewMessageDialog from 'src/components/messaging/NewMessageDialog.vue';
import { useMessaging, type InboxItemSummary } from 'src/composables/useMessaging';
import { useUsers } from 'src/composables/useUsers';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { getCurrentUser } = useUsers();
const { t } = useI18n();
const router = useRouter();

const { getInboxSummaries, sendRootMessage, setConversationArchived } = useMessaging();
const items = ref<InboxItemSummary[]>([]);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const newDialogOpen = ref(false);
const currentUserId = ref<string | null>(null);
const showArchived = ref(false);

const archivedCount = computed(() => items.value.filter((item) => item.archived).length);
const visibleItems = computed(() =>
  showArchived.value ? items.value : items.value.filter((item) => !item.archived),
);

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

function toggleShowArchived(): void {
  showArchived.value = !showArchived.value;
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
      kind: 'Message',
    });
    await loadInbox();
    if (thread) {
      void router.push({ path: `/messages/${thread.id}` });
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
  const target = items.value.find((item) => item.id === messageId);
  if (!target) return;

  try {
    await setConversationArchived(messageId, currentUserId.value, !target.archived);
    await loadInbox();
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
