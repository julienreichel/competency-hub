<template>
  <q-page class="q-pa-md">
    <!-- Loading State -->
    <div v-if="loading" class="row justify-center q-py-xl">
      <q-spinner size="48px" color="primary" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center q-py-xl">
      <q-icon name="error" size="64px" color="negative" class="q-mb-md" />
      <h3 class="text-h6 text-negative q-mb-md">{{ $t('projects.detail.errorTitle') }}</h3>
      <p class="text-body2 text-grey-7 q-mb-lg">{{ error }}</p>
    </div>

    <!-- Project Detail -->
    <div v-else-if="project" class="project-detail">
      <!-- Header -->
      <div class="row items-center justify-between q-mb-lg">
        <div class="col">
          <div class="row items-center q-mb-sm">
            <h1 class="text-h4 q-ma-none">{{ project.name }}</h1>
            <q-chip
              :color="getStatusColor(project.status)"
              :label="$t(`projects.status.${project.status.toLowerCase()}`)"
              class="q-ml-md"
            />
          </div>
          <div class="text-subtitle1 text-grey-7">
            {{ $t('projects.detail.subCompetency') }}:
            {{ project.subCompetency?.name || $t('common.loading') }}
          </div>
        </div>

        <!-- Actions -->
        <div class="col-auto">
          <q-btn-group v-if="availableActions.length > 0" flat>
            <!-- Edit Button -->
            <q-btn
              v-if="canEdit"
              color="primary"
              :label="$t('common.edit')"
              icon="edit"
              @click="editProject"
              :loading="actionLoading"
              flat
            />

            <!-- Submit Button (Student only) -->
            <q-btn
              v-if="canSubmit"
              color="positive"
              :label="$t('projects.actions.submit')"
              icon="send"
              @click="submitProject"
              :loading="actionLoading"
              flat
            />

            <!-- Approve Button (Educator only) -->
            <q-btn
              v-if="canApprove"
              color="positive"
              :label="$t('projects.actions.approve')"
              icon="check_circle"
              @click="approveProject"
              :loading="actionLoading"
              flat
            />

            <!-- Reject Button (Educator only) -->
            <q-btn
              v-if="canReject"
              color="negative"
              :label="$t('projects.actions.reject')"
              icon="cancel"
              @click="rejectProject"
              :loading="actionLoading"
              flat
            />

            <!-- Delete Button (Student only) -->
            <q-btn
              v-if="canDelete"
              color="negative"
              :label="$t('common.delete')"
              icon="delete"
              @click="showDeleteConfirmation = true"
              :loading="actionLoading"
              flat
            />
          </q-btn-group>
        </div>
      </div>

      <!-- Content Cards -->
      <div class="row q-col-gutter-md">
        <!-- Main Information -->
        <div class="col-12 col-md-8">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ $t('projects.detail.information') }}</div>

              <!-- Description -->
              <div class="q-mb-md">
                <div class="text-weight-medium q-mb-xs">{{ $t('projects.form.description') }}</div>
                <div class="text-body2 text-grey-8">
                  {{ project.description || $t('projects.detail.noDescription') }}
                </div>
              </div>

              <!-- Sub-Competency Details -->
              <div class="q-mb-md" v-if="project.subCompetency">
                <div class="text-weight-medium q-mb-xs">
                  {{ $t('projects.detail.subCompetency') }}
                </div>
                <q-item dense class="q-pa-none">
                  <q-item-section>
                    <q-item-label>{{ project.subCompetency.name }}</q-item-label>
                    <q-item-label caption>
                      {{ project.subCompetency.description }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </div>

              <!-- File Attachment -->
              <div v-if="project.fileKey" class="q-mb-md">
                <div class="text-weight-medium q-mb-xs">{{ $t('projects.detail.attachment') }}</div>
                <q-item dense class="q-pa-none">
                  <q-item-section avatar>
                    <q-icon name="attachment" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ getFileName(project.fileKey) }}</q-item-label>
                    <q-item-label caption>{{ $t('projects.detail.fileUploaded') }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      flat
                      dense
                      icon="download"
                      :label="$t('common.download')"
                      @click="downloadFile"
                      color="primary"
                    />
                  </q-item-section>
                </q-item>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Metadata Sidebar -->
        <div class="col-12 col-md-4">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ $t('projects.detail.metadata') }}</div>

              <!-- Status -->
              <div class="q-mb-md">
                <div class="text-weight-medium q-mb-xs">{{ $t('projects.form.status') }}</div>
                <q-chip
                  :color="getStatusColor(project.status)"
                  :label="$t(`projects.status.${project.status.toLowerCase()}`)"
                  size="sm"
                />
              </div>

              <!-- Student (if viewing as educator/admin) -->
              <div v-if="project.student && showStudentInfo" class="q-mb-md">
                <div class="text-weight-medium q-mb-xs">{{ $t('projects.detail.student') }}</div>
                <q-item dense class="q-pa-none">
                  <user-avatar :user="project.student" size="64px" />
                  <q-item-section>
                    <q-item-label>{{ project.student.name }}</q-item-label>
                    <q-item-label caption>{{ project.student.email }}</q-item-label>
                  </q-item-section>
                </q-item>
              </div>

              <!-- Timestamps -->
              <div class="q-mb-md">
                <div class="text-weight-medium q-mb-xs">{{ $t('projects.detail.created') }}</div>
                <div class="text-body2 text-grey-7">
                  {{ formatDate(project.createdAt) }}
                </div>
              </div>

              <div v-if="project.updatedAt && project.updatedAt !== project.createdAt">
                <div class="text-weight-medium q-mb-xs">{{ $t('projects.detail.updated') }}</div>
                <div class="text-body2 text-grey-7">
                  {{ formatDate(project.updatedAt) }}
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Edit Dialog -->
    <project-form-dialog v-model="showEditDialog" :project="project" @saved="onProjectUpdated" />

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteConfirmation" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm">{{ $t('projects.delete.confirmTitle') }}</span>
        </q-card-section>

        <q-card-section class="pt-none">
          {{ $t('projects.delete.confirmMessage', { name: project?.name }) }}
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('common.cancel')"
            color="primary"
            @click="showDeleteConfirmation = false"
          />
          <q-btn
            flat
            :label="$t('common.delete')"
            color="negative"
            @click="deleteProject"
            :loading="actionLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { date } from 'quasar';
