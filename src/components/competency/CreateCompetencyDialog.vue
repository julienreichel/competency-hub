<template>
  <base-dialog
    v-model="open"
    :title="t('competencies.createTitle')"
    :loading="loading"
    :use-form="true"
    :persistent="false"
    @submit="handleSubmit"
    @cancel="handleCancel"
  >
    <competency-details-form
      ref="formRef"
      :model-value="localForm"
      :show-actions="false"
      @save="handleSave"
    />
  </base-dialog>
</template>

<script setup lang="ts">
import BaseDialog from 'src/components/common/BaseDialog.vue';
import CompetencyDetailsForm from 'src/components/competency/CompetencyDetailsForm.vue';
import type { PropType } from 'vue';
import { reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const open = defineModel<boolean>({ default: false });

type FormType = {
  name: string;
  description?: string | null;
  objectives?: string | null;
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

const formRef = ref<{ submit: () => Promise<void> } | null>(null);

watch(
  () => props.form,
  (newForm) => {
    localForm.name = newForm.name || '';
    localForm.description = newForm.description || '';
    localForm.objectives = newForm.objectives || '';
  },
  { deep: true },
);

async function handleSubmit(): Promise<void> {
  await formRef.value?.submit();
}

function handleCancel(): void {
  emit('cancel');
  open.value = false;
}

function handleSave(values: Partial<FormType>): void {
  const payload: FormType = {
    name: values.name?.trim() ?? '',
    description: values.description ?? '',
    objectives: values.objectives ?? '',
  };
  emit('submit', payload);
  open.value = false;
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'CreateCompetencyDialog',
});
</script>
