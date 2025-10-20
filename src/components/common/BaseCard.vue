<template>
  <q-card
    flat
    bordered
    :class="['base-card', cardClass, { 'cursor-pointer': clickableCard }]"
    :style="cardStyle"
    @click="handleCardClick"
  >
    <q-card-section :class="['row items-start justify-between q-gutter-sm', sectionClass]">
      <div :class="['column col q-gutter-xs', contentClass]">
        <slot />
      </div>

      <div v-if="showRightColumn" class="column items-end col-auto q-gutter-sm">
        <slot name="aside" />

        <div class="row q-gutter-xs justify-end">
          <slot name="actions-before" />

          <template v-if="hasActionsSlot">
            <slot
              name="actions"
              :emit-open="emitOpen"
              :emit-edit="emitEdit"
              :emit-delete="emitDelete"
            />
          </template>
          <template v-else>
            <q-btn
              v-if="showOpenAction"
              flat
              :dense="denseActions"
              :round="!openLabelText"
              :color="openColor"
              :icon="openIcon"
              @click.stop="emitOpen()"
            >
              <template v-if="openLabelText">{{ openLabelText }}</template>
            </q-btn>
            <q-btn
              v-if="showEditAction"
              flat
              :dense="denseActions"
              :round="!editLabelText"
              :color="editColor"
              :icon="editIcon"
              @click.stop="emitEdit()"
            >
              <template v-if="editLabelText">{{ editLabelText }}</template>
            </q-btn>
            <q-btn
              v-if="showDeleteAction"
              flat
              :dense="denseActions"
              :round="!deleteLabelText"
              :color="deleteColor"
              :icon="deleteIcon"
              @click.stop="emitDelete()"
            >
              <template v-if="deleteLabelText">{{ deleteLabelText }}</template>
            </q-btn>
          </template>

          <slot name="actions-after" />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';

const props = withDefaults(
  defineProps<{
    clickable?: boolean;
    showOpenAction?: boolean;
    showEditAction?: boolean;
    showDeleteAction?: boolean;
    openIcon?: string;
    editIcon?: string;
    deleteIcon?: string;
    openLabel?: string | null;
    editLabel?: string | null;
    deleteLabel?: string | null;
    openColor?: string;
    editColor?: string;
    deleteColor?: string;
    denseActions?: boolean;
    cardClass?: string | Record<string, boolean> | string[];
    contentClass?: string | Record<string, boolean> | string[];
    sectionClass?: string | Record<string, boolean> | string[];
    backgroundColor?: string | null;
  }>(),
  {
    clickable: false,
    showOpenAction: false,
    showEditAction: false,
    showDeleteAction: false,
    openIcon: 'arrow_forward',
    editIcon: 'edit',
    deleteIcon: 'delete',
    openLabel: null,
    editLabel: null,
    deleteLabel: null,
    openColor: 'primary',
    editColor: 'secondary',
    deleteColor: 'negative',
    denseActions: true,
    cardClass: '',
    contentClass: '',
    sectionClass: '',
    backgroundColor: null,
  },
);

const emit = defineEmits<{
  (e: 'card-click'): void;
  (e: 'open'): void;
  (e: 'edit'): void;
  (e: 'delete'): void;
}>();

const slots = useSlots();
const computedOpenLabel = computed(() => props.openLabel ?? '');
const computedEditLabel = computed(() => props.editLabel ?? '');
const computedDeleteLabel = computed(() => props.deleteLabel ?? '');

const hasAsideSlot = computed(() => Boolean(slots.aside));
const hasActionsBefore = computed(() => Boolean(slots['actions-before']));
const hasActionsAfter = computed(() => Boolean(slots['actions-after']));
const hasActionsSlot = computed(() => Boolean(slots.actions));

const showAnyBaseAction = computed(
  () => props.showOpenAction || props.showEditAction || props.showDeleteAction,
);

const showRightColumn = computed(
  () =>
    hasAsideSlot.value ||
    hasActionsBefore.value ||
    hasActionsAfter.value ||
    hasActionsSlot.value ||
    showAnyBaseAction.value,
);

const clickableCard = computed(() => props.clickable || props.showOpenAction);

const openLabelText = computed(() => computedOpenLabel.value);
const editLabelText = computed(() => computedEditLabel.value || '');
const deleteLabelText = computed(() => computedDeleteLabel.value || '');

const cardStyle = computed(() =>
  props.backgroundColor ? { backgroundColor: props.backgroundColor + '20' } : undefined,
);

function handleCardClick(): void {
  if (!clickableCard.value) return;
  emit('card-click');
}

function emitOpen(): void {
  emit('open');
}

function emitEdit(): void {
  emit('edit');
}

function emitDelete(): void {
  emit('delete');
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BaseCard',
});
</script>

<style>
.base-card.cursor-pointer:hover {
  border-color: var(--q-primary);
}
</style>
