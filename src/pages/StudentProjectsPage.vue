<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h1 class="text-h4 q-ma-none">{{ $t('projects.myProjects') }}</h1>
        <p class="text-subtitle1 text-grey-7 q-mt-sm q-mb-none">
          {{ $t('projects.manageDescription') }}
        </p>
      </div>
      <q-btn
        color="primary"
        :label="$t('projects.newProject')"
        icon="add"
        @click="showProjectDialog = true"
        :loading="loading"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading && projects.length === 0" class="row justify-center q-py-xl">
      <q-spinner size="48px" color="primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="projects.length === 0" class="text-center q-py-xl">
      <q-icon name="folder_open" size="64px" color="grey-5" class="q-mb-md" />
      <h3 class="text-h6 text-grey-7 q-mb-md">{{ $t('projects.emptyState.title') }}</h3>
      <p class="text-body2 text-grey-6 q-mb-lg">
        {{ $t('projects.emptyState.description') }}
      </p>
      <q-btn
        color="primary"
        :label="$t('projects.createFirst')"
        icon="add"
        @click="showProjectDialog = true"
        unelevated
      />
    </div>

    <!-- Projects List -->
    <div v-else class="row q-col-gutter-md">
      <div v-for="project in projects" :key="project.id" class="col-12 col-md-6 col-lg-4">
        <q-card class="project-card cursor-pointer" @click="viewProject(project)" flat bordered>
          <q-card-section>
            <div class="row items-center justify-between q-mb-sm">
              <h3 class="text-h6 q-ma-none text-truncate">{{ project.name }}</h3>
              <q-chip
                :color="getStatusColor(project.status)"
                :label="$t(`projects.status.${project.status.toLowerCase()}`)"
                size="sm"
                dense
              />
            </div>

            <p class="text-body2 text-grey-7 q-mb-md line-clamp-2">
              {{ project.description || $t('projects.noDescription') }}
            </p>

            <div class="row items-center justify-between text-caption text-grey-6">
              <span>
                {{ $t('projects.subCompetency') }}:
                {{ project.subCompetency?.name || $t('common.loading') }}
              </span>
              <span>
                {{ formatDate(project.updatedAt) }}
              </span>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pt-none">
            <q-btn
              flat
              dense
              :label="$t('common.edit')"
              icon="edit"
              color="primary"
              size="sm"
              @click.stop="editProject(project)"
            />
            <q-btn
              flat
              dense
              :label="$t('common.view')"
              icon="visibility"
              color="primary"
              size="sm"
              @click.stop="viewProject(project)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Project Form Dialog -->
    <project-form-dialog
      v-model="showProjectDialog"
      :project="editingProject"
      @saved="onProjectSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { date } from 'quasar';
import ProjectFormDialog from 'src/components/project/ProjectFormDialog.vue';
import { useAuth } from 'src/composables/useAuth';
import { type Project, type ProjectStatus } from 'src/models/Project';
import { ProjectRepository } from 'src/models/repositories/ProjectRepository';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { userId } = useAuth();

// State
const projects = ref<Project[]>([]);
const loading = ref(false);
const showProjectDialog = ref(false);
const editingProject = ref<Project | null>(null);

// Repository
const projectRepository = new ProjectRepository();

// Methods
const loadProjects = async (): Promise<void> => {
  if (!userId.value) return;

  loading.value = true;
  try {
    projects.value = await projectRepository.findByStudentId(userId.value);
  } catch (error) {
    console.error('Failed to load projects:', error);
    // TODO: Show error notification
  } finally {
    loading.value = false;
  }
};

const viewProject = async (project: Project): Promise<void> => {
  await router.push({ name: 'project-detail', params: { projectId: project.id } });
};

const editProject = (project: Project): void => {
  editingProject.value = project;
  showProjectDialog.value = true;
};

const onProjectSaved = (project: Project): void => {
  if (editingProject.value) {
    // Update existing project
    const index = projects.value.findIndex((p) => p.id === project.id);
    if (index !== -1) {
      projects.value[index] = project;
    }
  } else {
    // Add new project
    projects.value.unshift(project);
  }

  // Reset dialog state
  editingProject.value = null;
  showProjectDialog.value = false;
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
  return date.formatDate(dateString, 'MMM D, YYYY');
};

// Lifecycle
onMounted(async () => {
  await loadProjects();
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
