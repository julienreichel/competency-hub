<template>
  <q-page class="q-pa-lg">
    <page-header :icon="'assignment'" :title="t('educator.projects.title')" />

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
    <managed-table
      row-key="id"
      :rows="filteredProjects"
      :columns="columns"
      :loading="pageLoading"
      :no-data-label="$t('educator.projects.emptyState')"
      :pagination="pagination"
      v-model:selected="selected"
      :bulk-actions="bulkActions"
    >
      <template #top-left>
        <div>
          <div class="text-subtitle1">{{ $t('educator.projects.tableTitle') }}</div>
          <div class="text-caption text-grey-7">
            {{ $t('educator.projects.tableHint') }}
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

      <template #body-cell-submittedAt="props">
        <q-td :props="props">
          {{ formatDate(props.row.updatedAt) }}
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <div class="managed-table__actions-row">
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
            <q-btn
              flat
              dense
              color="primary"
              icon="arrow_forward"
              @click="viewProject(props.row)"
            />
          </div>
        </q-td>
      </template>
    </managed-table>

    <q-inner-loading :showing="pageLoading">
      <q-spinner-tail color="primary" size="64px" />
    </q-inner-loading>

    <new-message-dialog
      v-if="composerContext"
      v-model="composerOpen"
      :initial-targets="composerContext.participantIds"
      :initial-title="composerContext.title"
      :kind="composerContext.kind"
      mode="body-only"
      @create="handleComposerCreate"
    />
  </q-page>
</template>

<script setup lang="ts">
import ManagedTable, { type ManagedTableBulkAction } from 'src/components/common/ManagedTable.vue';
import PageHeader from 'src/components/common/PageHeader.vue';
import NewMessageDialog from 'src/components/messaging/NewMessageDialog.vue';
import UserAvatar from 'src/components/ui/UserAvatar.vue';
import { useQuasar } from 'quasar';
import { useAuth } from 'src/composables/useAuth';
import { useProjectActions } from 'src/composables/useProjectActions';
import type { MessageKind } from 'src/models/Message';
import { type Project } from 'src/models/Project';
import { ProjectRepository } from 'src/models/repositories/ProjectRepository';
import { UserRepository } from 'src/models/repositories/UserRepository';
import { type User } from 'src/models/User';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const { t, d } = useI18n();
const router = useRouter();
const { userId } = useAuth();
const {
  approveProject: approveProjectAction,
  rejectProject: rejectProjectAction,
  composerOpen,
  composerContext,
  handleNotificationCreate,
} = useProjectActions();

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
    noMaxWidth: true,
  },
  {
    name: 'name',
    label: t('educator.projects.columns.name'),
    field: 'name',
    align: 'left' as const,
    sortable: true,
    noMaxWidth: true,
  },
  {
    name: 'subCompetency',
    label: t('educator.projects.columns.subCompetency'),
    field: 'subCompetency',
    align: 'left' as const,
    sortable: true,
    noMaxWidth: true,
  },
  {
    name: 'submittedAt',
    label: t('educator.projects.columns.submittedAt'),
    field: 'updatedAt',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'actions',
    label: t('common.actions'),
    field: 'actions',
    align: 'right' as const,
    isActionColumn: true,
  },
]);

const bulkActions = computed<ManagedTableBulkAction[]>(() => [
  {
    key: 'approve',
    label: t('projects.actions.approve'),
    icon: 'check_circle',
    color: 'positive',
    handler: async (rows: unknown[]): Promise<void> => {
      await bulkApproveRows(rows as Project[]);
    },
    loading: bulkActionLoading.value,
    disabled: bulkActionLoading.value,
  },
  {
    key: 'reject',
    label: t('projects.actions.reject'),
    icon: 'cancel',
    color: 'negative',
    handler: async (rows: unknown[]): Promise<void> => {
      await bulkRejectRows(rows as Project[]);
    },
    loading: bulkActionLoading.value,
    disabled: bulkActionLoading.value,
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
    await approveProjectAction(project);
    const index = projects.value.findIndex((p) => p.id === project.id);
    if (index !== -1) {
      projects.value.splice(index, 1); // Remove from submitted list
    }
    // Remove from selection if selected
    selected.value = selected.value.filter((p) => p.id !== project.id);
    $q.notify({ type: 'positive', message: t('projects.messages.approved') });
  } catch (error) {
    console.error('Failed to approve project:', error);
    // TODO: Show error notification
    $q.notify({ type: 'negative', message: t('projects.messages.approveFailed') });
  } finally {
    actionLoading.value.delete(project.id);
  }
};

const rejectProject = async (project: Project): Promise<void> => {
  actionLoading.value.add(project.id);
  try {
    await rejectProjectAction(project);
    const index = projects.value.findIndex((p) => p.id === project.id);
    if (index !== -1) {
      projects.value.splice(index, 1); // Remove from submitted list
    }
    // Remove from selection if selected
    selected.value = selected.value.filter((p) => p.id !== project.id);
    $q.notify({ type: 'positive', message: t('projects.messages.rejected') });
  } catch (error) {
    console.error('Failed to reject project:', error);
    // TODO: Show error notification
    $q.notify({ type: 'negative', message: t('projects.messages.rejectFailed') });
  } finally {
    actionLoading.value.delete(project.id);
  }
};

const bulkApproveRows = async (rows: Project[]): Promise<void> => {
  if (!rows.length) return;

  bulkActionLoading.value = true;
  try {
    await Promise.all(
      rows.map((project) => projectRepository.update(project.id, { status: 'Approved' })),
    );

    const approvedIds = new Set(rows.map((p) => p.id));
    projects.value = projects.value.filter((p) => !approvedIds.has(p.id));
    selected.value = selected.value.filter((p) => !approvedIds.has(p.id));
  } catch (error) {
    console.error('Failed to bulk approve projects:', error);
  } finally {
    bulkActionLoading.value = false;
  }
};

const bulkRejectRows = async (rows: Project[]): Promise<void> => {
  if (!rows.length) return;

  bulkActionLoading.value = true;
  try {
    await Promise.all(
      rows.map((project) => projectRepository.update(project.id, { status: 'Rejected' })),
    );

    const rejectedIds = new Set(rows.map((p) => p.id));
    projects.value = projects.value.filter((p) => !rejectedIds.has(p.id));
    selected.value = selected.value.filter((p) => !rejectedIds.has(p.id));
  } catch (error) {
    console.error('Failed to bulk reject projects:', error);
  } finally {
    bulkActionLoading.value = false;
  }
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  return d(dateString, 'short');
};

// Lifecycle
onMounted(async () => {
  await loadData();
});

const handleComposerCreate = async (payload: {
  title: string;
  body: string;
  participantIds: string[];
  kind?: MessageKind;
}): Promise<void> => {
  try {
    await handleNotificationCreate(payload);
    $q.notify({ type: 'positive', message: t('messaging.notifications.sentSuccess') });
  } catch (error) {
    console.error('Failed to send project notification', error);
    $q.notify({ type: 'negative', message: t('messaging.notifications.sentError') });
  }
};
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
