<template>
  <div class="message-composer">
    <q-input
      v-model="draft"
      type="textarea"
      autogrow
      outlined
      dense
      :disable="disabled"
      :placeholder="t('messaging.composer.placeholder')"
    />
    <div class="row justify-end q-mt-sm">
      <q-btn
        color="primary"
        icon="send"
        :label="t('messaging.composer.send')"
        :disable="disabled || !draft.trim().length"
        @click="submit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'send', body: string): void;
}>();

const { t } = useI18n();

const draft = ref('');

function reset(): void {
  draft.value = '';
}

function submit(): void {
  if (!draft.value.trim().length) {
    return;
  }
  emit('send', draft.value.trim());
  reset();
}

defineExpose({ reset });
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MessageComposer',
});
</script>

<style scoped>
.message-composer {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-top: 16px;
}
</style>
