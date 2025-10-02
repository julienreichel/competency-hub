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
        <div class="col-auto" v-if="canEdit">
          <q-btn
            color="primary"
            :label="$t('common.edit')"
            icon="edit"
            @click="editProject"
            :loading="actionLoading"
          />
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
import { useRoute } from 'vue-router';

const route = useRoute();
const { t } = useI18n();
const { userId, hasAnyRole } = useAuth();

// State
const project = ref<Project | null>(null);
const loading = ref(false);
const actionLoading = ref(false);
const error = ref<string | null>(null);
const showEditDialog = ref(false);

// Repository
const projectRepository = new ProjectRepository();

// Computed
const projectId = computed(() => route.params.projectId as string);

const canEdit = computed(() => {
  if (!project.value) return false;

  // Students can edit their own projects
  if (project.value.studentId === userId.value) return true;

  // Educators and admins can edit any project
  return hasAnyRole(['Educator', 'Admin']);
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

const downloadFile = (): void => {
  if (project.value?.fileKey) {
    // TODO: Implement file download using Amplify Storage
    console.log('Download file:', project.value.fileKey);
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
