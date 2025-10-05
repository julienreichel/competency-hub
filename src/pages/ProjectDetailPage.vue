<template>
  <q-page class="q-pa-lg">
    <div v-if="loading" class="row justify-center q-py-xl">
      <q-spinner size="48px" color="primary" />
    </div>

    <div v-else-if="error" class="text-center q-py-xl">
      <q-icon name="error" size="64px" color="negative" class="q-mb-md" />
      <h3 class="text-h6 text-negative q-mb-md">{{ t('projects.detail.errorTitle') }}</h3>
      <p class="text-body2 text-grey-7 q-mb-lg">{{ error }}</p>
    </div>

    <div v-else-if="project" class="project-detail">
      <breadcrumb-header
        :breadcrumbs="projectBreadcrumbs"
        :title="project?.name ?? t('common.loading')"
        :loading="loading"
        :back-target="projectBackTarget"
      >
        <template #default>
          <div class="row q-gutter-sm">
            <q-btn
              v-if="canApprove"
              color="positive"
              icon="check"
              flat
              :label="t('projects.actions.approve')"
              @click="approveProject(project)"
            />
            <q-btn
              v-if="canReject"
              color="negative"
              icon="cancel"
              flat
              :label="t('projects.actions.reject')"
              @click="rejectProject(project)"
            />
            <q-btn
              v-if="canSubmit"
              color="positive"
              icon="send"
              flat
              :label="t('projects.actions.submit')"
              @click="submitProject(project)"
            />
            <q-btn
              v-if="canDelete"
              color="negative"
              icon="delete"
              flat
              :label="t('common.delete')"
              @click="confirmDelete"
            />
          </div>
        </template>
      </breadcrumb-header>

      <div class="column q-gutter-md">
        <project-card
          v-if="!editing"
          :project="project"
          :show-edit="canEdit"
          :show-download="Boolean(project.fileKey)"
          @edit="enterEditMode"
          @submit="submitProject"
          @approve="approveProject"
          @reject="rejectProject"
          @delete="confirmDelete"
          @download="downloadFile"
        />

        <transition name="fade">
          <q-card v-if="editing" flat bordered>
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ t('projects.form.editTitle') }}</div>
              <project-form
                v-model="formValues"
                form-id="project-detail-form"
                :loading="actionLoading"
                :show-status="isEducatorOrAdmin"
                @submit="saveEdits"
                @update:valid="onFormValidChange"
              />
              <div class="row justify-end q-gutter-sm q-mt-md">
                <q-btn
                  flat
                  :label="t('common.cancel')"
                  color="primary"
                  :disable="actionLoading"
                  @click="cancelEditing"
                />
                <q-btn
                  color="primary"
                  :label="t('common.save')"
                  type="submit"
                  form="project-detail-form"
                  :loading="actionLoading"
                  :disable="!formValid || actionLoading"
                />
              </div>
            </q-card-section>
          </q-card>
        </transition>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import BreadcrumbHeader from 'src/components/common/BreadcrumbHeader.vue';
import ProjectCard from 'src/components/project/ProjectCard.vue';
import ProjectForm, { type ProjectFormValues } from 'src/components/project/ProjectForm.vue';
import { useAuth } from 'src/composables/useAuth';
import { type Project, type ProjectStatus } from 'src/models/Project';
import { ProjectRepository } from 'src/models/repositories/ProjectRepository';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { userId, hasAnyRole } = useAuth();
const $q = useQuasar();

const project = ref<Project | null>(null);
const loading = ref(false);
const actionLoading = ref(false);
const error = ref<string | null>(null);
const editing = ref(false);
const formValues = ref<ProjectFormValues>({
  name: '',
  description: '',
  subCompetencyId: '',
  status: 'Draft',
  fileKey: null,
});
const formValid = ref(false);

const projectRepository = new ProjectRepository();

const projectId = computed(() => route.params.projectId as string);
const isEducatorOrAdmin = computed(() => hasAnyRole(['Educator', 'Admin']));
const projectBackTarget = computed(() =>
  hasAnyRole(['Educator']) ? { name: 'educator-projects' } : { name: 'my-projects' },
);
const projectBreadcrumbs = computed(() => [
  {
    label: hasAnyRole(['Educator']) ? t('projects.title') : t('projects.myProjects'),
    to: projectBackTarget.value,
  },
  { label: project.value?.name ?? t('common.loading') },
]);

const canEdit = computed(() => {
  if (!project.value) return false;
  const editableStatuses: ProjectStatus[] = ['Draft', 'Rejected'];
  if (!editableStatuses.includes(project.value.status)) return false;
  if (project.value.studentId === userId.value) return true;
  return isEducatorOrAdmin.value;
});

const canSubmit = computed(() => {
  if (!project.value) return false;
  if (project.value.studentId !== userId.value) return false;
  if (!project.value.fileKey) return false;
  return ['Draft', 'Rejected'].includes(project.value.status);
});

const canApprove = computed(() => {
  if (!project.value) return false;
  if (!isEducatorOrAdmin.value) return false;
  return project.value.status === 'Submitted';
});

