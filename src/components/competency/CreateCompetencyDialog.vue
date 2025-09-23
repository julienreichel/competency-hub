<template>
  <base-dialog
    v-model="open"
    :title="t('competencies.createTitle')"
    :loading="loading"
    @submit="handleSubmit"
    @cancel="handleCancel"
    :use-form="true"
    :persistent="false"
  >
    <q-input
      v-model="localForm.name"
      :label="t('competencies.fields.name')"
      :rules="[requiredRule]"
      autofocus
    />
    <q-input
      v-model="localForm.description"
      type="textarea"
      :label="t('competencies.fields.description')"
    />
    <q-input
      v-model="localForm.objectives"
      type="textarea"
      :label="t('competencies.fields.objectives')"
    />
  </base-dialog>
</template>

<script setup lang="ts">
import BaseDialog from 'src/components/ui/BaseDialog.vue';
import type { PropType } from 'vue';
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const open = defineModel<boolean>({ default: false });

type FormType = {
  name: string;
  description?: string;
  objectives?: string;
};

const props = defineProps({
  form: {
    type: Object as PropType<FormType>,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: 'submit', form: FormType): void;
  (e: 'cancel'): void;
}>();

const { t } = useI18n();

// Local copy to avoid mutating prop
const localForm = reactive({
  name: props.form.name || '',
  description: props.form.description || '',
  objectives: props.form.objectives || '',
});

watch(
  () => props.form,
  (newForm) => {
    localForm.name = newForm.name || '';
    localForm.description = newForm.description || '';
    localForm.objectives = newForm.objectives || '';
  },
  { deep: true },
);

const requiredRule = (value: string): true | string =>
  value?.trim() ? true : t('validation.required');

function handleSubmit(): void {
  emit('submit', { ...localForm });
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
  name: 'CreateCompetencyDialog',
});
</script>
