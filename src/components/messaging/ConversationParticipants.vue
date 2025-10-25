<template>
  <div class="conversation-participants column q-gutter-xs">
    <div class="text-caption text-grey-7">
      {{ countLabel }}
    </div>
    <div v-if="participants.length" class="text-caption text-grey-6">
      <template v-for="(participant, index) in participants" :key="participant.id">
        <span
          :class="{
            'conversation-participants__archived':
              participant.archived && !participant.isCurrentUser,
            'text-grey-5': participant.archived && !participant.isCurrentUser,
          }"
        >
          {{ formatParticipant(participant) }}
        </span>
        <span v-if="index < participants.length - 1">, </span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMessaging, type ConversationView } from 'src/composables/useMessaging';

defineProps<{
  participants: ConversationView['participants'];
  countLabel: string;
}>();

const { formatParticipant } = useMessaging();
</script>

<style scoped>
.conversation-participants__archived {
  font-style: italic;
}
</style>
