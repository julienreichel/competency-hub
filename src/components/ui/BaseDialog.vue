<template>
  <q-dialog
    v-model="open"
    :persistent="persistent"
    :seamless="seamless"
    :maximized="maximized"
    transition-show="jump-down"
    transition-hide="jump-up"
    @hide="onHide"
  >
    <q-card :style="cardStyle" class="q-pa-none">
      <!-- Header -->
      <q-card-section class="row items-center q-gutter-sm">
        <div class="col-auto" v-if="icon">
          <q-icon :name="icon" />
        </div>
        <div class="col text-h6">
          <slot name="title">
            {{ title }}
          </slot>
        </div>
        <div class="col-auto">
          <slot name="title-right" />
        </div>
        <q-btn
          v-if="showClose"
          dense
          flat
          round
          icon="close"
          :aria-label="cancelLabel || t('common.cancel')"
          @click="onCancel"
          data-testid="dialog-close"
        />
      </q-card-section>

      <q-separator />

      <!-- Body (optionally a form wrapper) -->
      <component
        :is="useForm ? 'form' : 'div'"
        :id="formId || undefined"
        @submit.prevent="emitSubmit"
      >
        <q-card-section :class="bodyClass">
          <slot />
        </q-card-section>

        <!-- Footer / actions -->
        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <slot name="actions">
            <q-btn
              flat
              :label="cancelLabel || t('common.cancel')"
              @click="onCancel"
              :disable="loading || disableCancel"
              data-testid="dialog-cancel"
            />
            <q-btn
              :label="primaryLabel || t('common.save')"
              :color="primaryColor"
              :type="useForm ? 'submit' : 'button'"
              :form="useForm ? formId || undefined : undefined"
              @click="!useForm && emitSubmit()"
              :loading="loading"
              :disable="disablePrimary"
              data-testid="dialog-primary"
            />
          </slot>
        </q-card-actions>
      </component>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const open = defineModel<boolean>({ default: false });

const props = defineProps({
  title: { type: String, default: '' },
  icon: { type: String, default: '' },

  // Sizing
  size: { type: String as () => 'sm' | 'md' | 'lg' | 'xl', default: 'md' },
  maxWidthPx: { type: Number, default: 0 }, // override preset

  // Behavior
  persistent: { type: Boolean, default: false },
  seamless: { type: Boolean, default: false },
  maximized: { type: Boolean, default: false },
  showClose: { type: Boolean, default: true },

  // Form behavior
  useForm: { type: Boolean, default: true },
  formId: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  disablePrimary: { type: Boolean, default: false },
  disableCancel: { type: Boolean, default: false },
  primaryColor: { type: String, default: 'primary' },

  // Labels (i18n keys)
  primaryLabel: { type: String, default: '' },
  cancelLabel: { type: String, default: '' },

  // Style hooks
  bodyClass: { type: String, default: '' },
});

const emit = defineEmits<{
  (e: 'submit'): void; // primary action
  (e: 'cancel'): void; // cancel action
  (e: 'closed'): void; // after dialog fully hides
}>();

useI18n(); // ensures $t is available

const SIZE_TO_WIDTH: Record<'sm' | 'md' | 'lg' | 'xl', number> = {
  sm: 420,
  md: 600,
  lg: 820,
  xl: 1040,
};

const cardStyle = computed(() => {
  const px = props.maxWidthPx > 0 ? props.maxWidthPx : SIZE_TO_WIDTH[props.size];
  return `max-width:${px}px;width:100%`;
});

function emitSubmit(): void {
  if (props.loading || props.disablePrimary) return;
  emit('submit');
}
function onCancel(): void {
  if (props.loading || props.disableCancel) return;
  open.value = false;
  emit('cancel');
}
function onHide(): void {
  emit('closed');
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BaseDialog',
});
</script>
