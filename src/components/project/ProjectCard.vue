<template>
  <q-card class="project-card cursor-pointer" @click="$emit('view', project)" flat bordered>
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
      <!-- Edit Button -->
      <q-btn
        v-if="canEdit"
        flat
        dense
        :label="$t('common.edit')"
        icon="edit"
        color="primary"
        size="sm"
        @click.stop="$emit('edit', project)"
      />

      <!-- Submit Button (Student only) -->
      <q-btn
        v-if="canSubmit"
        flat
        dense
        :label="$t('projects.actions.submit')"
        icon="send"
        color="positive"
        size="sm"
        @click.stop="$emit('submit', project)"
      />

      <!-- Approve Button (Educator only) -->
      <q-btn
        v-if="canApprove"
        flat
        dense
        :label="$t('projects.actions.approve')"
        icon="check_circle"
        color="positive"
        size="sm"
        @click.stop="$emit('approve', project)"
      />

      <!-- Reject Button (Educator only) -->
      <q-btn
        v-if="canReject"
        flat
        dense
        :label="$t('projects.actions.reject')"
        icon="cancel"
        color="negative"
        size="sm"
        @click.stop="$emit('reject', project)"
      />

      <!-- Delete Button (Student only) -->
      <q-btn
        v-if="canDelete"
        flat
        dense
        :label="$t('common.delete')"
        icon="delete"
        color="negative"
        size="sm"
        @click.stop="$emit('delete', project)"
      />

      <!-- View Button -->
      <q-btn
        flat
        dense
        :label="$t('common.view')"
        icon="visibility"
        color="primary"
        size="sm"
        @click.stop="$emit('view', project)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { date } from 'quasar';
import { computed } from 'vue';
import { useAuth } from 'src/composables/useAuth';
import { type Project, type ProjectStatus } from 'src/models/Project';

// Props
interface Props {
  project: Project;
}

const props = defineProps<Props>();

// Emits
defineEmits<{
  view: [project: Project];
  edit: [project: Project];
  submit: [project: Project];
  approve: [project: Project];
  reject: [project: Project];
  delete: [project: Project];
}>();

// Composables
const { userId, hasAnyRole } = useAuth();

// Component name for debugging
defineOptions({
  name: 'ProjectCard',
});

// Computed
const canEdit = computed(() => {
  const editableStatuses: ProjectStatus[] = ['Draft', 'Rejected'];
  if (!editableStatuses.includes(props.project.status)) return false;

  // Students can edit their own projects
  if (props.project.studentId === userId.value) return true;

  // Educators and admins can edit any project
  return hasAnyRole(['Educator', 'Admin']);
});

const canSubmit = computed(() => {
  // Only students can submit their own projects
  if (props.project.studentId !== userId.value) return false;

  // Can only submit Draft or Rejected projects
  return ['Draft', 'Rejected'].includes(props.project.status);
});

const canApprove = computed(() => {
  // Only educators/admins can approve
  if (!hasAnyRole(['Educator', 'Admin'])) return false;

  // Can only approve Submitted projects
  return props.project.status === 'Submitted';
});

const canReject = computed(() => {
  // Only educators/admins can reject
  if (!hasAnyRole(['Educator', 'Admin'])) return false;

  // Can only reject Submitted projects
  return props.project.status === 'Submitted';
});

const canDelete = computed(() => {
  // Only students can delete their own projects
  if (props.project.studentId !== userId.value) return false;

  // Can only delete Draft or Rejected projects
  return ['Draft', 'Rejected'].includes(props.project.status);
});

// Methods
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