import ProjectFormDialog from 'src/components/project/ProjectFormDialog.vue';
import UserAvatar from 'src/components/ui/UserAvatar.vue';
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

// State
const project = ref<Project | null>(null);
const loading = ref(false);
const actionLoading = ref(false);
const error = ref<string | null>(null);
const showEditDialog = ref(false);
const showDeleteConfirmation = ref(false);

// Repository
const projectRepository = new ProjectRepository();

// Computed
const projectId = computed(() => route.params.projectId as string);

const canEdit = computed(() => {
  if (!project.value) return false;

  // Edit is only allowed for Draft/Rejected status
  const editableStatuses: ProjectStatus[] = ['Draft', 'Rejected'];
  if (!editableStatuses.includes(project.value.status)) return false;

  // Students can edit their own projects
  if (project.value.studentId === userId.value) return true;

  // Educators and admins can edit any project
  return hasAnyRole(['Educator', 'Admin']);
});

const canSubmit = computed(() => {
  if (!project.value) return false;

  // Only students can submit their own projects
  if (project.value.studentId !== userId.value) return false;

  // Can only submit Draft or Rejected projects
  return ['Draft', 'Rejected'].includes(project.value.status);
});

const canApprove = computed(() => {
  if (!project.value) return false;

  // Only educators/admins can approve
  if (!hasAnyRole(['Educator', 'Admin'])) return false;

  // Can only approve Submitted projects
  return project.value.status === 'Submitted';
});

const canReject = computed(() => {
  if (!project.value) return false;

  // Only educators/admins can reject
  if (!hasAnyRole(['Educator', 'Admin'])) return false;

  // Can only reject Submitted projects
  return project.value.status === 'Submitted';
});

