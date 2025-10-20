<template>
  <base-dialog
    v-model="open"
    :title="t('competencies.newSubCompetency')"
    :use-form="true"
    :persistent="false"
    @submit="handleSubmit"
    @cancel="handleCancel"
  >
    <sub-competency-form
      ref="formRef"
      :model-value="formModel"
      :show-level="false"
      :show-actions="false"
      @save="handleSave"
    />
  </base-dialog>
</template>

<script setup lang="ts">
import BaseDialog from 'src/components/common/BaseDialog.vue';
import SubCompetencyForm from 'src/components/competency/SubCompetencyForm.vue';
import { type CreateSubCompetencyInput } from 'src/models/SubCompetency';
import { reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type SubCompetencyFormModel = Partial<CreateSubCompetencyInput>;
const open = defineModel<boolean>({ default: false });

const emit = defineEmits<{
  (e: 'submit', value: SubCompetencyFormModel & { name: string }): void;
  (e: 'cancel'): void;
}>();

const { t } = useI18n();

const formRef = ref<{ submit: () => Promise<void> } | null>(null);
const formModel = reactive<{ name?: string }>({ name: '' });

watch(open, (value) => {
  if (value) {
    formModel.name = '';
  }
});

async function handleSubmit(): Promise<void> {
  await formRef.value?.submit();
}

function handleSave(payload: SubCompetencyFormModel): void {
  const name = payload.name?.trim();
  if (!name) {
    return;
  }
  const { description, objectives } = payload;
  emit('submit', { name, description, objectives });
  formModel.name = '';
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
  name: 'CreateSubCompetencyDialog',
});
</script>
