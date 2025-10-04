<template>
  <q-card
    flat
    bordered
    :class="['project-card', { 'cursor-pointer': allowOpen }]"
    @click="handleCardClick"
  >
    <q-card-section class="row items-start justify-between q-gutter-sm">
      <div class="column col q-gutter-xs">
        <div v-if="competencyName" class="text-caption text-grey-6">
          {{ competencyName }}
        </div>
        <div class="text-subtitle1 text-weight-medium text-truncate">
          {{ project.name }}
        </div>
        <div class="text-caption text-grey-7 line-clamp-2">
          {{ project.description || $t('projects.noDescription') }}
        </div>
        <div v-if="subCompetencyName" class="text-caption text-grey-6">
          {{ $t('projects.subCompetency') }}: {{ subCompetencyName }}
        </div>
        <div v-if="project.updatedAt" class="text-caption text-grey-6">
          {{ $t('projects.detail.updated') }}: {{ formatDate(project.updatedAt) }}
        </div>
      </div>

      <div class="column items-end col-auto q-gutter-sm">
        <q-chip
          dense
          size="sm"
          :color="getStatusColor(project.status)"
          :label="$t(`projects.status.${project.status.toLowerCase()}`)"
          @click.stop="noop"
        />

        <div class="row q-gutter-xs justify-end">
          <q-btn
            v-if="canEdit && showEditAction"
            flat
            dense
            round
            color="secondary"
            icon="edit"
            @click.stop="$emit('edit', project)"
          >
            <q-tooltip>{{ $t('common.edit') }}</q-tooltip>
          </q-btn>
          <q-btn
            v-if="canSubmit && showActions"
            flat
            dense
            round
            color="positive"
            icon="send"
            @click.stop="$emit('submit', project)"
          >
            <q-tooltip>{{ $t('projects.actions.submit') }}</q-tooltip>
          </q-btn>
          <q-btn
            v-if="canApprove && showActions"
            flat
            dense
            round
            color="positive"
            icon="check_circle"
            @click.stop="$emit('approve', project)"
          >
            <q-tooltip>{{ $t('projects.actions.approve') }}</q-tooltip>
          </q-btn>
          <q-btn
            v-if="canReject && showActions"
            flat
            dense
            round
            color="negative"
            icon="cancel"
            @click.stop="$emit('reject', project)"
          >
            <q-tooltip>{{ $t('projects.actions.reject') }}</q-tooltip>
          </q-btn>
          <q-btn
            v-if="canDelete && showDeleteAction"
            flat
            dense
            round
            color="negative"
            icon="delete"
            @click.stop="$emit('delete', project)"
          >
            <q-tooltip>{{ $t('common.delete') }}</q-tooltip>
          </q-btn>
          <q-btn
            v-if="showDownloadAction"
            flat
            dense
            round
            color="primary"
            icon="open_in_new"
            @click.stop="$emit('download', project)"
          >
            <q-tooltip>{{ $t('common.download') }}</q-tooltip>
          </q-btn>
          <q-btn
            v-if="allowOpen"
            flat
            dense
            round
            color="primary"
            icon="arrow_forward"
            @click.stop="$emit('view', project)"
          >
            <q-tooltip>{{ $t('common.view') }}</q-tooltip>
          </q-btn>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { date } from 'quasar';
import { useAuth } from 'src/composables/useAuth';
import { type Project, type ProjectStatus } from 'src/models/Project';
import { computed } from 'vue';

const props = defineProps<{
  project: Project;
  showOpen?: boolean;
  showEdit?: boolean;
  showActions?: boolean;
  showDelete?: boolean;
  showDownload?: boolean;
}>();

const emit = defineEmits<{
  view: [project: Project];
  edit: [project: Project];
  submit: [project: Project];
  approve: [project: Project];
  reject: [project: Project];
  delete: [project: Project];
  download: [project: Project];
}>();

const { userId, hasAnyRole } = useAuth();

defineOptions({
  name: 'ProjectCard',
});

const canEdit = computed(() => {
  const editableStatuses: ProjectStatus[] = ['Draft', 'Rejected'];
  if (!editableStatuses.includes(props.project.status)) return false;
  if (props.project.studentId === userId.value) return true;
  return hasAnyRole(['Educator', 'Admin']);
});

const canSubmit = computed(() => {
  if (props.project.studentId !== userId.value) return false;
  return ['Draft', 'Rejected'].includes(props.project.status);
});

const canApprove = computed(() => {
  if (!hasAnyRole(['Educator', 'Admin'])) return false;
  return props.project.status === 'Submitted';
});

const canReject = computed(() => {
  if (!hasAnyRole(['Educator', 'Admin'])) return false;
  return props.project.status === 'Submitted';
});

const canDelete = computed(() => {
  if (props.project.studentId !== userId.value) return false;
  return ['Draft', 'Rejected'].includes(props.project.status);
});

const competencyName = computed(() => props.project.subCompetency?.competency?.name ?? null);

const subCompetencyName = computed(() => props.project.subCompetency?.name ?? null);

const allowOpen = computed(() => props.showOpen !== false);
const showEditAction = computed(() => props.showEdit !== false);
const showDeleteAction = computed(() => props.showDelete !== false);
const showDownloadAction = computed(
  () => props.showDownload !== false && Boolean(props.project.fileKey),
);

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

const noop = (): void => {};

const handleCardClick = (): void => {
  if (!allowOpen.value) return;
  emit('view', props.project);
};
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ProjectCard',
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
