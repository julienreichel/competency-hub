<template>
  <q-list bordered class="message-list">
    <template v-if="items.length">
      <q-item
        v-for="item in items"
        :key="item.id"
        clickable
        class="message-list__item"
        @click="() => emitSelect(item.id)"
      >
        <q-item-section>
          <div class="row items-center justify-between q-gutter-sm">
            <div class="col text-subtitle1 text-weight-medium ellipsis">
              {{ item.title }}
            </div>
            <div class="col-auto text-caption text-grey-6">
              {{ formatTimestamp(item.updatedAt || item.createdAt) }}
            </div>
          </div>
          <div class="text-caption text-grey-7">
            <template v-for="(participant, index) in item.participants" :key="participant.id">
              <span
                :class="{
                  'message-list__participant--archived':
                    participant.archived && !participant.isCurrentUser,
                  'text-grey-5': participant.archived && !participant.isCurrentUser,
                }"
              >
                {{ formatParticipant(participant) }}
              </span>
              <span v-if="index < item.participants.length - 1">, </span>
            </template>
          </div>
        </q-item-section>

        <q-item-section side top class="column items-end q-gutter-sm">
          <q-badge
            v-if="item.unreadCount > 0"
            color="primary"
            text-color="white"
            rounded
            class="message-list__badge"
          >
            {{ item.unreadCount }}
          </q-badge>
          <q-btn
            dense
            flat
            round
            :icon="item.archived ? 'unarchive' : 'archive'"
            color="grey-7"
            :aria-label="
              item.archived
                ? t('messaging.conversation.actions.unarchive')
                : t('messaging.actions.archive')
            "
            @click.stop="() => emitArchive(item.id)"
          />
        </q-item-section>
      </q-item>
    </template>

    <slot v-else name="empty">
      <div class="message-list__empty text-center q-pa-xl text-grey-6">
        {{ t('messaging.inbox.empty') }}
      </div>
    </slot>
  </q-list>
</template>

<script setup lang="ts">
import { date } from 'quasar';
import type { InboxItemSummary } from 'src/composables/useMessaging';
import { useI18n } from 'vue-i18n';

defineProps<{
  items: InboxItemSummary[];
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'archive', id: string): void;
}>();

const { t } = useI18n();

function formatParticipant(participant: InboxItemSummary['participants'][number]): string {
  const baseName = participant.name || t('common.unknown');
  if (participant.archived && !participant.isCurrentUser) {
    return `${baseName}${t('messaging.inbox.archivedIndicator')}`;
  }
  return baseName;
}

function emitSelect(id: string): void {
  emit('select', id);
}

function emitArchive(id: string): void {
  emit('archive', id);
}

function formatTimestamp(value: string): string {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return date.formatDate(parsed, 'MMM D, YYYY • HH:mm');
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MessageList',
});
</script>

<style scoped>
.message-list__item + .message-list__item {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.message-list__preview {
  max-height: 3.6em;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-list__badge {
  font-weight: 600;
}

.message-list__participant--archived {
  font-style: italic;
}
</style>