const canReject = computed(() => {
  if (!project.value) return false;
  if (!isEducatorOrAdmin.value) return false;
  return project.value.status === 'Submitted';
});

const canDelete = computed(() => {
  if (!project.value) return false;
  if (project.value.studentId !== userId.value) return false;
  return ['Draft', 'Rejected'].includes(project.value.status);
});

const toFormValues = (source: Project): ProjectFormValues => ({
  name: source.name,
  description: source.description ?? '',
  subCompetencyId: source.subCompetencyId,
  status: source.status,
  fileKey: source.fileKey ?? null,
});

const loadProject = async (): Promise<void> => {
  loading.value = true;
  error.value = null;

  try {
    const result = await projectRepository.findById(projectId.value);
    if (!result) {
      error.value = t('projects.detail.notFound');
      return;
    }
    project.value = result;
    formValues.value = toFormValues(result);
    if (!result.fileKey) {
      editing.value = true;
    }
  } catch (err) {
    console.error('Failed to load project:', err);
    error.value = t('projects.detail.loadError');
  } finally {
    loading.value = false;
  }
};

const enterEditMode = (): void => {
  if (!project.value) return;
  formValues.value = toFormValues(project.value);
  editing.value = true;
};

const cancelEditing = (): void => {
  if (!project.value) return;
  formValues.value = toFormValues(project.value);
  editing.value = false;
};

const onFormValidChange = (valid: boolean): void => {
  formValid.value = valid;
};

const saveEdits = async (): Promise<void> => {
  if (!project.value || !formValid.value) return;

  actionLoading.value = true;
  try {
    const updatedProject = await projectRepository.update(project.value.id, {
      name: formValues.value.name.trim(),
      description: formValues.value.description.trim() || null,
      subCompetencyId: formValues.value.subCompetencyId,
      status: formValues.value.status,
      fileKey: formValues.value.fileKey,
    });
    project.value = updatedProject;
    formValues.value = toFormValues(updatedProject);
    editing.value = false;
  } catch (err) {
    console.error('Failed to update project:', err);
  } finally {
    actionLoading.value = false;
  }
};

const submitProject = async (target?: Project): Promise<void> => {
  const currentProject = target ?? project.value;
  if (!currentProject) return;
  if (currentProject.id !== project.value?.id || !canSubmit.value) return;

  actionLoading.value = true;
  try {
    const updatedProject = await projectRepository.update(currentProject.id, {
      status: 'Submitted',
    });
    project.value = updatedProject;
    formValues.value = toFormValues(updatedProject);
  } catch (err) {
    console.error('Failed to submit project:', err);
  } finally {
    actionLoading.value = false;
  }
};

const approveProject = async (target?: Project): Promise<void> => {
  const currentProject = target ?? project.value;
  if (!currentProject) return;
  if (currentProject.id !== project.value?.id || !canApprove.value) return;

  actionLoading.value = true;
  try {
    const updatedProject = await projectRepository.update(currentProject.id, {
      status: 'Approved',
    });
    project.value = updatedProject;
    formValues.value = toFormValues(updatedProject);
  } catch (err) {
    console.error('Failed to approve project:', err);
  } finally {
    actionLoading.value = false;
  }
};

const rejectProject = async (target?: Project): Promise<void> => {
  const currentProject = target ?? project.value;
  if (!currentProject) return;
  if (currentProject.id !== project.value?.id || !canReject.value) return;

  actionLoading.value = true;
  try {
    const updatedProject = await projectRepository.update(currentProject.id, {
      status: 'Rejected',
    });
    project.value = updatedProject;
    formValues.value = toFormValues(updatedProject);
  } catch (err) {
    console.error('Failed to reject project:', err);
  } finally {
    actionLoading.value = false;
  }
};

const deleteProject = async (): Promise<void> => {
  if (!project.value || !canDelete.value) return;

  actionLoading.value = true;
  try {
    await projectRepository.delete(project.value.id);
    await router.push(projectBackTarget.value);
  } catch (err) {
    console.error('Failed to delete project:', err);
  } finally {
    actionLoading.value = false;
  }
};

const confirmDelete = (): void => {
  if (!project.value || !canDelete.value) return;

  $q.dialog({
    title: t('projects.delete.confirmTitle'),
    message: t('projects.delete.confirmMessage', { name: project.value.name }),
    cancel: { flat: true, label: t('common.cancel') },
    ok: { color: 'negative', label: t('common.delete') },
    persistent: true,
  })
    .onOk(() => {
      void deleteProject();
    })
    .onDismiss(() => {
      /* no-op */
    });
};

const downloadFile = async (target?: Project): Promise<void> => {
  const currentProject = target ?? project.value;
  if (!currentProject?.fileKey) {
    return;
  }

  try {
    const url = await currentProject.resolveFileUrl();
    if (url) {
      window.open(url, '_blank', 'noopener');
    }
  } catch (err) {
    console.error('Error downloading project file:', err);
  }
};

onMounted(async () => {
  await loadProject();
});
</script>

<style scoped>
.project-detail {
  max-width: 1200px;
  margin: 0 auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
