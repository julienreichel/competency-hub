<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-lg">
      <div class="text-h4 q-mb-lg row items-center q-gutter-sm">
        <q-icon name="assignment" />
        <span>{{ t('projects.myProjects') }}</span>
      </div>

      <q-btn
        color="primary"
        :label="t('projects.newProject')"
        icon="add"
        :loading="loading"
        @click="showProjectDialog = true"
      />
    </div>
    <q-banner v-if="errorMessage" class="bg-negative text-white q-mb-md">
      {{ errorMessage }}
    </q-banner>

    <div v-if="summaryCards.length" class="row q-col-gutter-md q-mb-lg">
      <div v-for="card in summaryCards" :key="card.key" class="col-6 col-md-3">
        <dashboard-stat-card
          :title="card.caption"
          :value="card.value"
          :icon="card.icon"
          :icon-color="card.color"
        />
      </div>
    </div>

    <search-status-domain-filters
      v-model:search="searchQuery"
      v-model:status="statusFilter"
      v-model:domain="subCompetencyFilter"
      :status-options="statusOptions"
      :domain-options="subCompetencyOptions"
      :search-placeholder="t('projects.filters.searchPlaceholder')"
      :status-label="t('projects.filters.status')"
      :domain-label="t('projects.filters.competency')"
    />

    <div v-if="loading && projects.length === 0" class="row justify-center q-py-xl">
      <q-spinner size="48px" color="primary" />
    </div>
    <div v-else>
      <div v-if="projects.length === 0" class="text-center q-py-xl">
        <q-icon name="folder_open" size="64px" color="grey-5" class="q-mb-md" />
        <h3 class="text-h6 text-grey-7 q-mb-md">{{ t('projects.emptyState.title') }}</h3>
        <p class="text-body2 text-grey-6 q-mb-lg">
          {{ t('projects.emptyState.description') }}
        </p>
        <q-btn
          color="primary"
          :label="t('projects.createFirst')"
          icon="add"
          unelevated
          @click="showProjectDialog = true"
        />
      </div>
      <div v-else-if="filteredProjects.length === 0" class="text-center q-py-xl">
        <q-icon name="assignment" size="64px" color="grey-5" class="q-mb-md" />
        <h3 class="text-h6 text-grey-7 q-mb-md">{{ t('projects.emptyFiltered') }}</h3>
        <p class="text-body2 text-grey-6">{{ t('projects.filters.clearHint') }}</p>
      </div>
      <div v-else class="row q-col-gutter-md">
        <div v-for="project in filteredProjects" :key="project.id" class="col-12 col-md-6">
          <project-card
            :project="project"
            :show-open="true"
            :show-submit="Boolean(project.fileKey)"
            class="full-height"
            @view="viewProject"
            @edit="editProject"
            @submit="submitProject"
            @approve="approveProject"
            @reject="rejectProject"
            @delete="deleteProject"
            @download="downloadProjectFile"
          />
        </div>
      </div>
    </div>

    <project-form-dialog
      v-model="showProjectDialog"
      :project="editingProject"
      @saved="onProjectSaved"
    />

    <q-inner-loading :showing="loading">
      <q-spinner-tail color="primary" size="64px" />
    </q-inner-loading>
  </q-page>
</template>

<script setup lang="ts">
import SearchStatusDomainFilters from 'src/components/common/SearchStatusDomainFilters.vue';
import DashboardStatCard from 'src/components/dashboard/DashboardStatCard.vue';
import ProjectCard from 'src/components/project/ProjectCard.vue';
import ProjectFormDialog from 'src/components/project/ProjectFormDialog.vue';
import { useAuth } from 'src/composables/useAuth';
import { type Project } from 'src/models/Project';
import { ProjectRepository } from 'src/models/repositories/ProjectRepository';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const router = useRouter();
const { userId } = useAuth();
const { t } = useI18n();

const projects = ref<Project[]>([]);
const loading = ref(false);
const showProjectDialog = ref(false);
const editingProject = ref<Project | null>(null);
const errorMessage = ref<string | null>(null);
const searchQuery = ref('');
const statusFilter = ref<string | null>(null);
const subCompetencyFilter = ref<string | null>(null);

const projectRepository = new ProjectRepository();

const normalizedSearch = computed(() => searchQuery.value?.trim().toLowerCase());

