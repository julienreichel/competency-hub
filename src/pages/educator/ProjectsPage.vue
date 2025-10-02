<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg row items-center q-gutter-sm">
      <q-icon name="assignment" />
      <span>{{ $t('educator.projects.title') }}</span>
    </div>

    <q-banner v-if="errorMessage" class="bg-negative text-white q-mb-md">
      {{ errorMessage }}
    </q-banner>

    <div class="row items-end q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-4">
        <q-input
          v-model="searchQuery"
          outlined
          :placeholder="$t('educator.projects.searchPlaceholder')"
          clearable
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-4 col-lg-3">
        <q-select
          v-model="studentFilter"
          outlined
          clearable
          emit-value
          map-options
          :options="studentOptions"
          :label="$t('educator.projects.studentFilterLabel')"
        />
      </div>
      <div class="col-12 col-md-4 col-lg-3">
        <q-select
          v-model="subCompetencyFilter"
          outlined
          clearable
          emit-value
          map-options
          :options="subCompetencyOptions"
          :label="$t('educator.projects.subCompetencyFilterLabel')"
        />
      </div>
      <div class="col-12 col-md-auto">
        <q-btn
          outline
          color="primary"
          icon="refresh"
          :label="$t('common.refresh')"
          :loading="pageLoading"
          @click="refresh"
        />
      </div>
    </div>

    <!-- Projects Table -->
    <q-table
      flat
      bordered
      v-model:selected="selected"
      :rows="filteredProjects"
      :columns="columns"
      :loading="pageLoading"
      row-key="id"
      selection="multiple"
      :no-data-label="$t('educator.projects.emptyState')"
      :pagination="pagination"
    >
      <template #top>
        <div class="row items-center justify-between full-width q-col-gutter-md">
          <div class="col">
            <div class="text-subtitle1">{{ $t('educator.projects.tableTitle') }}</div>
            <div class="text-caption text-grey-7">
              {{ $t('educator.projects.tableHint') }}
            </div>
          </div>
          <div v-if="selected.length > 0" class="col-auto row q-gutter-sm">
            <q-btn
              color="positive"
              icon="check_circle"
              :label="$t('projects.actions.approve')"
              :disable="selected.length === 0"
              :loading="bulkActionLoading"
              @click="bulkApprove"
            />
            <q-btn
              color="negative"
              icon="cancel"
              :label="$t('projects.actions.reject')"
              :disable="selected.length === 0"
              :loading="bulkActionLoading"
              @click="bulkReject"
            />
          </div>
        </div>
      </template>
      <template #body-cell-student="props">
        <q-td :props="props">
          <div class="row items-center no-wrap q-gutter-sm">
            <user-avatar :user="props.row.student" size="40px" />
            <div>
              <div class="text-body1">{{ props.row.student?.name || $t('common.unknown') }}</div>
              <div class="text-caption text-grey-7">{{ props.row.student?.email }}</div>
            </div>
          </div>
        </q-td>
      </template>

      <template #body-cell-name="props">
        <q-td :props="props">
          <div>
            <div class="text-body1">{{ props.row.name }}</div>
            <div class="text-caption text-grey-7 line-clamp-1">
              {{ props.row.description || $t('projects.noDescription') }}
            </div>
          </div>
        </q-td>
      </template>

      <template #body-cell-subCompetency="props">
        <q-td :props="props">
          <div>
            <div class="text-body1">
              {{ props.row.subCompetency?.name || $t('common.loading') }}
            </div>
            <div class="text-caption text-grey-7">
              {{ props.row.subCompetency?.description }}
            </div>
          </div>
        </q-td>
      </template>

      <template #body-cell-status="props">
        <q-td :props="props">
          <q-chip
            :color="getStatusColor(props.row.status)"
            :label="$t(`projects.status.${props.row.status.toLowerCase()}`)"
            size="sm"
          />
        </q-td>
      </template>

      <template #body-cell-submittedAt="props">
        <q-td :props="props">
          {{ formatDate(props.row.updatedAt) }}
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <div class="row q-gutter-xs">
            <q-space />
            <q-btn
              flat
              dense
              color="positive"
              icon="check_circle"
              @click="approveProject(props.row)"
              :loading="actionLoading.has(props.row.id)"
            />
            <q-btn
              flat
              dense
              color="negative"
              icon="cancel"
              @click="rejectProject(props.row)"
              :loading="actionLoading.has(props.row.id)"
            />
            <q-btn dense flat round icon="more_vert" :aria-label="$t('common.actions')">
              <q-menu anchor="top right" self="top right">
                <q-list dense style="min-width: 180px">
                  <q-item clickable v-close-popup @click="viewProject(props.row)">
                    <q-item-section avatar>
                      <q-icon name="visibility" />
                    </q-item-section>
                    <q-item-section>{{ $t('common.view') }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>

    <q-inner-loading :showing="pageLoading">
      <q-spinner-tail color="primary" size="64px" />
    </q-inner-loading>
  </q-page>
</template>

<script setup lang="ts">
import { date } from 'quasar';
import UserAvatar from 'src/components/ui/UserAvatar.vue';
import { useAuth } from 'src/composables/useAuth';
import { type Project, type ProjectStatus } from 'src/models/Project';
import { ProjectRepository } from 'src/models/repositories/ProjectRepository';
import { UserRepository } from 'src/models/repositories/UserRepository';
import { type User } from 'src/models/User';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();
const { userId } = useAuth();

// Repositories
const projectRepository = new ProjectRepository();
const userRepository = new UserRepository();

// State
const pageLoading = ref(false);
const bulkActionLoading = ref(false);
const actionLoading = ref(new Set<string>());
const errorMessage = ref<string | null>(null);
const searchQuery = ref('');
const studentFilter = ref<string | null>(null);
const subCompetencyFilter = ref<string | null>(null);
const projects = ref<Project[]>([]);
const currentUser = ref<User | null>(null);
const selected = ref<Project[]>([]);

// Table configuration
const pagination = ref({
  rowsPerPage: 25,
});

const columns = computed(() => [
  {
    name: 'student',
    label: t('educator.projects.columns.student'),
    field: 'student',
    align: 'left' as const,
    sortable: true,
    style: 'width: 200px',
  },
  {
    name: 'name',
    label: t('educator.projects.columns.name'),
    field: 'name',
    align: 'left' as const,
    sortable: true,
    style: 'width: 250px',
  },
  {
    name: 'subCompetency',
    label: t('educator.projects.columns.subCompetency'),
    field: 'subCompetency',
    align: 'left' as const,
    sortable: true,
    style: 'width: 200px',
  },
  {
    name: 'status',
    label: t('educator.projects.columns.status'),
    field: 'status',
    align: 'center' as const,
    sortable: true,
    style: 'width: 120px',
  },
  {
    name: 'submittedAt',
    label: t('educator.projects.columns.submittedAt'),
    field: 'updatedAt',
    align: 'center' as const,
    sortable: true,
    style: 'width: 150px',
  },
  {
    name: 'actions',
    label: t('common.actions'),
    field: 'actions',
    align: 'center' as const,
    style: 'width: 200px',
  },
]);

// Computed
const studentOptions = computed(() => {
  if (!currentUser.value?.students) return [];

  return currentUser.value.students.map((student) => ({
    label: student.name,
    value: student.id,
  }));
});

const subCompetencyOptions = computed(() => {
  const entries = new Map<string, string>();
  projects.value.forEach((project) => {
    if (project.subCompetency) {
      entries.set(project.subCompetency.id, project.subCompetency.name);
    }
  });
  return Array.from(entries).map(([value, label]) => ({ label, value }));
});

const normalizedSearch = computed(() => searchQuery.value.trim().toLowerCase());

const filteredProjects = computed(() => {
  return projects.value.filter((project) => {
    // Search filter
    if (normalizedSearch.value) {
      const searchableText = [
        project.name,
        project.description,
        project.student?.name,
        project.student?.email,
        project.subCompetency?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(normalizedSearch.value)) {
        return false;
      }
    }

    // Student filter
    if (studentFilter.value && project.studentId !== studentFilter.value) {
      return false;
    }

    // Sub-competency filter
    if (subCompetencyFilter.value && project.subCompetencyId !== subCompetencyFilter.value) {
      return false;
    }

    return true;
  });
});

// Watch for filter changes and clear invalid selections
watch(studentOptions, (options) => {
  if (studentFilter.value && !options.some((option) => option.value === studentFilter.value)) {
    studentFilter.value = null;
  }
});

watch(subCompetencyOptions, (options) => {
  if (
    subCompetencyFilter.value &&
    !options.some((option) => option.value === subCompetencyFilter.value)
  ) {
    subCompetencyFilter.value = null;
  }
});

// Methods
const loadData = async (): Promise<void> => {
  if (!userId.value) return;

  pageLoading.value = true;
  errorMessage.value = null;

  try {
    // Load current user with students
    currentUser.value = await userRepository.findById(userId.value);

    if (!currentUser.value?.students.length) {
      projects.value = [];
      return;
    }

    // Get all student IDs
    const studentIds = currentUser.value.students.map((student) => student.id);

    // Load all submitted projects from these students
    const allProjects: Project[] = [];
    for (const studentId of studentIds) {
      const studentProjects = await projectRepository.findByStudentId(studentId);
      // Only include submitted projects
      const submittedProjects = studentProjects.filter((p) => p.status === 'Submitted');
      allProjects.push(...submittedProjects);
    }

    projects.value = allProjects;
  } catch (error) {
    console.error('Failed to load projects:', error);
    errorMessage.value = t('educator.projects.loadError');
  } finally {
    pageLoading.value = false;
  }
};

const refresh = async (): Promise<void> => {
  selected.value = [];
  await loadData();
};

const viewProject = async (project: Project): Promise<void> => {
  await router.push({ name: 'project-detail', params: { projectId: project.id } });
};

const approveProject = async (project: Project): Promise<void> => {
  actionLoading.value.add(project.id);
  try {
    await projectRepository.update(project.id, { status: 'Approved' });
    const index = projects.value.findIndex((p) => p.id === project.id);
    if (index !== -1) {
      projects.value.splice(index, 1); // Remove from submitted list
    }
    // Remove from selection if selected
    selected.value = selected.value.filter((p) => p.id !== project.id);
  } catch (error) {
    console.error('Failed to approve project:', error);
    // TODO: Show error notification
  } finally {
    actionLoading.value.delete(project.id);
  }
};

const rejectProject = async (project: Project): Promise<void> => {
  actionLoading.value.add(project.id);
  try {
    await projectRepository.update(project.id, { status: 'Rejected' });
    const index = projects.value.findIndex((p) => p.id === project.id);
    if (index !== -1) {
      projects.value.splice(index, 1); // Remove from submitted list
    }
    // Remove from selection if selected
    selected.value = selected.value.filter((p) => p.id !== project.id);
  } catch (error) {
    console.error('Failed to reject project:', error);
    // TODO: Show error notification
  } finally {
    actionLoading.value.delete(project.id);
  }
};

const bulkApprove = async (): Promise<void> => {
  if (selected.value.length === 0) return;

  bulkActionLoading.value = true;
  try {
    await Promise.all(
      selected.value.map(async (project) => {
        await projectRepository.update(project.id, { status: 'Approved' });
      }),
    );

    // Remove approved projects from the list
    const approvedIds = new Set(selected.value.map((p) => p.id));
    projects.value = projects.value.filter((p) => !approvedIds.has(p.id));
    selected.value = [];
  } catch (error) {
    console.error('Failed to bulk approve projects:', error);
    // TODO: Show error notification
  } finally {
    bulkActionLoading.value = false;
  }
};

const bulkReject = async (): Promise<void> => {
  if (selected.value.length === 0) return;

  bulkActionLoading.value = true;
  try {
    await Promise.all(
      selected.value.map(async (project) => {
        await projectRepository.update(project.id, { status: 'Rejected' });
      }),
    );

    // Remove rejected projects from the list
    const rejectedIds = new Set(selected.value.map((p) => p.id));
    projects.value = projects.value.filter((p) => !rejectedIds.has(p.id));
    selected.value = [];
  } catch (error) {
    console.error('Failed to bulk reject projects:', error);
    // TODO: Show error notification
  } finally {
    bulkActionLoading.value = false;
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

// Lifecycle
onMounted(async () => {
  await loadData();
});
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
