<template>
  <div :class="['message-card', mine ? 'message-card--mine' : 'message-card--theirs']">
    <base-card
      :card-class="cardClass"
      :content-class="'q-gutter-xs'"
      :background-color="mine ? 'primary' : undefined"
    >
      <template #default>
        <div class="row items-center q-gutter-sm message-card__meta">
          <div class="text-caption text-weight-medium" :class="mine ? 'text-white' : 'text-grey-8'">
            {{ senderName }}
          </div>
          <q-chip
            v-if="showKindChip"
            dense
            size="sm"
            color="secondary"
            text-color="white"
            class="q-ml-none"
          >
            {{ kindLabel }}
          </q-chip>
          <div class="text-caption text-grey-5 q-ml-auto">
            {{ formattedDate }}
          </div>
        </div>
        <div class="text-body1 message-card__body" :class="mine ? 'text-white' : 'text-grey-10'">
          {{ body || t('messaging.preview.empty') }}
        </div>
      </template>
    </base-card>
  </div>
</template>

<script setup lang="ts">
import { date } from 'quasar';
import BaseCard from 'src/components/common/BaseCard.vue';
import type { MessageKind } from 'src/models/Message';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  mine: boolean;
  body: string;
  senderName: string;
  createdAt: string;
  kind: MessageKind;
}>();

const { t } = useI18n();

const showKindChip = computed(() => props.kind !== 'Message');
const kindLabel = computed(() => t(`messaging.kind.${props.kind}`, props.kind));
const formattedDate = computed(() => {
  if (!props.createdAt) return '';
  const parsed = new Date(props.createdAt);
  if (Number.isNaN(parsed.getTime())) return props.createdAt;
  return date.formatDate(parsed, 'MMM D, YYYY • HH:mm');
});
const cardClass = computed(() => (props.mine ? 'message-card__card--mine' : ''));
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MessageCard',
});
</script>

<style scoped>
.message-card {
  display: flex;
}

.message-card--mine {
  justify-content: flex-end;
}

.message-card--theirs {
  justify-content: flex-start;
}

.message-card__card--mine {
  color: white;
}

.message-card__meta {
  align-items: center;
}

.message-card__body {
  white-space: pre-line;
}
</style>