const summaryCards = computed(() => {
  const counts = {
    total: projects.value.length,
    draft: 0,
    submitted: 0,
    approved: 0,
  };

  projects.value.forEach((project) => {
    switch (project.status) {
      case 'Draft':
        counts.draft += 1;
        break;
      case 'Submitted':
        counts.submitted += 1;
        break;
      case 'Approved':
        counts.approved += 1;
        break;
      default:
        break;
    }
  });

  return [
    {
      key: 'total',
      caption: t('projects.summary.total'),
      value: counts.total,
      icon: 'assignment',
      color: 'primary',
    },
    {
      key: 'draft',
      caption: t('projects.summary.draft'),
      value: counts.draft,
      icon: 'edit_document',
      color: 'grey',
    },
    {
      key: 'submitted',
      caption: t('projects.summary.submitted'),
      value: counts.submitted,
      icon: 'send',
      color: 'accent',
    },
    {
      key: 'approved',
      caption: t('projects.summary.approved'),
      value: counts.approved,
      icon: 'check_circle',
      color: 'positive',
    },
  ].filter((card) => card.key === 'total' || card.value > 0);
});

const statusOptions = computed(() => [
  { label: t('projects.status.draft'), value: 'Draft' },
  { label: t('projects.status.submitted'), value: 'Submitted' },
  { label: t('projects.status.approved'), value: 'Approved' },
  { label: t('projects.status.rejected'), value: 'Rejected' },
]);

const subCompetencyOptions = computed(() => {
  const options = new Set<string>();
  projects.value.forEach((project) => {
    const subCompetencyName = project.subCompetency?.name;
    if (subCompetencyName) {
      options.add(subCompetencyName);
    }
  });
  return Array.from(options).map((name) => ({ label: name, value: name }));
});

const filteredProjects = computed(() =>
  projects.value.filter((project) => {
    if (statusFilter.value && project.status !== statusFilter.value) {
      return false;
    }

    const subCompetencyName = project.subCompetency?.name ?? '';
    if (subCompetencyFilter.value && subCompetencyName !== subCompetencyFilter.value) {
      return false;
    }

    if (!normalizedSearch.value) {
      return true;
    }

    const haystack = [project.name, project.description ?? '', project.subCompetency?.name ?? '']
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedSearch.value);
  }),
);

const loadProjects = async (): Promise<void> => {
  if (!userId.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = null;
  try {
    projects.value = await projectRepository.findByStudentId(userId.value);
  } catch (error) {
    console.error('Failed to load projects:', error);
    errorMessage.value = t('projects.loadError');
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
    const index = projects.value.findIndex((entry) => entry.id === project.id);
    if (index !== -1) {
      projects.value[index] = project;
    }
  } else {
    projects.value.unshift(project);
  }

  editingProject.value = null;
  showProjectDialog.value = false;
};

const submitProject = async (project: Project): Promise<void> => {
  try {
    const updatedProject = await projectRepository.update(project.id, { status: 'Submitted' });
    const index = projects.value.findIndex((entry) => entry.id === project.id);
    if (index !== -1) {
      projects.value[index] = updatedProject;
    }
  } catch (error) {
    console.error('Failed to submit project:', error);
  }
};

const approveProject = async (project: Project): Promise<void> => {
  try {
    const updatedProject = await projectRepository.update(project.id, { status: 'Approved' });
    const index = projects.value.findIndex((entry) => entry.id === project.id);
    if (index !== -1) {
      projects.value[index] = updatedProject;
    }
  } catch (error) {
    console.error('Failed to approve project:', error);
  }
};

const rejectProject = async (project: Project): Promise<void> => {
  try {
    const updatedProject = await projectRepository.update(project.id, { status: 'Rejected' });
    const index = projects.value.findIndex((entry) => entry.id === project.id);
    if (index !== -1) {
      projects.value[index] = updatedProject;
    }
  } catch (error) {
    console.error('Failed to reject project:', error);
  }
};

const deleteProject = async (project: Project): Promise<void> => {
  try {
    await projectRepository.delete(project.id);
    const index = projects.value.findIndex((entry) => entry.id === project.id);
    if (index !== -1) {
      projects.value.splice(index, 1);
    }
  } catch (error) {
    console.error('Failed to delete project:', error);
  }
};

const downloadProjectFile = async (project: Project): Promise<void> => {
  if (!project.fileKey) {
    return;
  }

  try {
    const url = await project.resolveFileUrl();
    if (url) {
      window.open(url, '_blank', 'noopener');
    }
  } catch (error) {
    console.error('Failed to download project file:', error);
  }
};

onMounted(() => {
  void loadProjects();
});
</script>
