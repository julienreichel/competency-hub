<template>
  <q-form :id="formId" ref="formRef" class="q-gutter-md" @submit.prevent="handleSubmit">
    <q-select
      v-model="formState.subCompetencyId"
      :options="subCompetencyOptions"
      :label="t('projects.form.subCompetency')"
      :rules="subCompetencyRules"
      option-value="value"
      option-label="label"
      emit-value
      map-options
      outlined
      required
      :loading="loadingSubCompetencies"
      :disable="loading"
    >
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey">
            {{ t('projects.form.noSubCompetencies') }}
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <q-input
      v-model="formState.name"
      :label="t('projects.form.name')"
      outlined
      required
      :disable="loading"
      autofocus
    />

    <q-input
      v-model="formState.description"
      :label="t('projects.form.description')"
      type="textarea"
      rows="3"
      outlined
      :disable="loading"
    />

    <file-uploader-field
      v-model="formState.fileKey"
      :label="t('projects.form.uploadFile')"
      :sub-competency-id="formState.subCompetencyId"
      :accept="'.pdf,.doc,.docx,.txt,.zip'"
      :disable="loading"
    />

    <div v-if="showStatus" class="q-mb-md">
      <label>{{ t('projects.form.status') }}</label>
      <q-option-group
        v-model="formState.status"
        :options="statusOptions"
        inline
        :disable="loading"
      />
    </div>

    <slot />
  </q-form>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import FileUploaderField from 'src/components/common/FileUploaderField.vue';
import { type ProjectStatus } from 'src/models/Project';
import { SubCompetencyRepository } from 'src/models/repositories/SubCompetencyRepository';
import { type SubCompetency } from 'src/models/SubCompetency';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

export interface ProjectFormValues {
  name: string;
  description: string;
  subCompetencyId: string;
  status: ProjectStatus;
  fileKey: string | null;
}

const defaultForm = (): ProjectFormValues => ({
  name: '',
  description: '',
  subCompetencyId: '',
  status: 'Draft',
  fileKey: null,
});

const props = withDefaults(
  defineProps<{
    modelValue: ProjectFormValues;
    loading?: boolean;
    showStatus?: boolean;
    formId?: string;
  }>(),
  {
    loading: false,
    showStatus: false,
    formId: 'project-form',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: ProjectFormValues): void;
  (e: 'update:valid', value: boolean): void;
  (e: 'submit', value: ProjectFormValues): void;
}>();

const { t } = useI18n();
const $q = useQuasar();

const formRef = ref();
const loadingSubCompetencies = ref(false);
const subCompetencies = ref<SubCompetency[]>([]);
const formState = ref<ProjectFormValues>({ ...defaultForm(), ...props.modelValue });

const subCompetencyRepository = new SubCompetencyRepository();

const subCompetencyOptions = computed(() =>
  subCompetencies.value.map((sc) => ({
    label: sc.name,
    value: sc.id,
  })),
);

const statusOptions = computed(() => [
  { label: t('projects.status.draft'), value: 'Draft' },
  { label: t('projects.status.submitted'), value: 'Submitted' },
  { label: t('projects.status.approved'), value: 'Approved' },
  { label: t('projects.status.rejected'), value: 'Rejected' },
]);

const subCompetencyRules = [(val: string): string | boolean => !!val || t('validation.required')];

const showStatus = computed(() => props.showStatus);

const isValid = (value: ProjectFormValues): boolean =>
  value.name.trim().length > 0 && value.subCompetencyId.trim().length > 0;

const syncValidity = (value: ProjectFormValues): void => {
  emit('update:valid', isValid(value));
};

watch(
  () => props.modelValue,
  (value) => {
    const normalized = { ...defaultForm(), ...(value ?? defaultForm()) };
    if (JSON.stringify(formState.value) !== JSON.stringify(normalized)) {
      formState.value = normalized;
    }
  },
  { deep: true },
);

watch(
  formState,
  (value) => {
    emit('update:modelValue', { ...value });
    syncValidity(value);
  },
  { deep: true, immediate: true },
);

const loadSubCompetencies = async (): Promise<void> => {
  loadingSubCompetencies.value = true;
  try {
    subCompetencies.value = await subCompetencyRepository.findAll();
  } catch (error) {
    console.error('Failed to load sub-competencies:', error);
    $q.notify({
      type: 'negative',
      message: t('projects.form.errorLoadingSubCompetencies'),
    });
  } finally {
    loadingSubCompetencies.value = false;
  }
};

const handleSubmit = (): void => {
  emit('submit', { ...formState.value });
};

onMounted(async () => {
  await loadSubCompetencies();
});

defineExpose({
  validate: (): boolean => isValid(formState.value),
  submit: handleSubmit,
  formRef,
});
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ProjectForm',
});
</script>
