<template>
  <div class="col-11 col-md-10 col-lg-8" :class="[mine ? 'offset-1 offset-md-2 offset-lg-4' : '']">
    <base-card :card-class="cardClass">
      <template #default>
        <div class="row items-center">
          <div class="text-caption text-weight-medium">{{ senderName }}</div>
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
        <div class="text-body1">
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
const cardClass = computed(() => (props.mine ? 'col-10 justify-end' : 'col-10 justify-start'));
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MessageCard',
});
</script>