const canDelete = computed(() => {
  if (!project.value) return false;

  // Only students can delete their own projects
  if (project.value.studentId !== userId.value) return false;

  // Can only delete Draft or Rejected projects
  return ['Draft', 'Rejected'].includes(project.value.status);
});

const availableActions = computed(() => {
  const actions = [];
  if (canEdit.value) actions.push('edit');
  if (canSubmit.value) actions.push('submit');
  if (canApprove.value) actions.push('approve');
  if (canReject.value) actions.push('reject');
  if (canDelete.value) actions.push('delete');
  return actions;
});

const showStudentInfo = computed(() => {
  return hasAnyRole(['Educator', 'Admin']) && project.value?.studentId !== userId.value;
});

// Methods
const loadProject = async (): Promise<void> => {
  loading.value = true;
  error.value = null;

  try {
    project.value = await projectRepository.findById(projectId.value);

    if (!project.value) {
      error.value = t('projects.detail.notFound');
    }
  } catch (err) {
    console.error('Failed to load project:', err);
    error.value = t('projects.detail.loadError');
  } finally {
    loading.value = false;
  }
};

const editProject = (): void => {
  showEditDialog.value = true;
};

const onProjectUpdated = (updatedProject: Project): void => {
  project.value = updatedProject;
  showEditDialog.value = false;
};

const downloadFile = async (): Promise<void> => {
  if (!project.value?.fileKey) {
    return;
  }

  try {
    const url = await project.value.resolveFileUrl();

    if (url) {
      window.open(url, '_blank', 'noopener');
    } else {
      console.error('Failed to get file URL for project:', project.value.id);
    }
  } catch (error) {
    console.error('Error downloading project file:', error);
  }
};

const submitProject = async (): Promise<void> => {
  if (!project.value) return;

  actionLoading.value = true;
  try {
    const updatedProject = await projectRepository.update(project.value.id, {
      status: 'Submitted',
    });
    project.value = updatedProject;
  } catch (error) {
    console.error('Failed to submit project:', error);
    // TODO: Show error notification
  } finally {
    actionLoading.value = false;
  }
};

const approveProject = async (): Promise<void> => {
  if (!project.value) return;

  actionLoading.value = true;
  try {
    const updatedProject = await projectRepository.update(project.value.id, { status: 'Approved' });
    project.value = updatedProject;
  } catch (error) {
    console.error('Failed to approve project:', error);
    // TODO: Show error notification
  } finally {
    actionLoading.value = false;
  }
};

const rejectProject = async (): Promise<void> => {
  if (!project.value) return;

  actionLoading.value = true;
  try {
    const updatedProject = await projectRepository.update(project.value.id, { status: 'Rejected' });
    project.value = updatedProject;
  } catch (error) {
    console.error('Failed to reject project:', error);
    // TODO: Show error notification
  } finally {
    actionLoading.value = false;
  }
};

const deleteProject = async (): Promise<void> => {
  if (!project.value) return;

  actionLoading.value = true;
  try {
    await projectRepository.delete(project.value.id);
    // Navigate back to projects list after successful deletion
    await router.push({ name: 'student-projects' });
  } catch (error) {
    console.error('Failed to delete project:', error);
    // TODO: Show error notification
  } finally {
    actionLoading.value = false;
    showDeleteConfirmation.value = false;
  }
};

const getStatusColor = (status: ProjectStatus): string => {
  const COLOR_MAP: Record<ProjectStatus, string> = {
    Draft: 'grey-6',
    Submitted: 'orange',
    Approved: 'green',
    Rejected: 'red',
  };
  return COLOR_MAP[status] || 'grey-6';
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  return date.formatDate(dateString, 'MMM D, YYYY [at] h:mm A');
};

const getFileName = (fileKey: string): string => {
  return fileKey.split('/').pop() || fileKey;
};

// Lifecycle
onMounted(async () => {
  await loadProject();
});
</script>

<style scoped>
.project-detail {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
