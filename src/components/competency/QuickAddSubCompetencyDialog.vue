<template>
  <base-dialog
    v-model="open"
    :title="t('competencies.newSubCompetency')"
    @submit="handleSubmit"
    @cancel="handleCancel"
    :use-form="true"
    :persistent="false"
  >
    <q-input
      v-model="addName"
      :label="t('competencies.name')"
      autofocus
      @keyup.enter="handleSubmit"
    />
  </base-dialog>
</template>

<script setup lang="ts">
import BaseDialog from 'src/components/ui/BaseDialog.vue';
import { useI18n } from 'vue-i18n';

const open = defineModel<boolean>({ default: false });
const addName = defineModel<string>('addName');

const emit = defineEmits<{
  (e: 'submit', name: string): void;
  (e: 'cancel'): void;
}>();

const { t } = useI18n();

function handleSubmit(): void {
  if (!addName.value?.trim()) return;
  emit('submit', addName.value.trim());
  open.value = false;
}

function handleCancel(): void {
  emit('cancel');
  open.value = false;
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'QuickAddSubCompetencyDialog',
});
</script>
