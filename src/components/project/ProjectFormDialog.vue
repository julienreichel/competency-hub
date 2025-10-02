<template>
  <base-dialog
    v-model="isVisible"
    :title="dialogTitle"
    icon="assignment"
    size="md"
    use-form
    form-id="project-form"
    :loading="loading"
    :disable-primary="!isFormValid"
    :primary-label="$t('common.save')"
    @submit="handleSubmit"
    @cancel="handleCancel"
  >
    <q-form id="project-form" class="q-gutter-md" @submit="handleSubmit">
      <!-- Project Name -->
      <q-input
        v-model="form.name"
        :label="$t('projects.form.name')"
        outlined
        required
        :disable="loading"
        autofocus
      />

      <!-- Description -->
      <q-input
        v-model="form.description"
        :label="$t('projects.form.description')"
        type="textarea"
        rows="3"
        outlined
        :disable="loading"
      />

      <!-- Sub-Competency Selection -->
      <q-select
        v-model="form.subCompetencyId"
        :options="subCompetencyOptions"
        :label="$t('projects.form.subCompetency')"
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
              {{ $t('projects.form.noSubCompetencies') }}
            </q-item-section>
          </q-item>
        </template>
      </q-select>

      <!-- File Upload -->
      <file-uploader-field
        v-model="form.fileKey"
        :label="$t('projects.form.uploadFile')"
        :sub-competency-id="form.subCompetencyId"
        :accept="'.pdf,.doc,.docx,.txt,.zip'"
        :disable="loading"
      />

      <!-- Status (for editing existing projects) -->
      <div v-if="project?.id && isEducatorOrAdmin" class="q-mb-md">
        <label>{{ $t('projects.form.status') }}</label>
        <q-option-group v-model="form.status" :options="statusOptions" inline :disable="loading" />
      </div>
    </q-form>
  </base-dialog>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import FileUploaderField from 'src/components/common/FileUploaderField.vue';
import BaseDialog from 'src/components/ui/BaseDialog.vue';
import { useAuth } from 'src/composables/useAuth';
import { type Project, type ProjectStatus } from 'src/models/Project';
import { ProjectRepository } from 'src/models/repositories/ProjectRepository';
import { SubCompetencyRepository } from 'src/models/repositories/SubCompetencyRepository';
import { type SubCompetency } from 'src/models/SubCompetency';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

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

// Repositories
const projectRepository = new ProjectRepository();
const subCompetencyRepository = new SubCompetencyRepository();

// State
const loading = ref(false);
const loadingSubCompetencies = ref(false);
const subCompetencies = ref<SubCompetency[]>([]);

// Form data
const form = ref({
  name: '',
  description: '',
  subCompetencyId: '',
  status: 'Draft' as ProjectStatus,
  fileKey: null as string | null,
});

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

const isFormValid = computed(() => {
  return form.value.name.trim() !== '' && form.value.subCompetencyId !== '';
});

const subCompetencyRules = [(val: string): string | boolean => !!val || t('validation.required')];

// Methods
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
  if (!userId.value || !isFormValid.value) return;

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

// Lifecycle
onMounted(async () => {
  await loadSubCompetencies();
});
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ProjectFormDialog',
});
</script>

<style scoped>
.q-form {
  min-width: 300px;
}
</style>
