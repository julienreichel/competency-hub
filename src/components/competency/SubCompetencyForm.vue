<template>
  <q-form ref="formRef" @submit.prevent="submit">
    <div class="row q-col-gutter-md">
      <div class="col-12" :class="{ 'col-md-6': showLevel }">
        <q-input
          v-model="formState.name"
          :label="t('subCompetencies.name')"
          outlined
          :rules="nameRules"
          autofocus
        />
      </div>
      <div v-if="showLevel" class="col-12 col-md-6">
        <q-slider v-model="formState.level" :min="1" :max="10" label-always />
      </div>
      <div v-if="showDescription" class="col-12">
        <q-input
          v-model="formState.description"
          :label="t('subCompetencies.description')"
          type="textarea"
          autogrow
          outlined
        />
      </div>
      <div v-if="showObjectives" class="col-12">
        <q-input
          v-model="formState.objectives"
          :label="t('subCompetencies.objectives')"
          type="textarea"
          autogrow
          outlined
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
import { type CreateSubCompetencyInput } from 'src/models/SubCompetency';
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type SubCompetencyFormModel = Partial<CreateSubCompetencyInput> & { id?: string };

const props = withDefaults(
  defineProps<{
    modelValue: SubCompetencyFormModel;
    showLevel?: boolean;
    showDescription?: boolean;
    showObjectives?: boolean;
    showActions?: boolean;
  }>(),
  {
    showLevel: true,
    showDescription: true,
    showObjectives: true,
    showActions: true,
  },
);

const emit = defineEmits<{
  (e: 'save', value: SubCompetencyFormModel): void;
}>();

const { t } = useI18n();
const $q = useQuasar();

const formRef = ref<QForm | null>(null);
const formState = reactive<SubCompetencyFormModel>({
  id: props.modelValue.id,
  competencyId: props.modelValue.competencyId,
  name: props.modelValue.name ?? '',
  level: props.modelValue.level ?? 1,
  description: props.modelValue.description ?? '',
  objectives: props.modelValue.objectives ?? '',
});

watch(
  () => props.modelValue,
  (value) => {
    formState.id = value.id;
    formState.competencyId = value.competencyId;
    formState.name = value.name ?? '';
    formState.level = value.level ?? 1;
    formState.description = value.description ?? '';
    formState.objectives = value.objectives ?? '';
  },
  { deep: true },
);

const nameRules = [(val: string): string | boolean => !!val?.trim() || t('validation.required')];

const showLevel = computed(() => props.showLevel !== false);
const showDescription = computed(() => props.showDescription !== false);
const showObjectives = computed(() => props.showObjectives !== false);
const showActions = computed(() => props.showActions !== false);

const submit = async (): Promise<void> => {
  const valid = await formRef.value?.validate?.();
  if (!valid) {
    $q.notify({ type: 'negative', message: t('validation.required') });
    return;
  }

  emit('save', {
    id: formState.id,
    competencyId: formState.competencyId,
    name: formState.name?.trim() ?? '',
    level: formState.level ?? 1,
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
  name: 'SubCompetencyForm',
});
</script>
