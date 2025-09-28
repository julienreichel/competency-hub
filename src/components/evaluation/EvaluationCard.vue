<template>
  <q-card flat bordered>
    <q-card-section class="row items-start justify-between q-gutter-sm">
      <div class="column q-gutter-xs">
        <div class="text-subtitle2 text-grey-7">
          {{ evaluation.mode }} • {{ evaluation.format }}
        </div>
        <div class="text-subtitle1">{{ evaluation.name }}</div>
        <div v-if="evaluation.description" class="text-caption text-grey-7">
          {{ evaluation.description }}
        </div>
        <div class="text-caption text-grey-6">
          <span v-if="evaluation.durationMin">
            {{ evaluation.durationMin }} {{ $t('evaluations.minutesShort') }}
          </span>
          <span v-else>{{ $t('evaluations.noDuration') }}</span>
        </div>
        <div class="row items-center q-gutter-xs">
          <q-icon
            v-if="evaluation.url"
            name="link"
            color="primary"
            size="20px"
            class="cursor-pointer"
            @click="openEvaluation"
          />
          <q-icon
            v-if="evaluation.fileKey"
            name="description"
            color="primary"
            size="20px"
            class="cursor-pointer"
            @click="openEvaluation"
          />
          <span v-if="!evaluation.url && !evaluation.fileKey" class="text-grey-6">—</span>
        </div>
      </div>
      <div class="row q-gutter-xs">
        <q-btn
          flat
          dense
          color="primary"
          icon="open_in_new"
          :disable="!canOpen"
          @click="openEvaluation"
        />
        <q-btn
          v-if="showActions"
          flat
          dense
          color="secondary"
          icon="edit"
          @click="$emit('edit', evaluation)"
        />
        <q-btn
          v-if="showActions"
          flat
          dense
          color="negative"
          icon="delete"
          @click="$emit('delete', evaluation.id)"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { Evaluation } from 'src/models/Evaluation';
import { computed } from 'vue';

const props = defineProps<{
  evaluation: Evaluation;
  showActions?: boolean;
}>();

const emit = defineEmits<{
  (e: 'open', evaluation: Evaluation): void;
  (e: 'edit', evaluation: Evaluation): void;
  (e: 'delete', id: string): void;
}>();

const showActions = computed(() => props.showActions === true);
const canOpen = computed(() => Boolean(props.evaluation.url || props.evaluation.fileKey));

function openEvaluation(): void {
  if (!canOpen.value) return;
  emit('open', props.evaluation);
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'EvaluationCard',
});
</script>
