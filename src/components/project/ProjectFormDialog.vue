<template>
  <base-dialog
    v-model="isVisible"
    :title="dialogTitle"
    icon="assignment"
    size="md"
    use-form
    form-id="project-form"
    :loading="loading"
    :primary-label="$t('common.save')"
    @submit="handleSubmit"
    @cancel="handleCancel"
  >
    <project-form
      ref="projectFormRef"
      v-model="form"
      :loading="loading"
      :show-status="Boolean(project?.id) && isEducatorOrAdmin"
      @submit="handleSubmit"
      @update:valid="onValidationChange"
    />
  </base-dialog>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import BaseDialog from 'src/components/common/BaseDialog.vue';
import { useAuth } from 'src/composables/useAuth';
import { type Project } from 'src/models/Project';
import { ProjectRepository } from 'src/models/repositories/ProjectRepository';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ProjectForm, { type ProjectFormValues } from './ProjectForm.vue';

// Props
interface Props {
  modelValue: boolean;
  project?: Project | null;
}

const props = withDefaults(defineProps<Props>(), {
  project: null,
});

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved', project: Project): void;
}

const emit = defineEmits<Emits>();

// Composables
const { t } = useI18n();
const $q = useQuasar();
const { userId, hasAnyRole } = useAuth();

const projectRepository = new ProjectRepository();

const loading = ref(false);
const form = ref<ProjectFormValues>({
  name: '',
  description: '',
  subCompetencyId: '',
  status: 'Draft',
  fileKey: null,
});
const isFormValid = ref(false);
type ProjectFormExpose = {
  validate: () => Promise<boolean>;
  submit: () => Promise<void>;
};

const projectFormRef = ref<ProjectFormExpose | null>(null);

// Computed
const isVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const isEditing = computed(() => !!props.project?.id);

const dialogTitle = computed(() =>
  isEditing.value ? t('projects.form.editTitle') : t('projects.form.createTitle'),
);

const isEducatorOrAdmin = computed(() => hasAnyRole(['Educator', 'Admin']));

// Methods
const resetForm = (): void => {
  form.value = {
    name: '',
    description: '',
    subCompetencyId: '',
    status: 'Draft',
    fileKey: null,
  };
};

const populateForm = (project: Project): void => {
  form.value = {
    name: project.name,
    description: project.description || '',
    subCompetencyId: project.subCompetencyId,
    status: project.status,
    fileKey: project.fileKey || null,
  };
};

const handleSubmit = async (): Promise<void> => {
  if (!userId.value) return;

  const validationResult = (await projectFormRef.value?.validate?.()) ?? isFormValid.value;
  if (!validationResult) {
    return;
  }

  loading.value = true;
  try {
    let savedProject: Project;

    if (isEditing.value && props.project) {
      // Update existing project
      savedProject = await projectRepository.update(props.project.id, {
        name: form.value.name.trim(),
        description: form.value.description.trim() || null,
        subCompetencyId: form.value.subCompetencyId,
        status: form.value.status,
        fileKey: form.value.fileKey,
      });
    } else {
      // Create new project
      savedProject = await projectRepository.create({
        studentId: userId.value,
        name: form.value.name.trim(),
        description: form.value.description.trim() || null,
        subCompetencyId: form.value.subCompetencyId,
        status: form.value.status,
        fileKey: form.value.fileKey,
      });
    }

    $q.notify({
      type: 'positive',
      message: isEditing.value
        ? t('projects.form.updateSuccess')
        : t('projects.form.createSuccess'),
    });

    emit('saved', savedProject);
    isVisible.value = false;
  } catch (error) {
    console.error('Failed to save project:', error);
    $q.notify({
      type: 'negative',
      message: isEditing.value ? t('projects.form.updateError') : t('projects.form.createError'),
    });
  } finally {
    loading.value = false;
  }
};

const handleCancel = (): void => {
  if (!isEditing.value) {
    resetForm();
  }
  isVisible.value = false;
};

const onValidationChange = (valid: boolean): void => {
  isFormValid.value = valid;
};

// Watchers
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      if (props.project) {
        populateForm(props.project);
      } else {
        resetForm();
      }
    }
  },
);
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ProjectFormDialog',
});
</script>
