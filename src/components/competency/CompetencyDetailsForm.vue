<template>
  <q-form ref="formRef" @submit.prevent="submit">
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-input
          v-model="formState.name"
          :label="t('competencies.fields.name')"
          outlined
          :rules="nameRules"
          autofocus
        />
      </div>
      <div class="col-12">
        <q-input
          v-model="formState.description"
          type="textarea"
          autogrow
          outlined
          :label="t('competencies.fields.description')"
        />
      </div>
      <div class="col-12">
        <q-input
          v-model="formState.objectives"
          type="textarea"
          autogrow
          outlined
          :label="t('competencies.fields.objectives')"
        />
      </div>
    </div>

    <div v-if="showActions" class="q-mt-md">
      <q-btn color="primary" :label="t('common.save')" type="submit" />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { useQuasar, type QForm } from 'quasar';
import { type CreateCompetencyInput } from 'src/models/Competency';
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type CompetencyFormModel = Partial<CreateCompetencyInput>;

const props = withDefaults(
  defineProps<{
    modelValue: CompetencyFormModel;
    showActions?: boolean;
  }>(),
  {
    showActions: true,
  },
);

const emit = defineEmits<{
  (e: 'save', value: CompetencyFormModel): void;
}>();

const { t } = useI18n();
const $q = useQuasar();

const formRef = ref<QForm | null>(null);
const formState = reactive<CompetencyFormModel>({
  id: props.modelValue.id,
  domainId: props.modelValue.domainId,
  name: props.modelValue.name ?? '',
  description: props.modelValue.description ?? '',
  objectives: props.modelValue.objectives ?? '',
});

watch(
  () => props.modelValue,
  (value) => {
    formState.id = value.id;
    formState.domainId = value.domainId;
    formState.name = value.name ?? '';
    formState.description = value.description ?? '';
    formState.objectives = value.objectives ?? '';
  },
  { deep: true },
);

const nameRules = [(val: string): string | boolean => !!val?.trim() || t('validation.required')];

const showActions = computed(() => props.showActions !== false);

const submit = async (): Promise<void> => {
  const valid = await formRef.value?.validate?.();
  if (!valid) {
    $q.notify({ type: 'negative', message: t('validation.required') });
    return;
  }

  emit('save', {
    id: formState.id,
    domainId: formState.domainId,
    name: formState.name?.trim() ?? '',
    description: formState.description ?? '',
    objectives: formState.objectives ?? '',
  });
};

defineExpose({
  submit,
});
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CompetencyDetailsForm',
});
</script>
