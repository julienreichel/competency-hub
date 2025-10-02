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
        <project-card
          :project="project"
          @view="viewProject"
          @edit="editProject"
          @submit="submitProject"
          @approve="approveProject"
          @reject="rejectProject"
          @delete="deleteProject"
        />
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
import ProjectCard from 'src/components/project/ProjectCard.vue';
import ProjectFormDialog from 'src/components/project/ProjectFormDialog.vue';
import { useAuth } from 'src/composables/useAuth';
import { type Project } from 'src/models/Project';
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

const submitProject = async (project: Project): Promise<void> => {
  try {
    const updatedProject = await projectRepository.update(project.id, { status: 'Submitted' });
    const index = projects.value.findIndex((p) => p.id === project.id);
    if (index !== -1) {
      projects.value[index] = updatedProject;
    }
  } catch (error) {
    console.error('Failed to submit project:', error);
    // TODO: Show error notification
  }
};

const approveProject = async (project: Project): Promise<void> => {
  try {
    const updatedProject = await projectRepository.update(project.id, { status: 'Approved' });
    const index = projects.value.findIndex((p) => p.id === project.id);
    if (index !== -1) {
      projects.value[index] = updatedProject;
    }
  } catch (error) {
    console.error('Failed to approve project:', error);
    // TODO: Show error notification
  }
};

const rejectProject = async (project: Project): Promise<void> => {
  try {
    const updatedProject = await projectRepository.update(project.id, { status: 'Rejected' });
    const index = projects.value.findIndex((p) => p.id === project.id);
    if (index !== -1) {
      projects.value[index] = updatedProject;
    }
  } catch (error) {
    console.error('Failed to reject project:', error);
    // TODO: Show error notification
  }
};

const deleteProject = async (project: Project): Promise<void> => {
  try {
    await projectRepository.delete(project.id);
    const index = projects.value.findIndex((p) => p.id === project.id);
    if (index !== -1) {
      projects.value.splice(index, 1);
    }
  } catch (error) {
    console.error('Failed to delete project:', error);
    // TODO: Show error notification
  }
};

// Lifecycle
onMounted(async () => {
  await loadProjects();
});
</script>
