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
      <q-btn
        flat
        dense
        :label="$t('common.edit')"
        icon="edit"
        color="primary"
        size="sm"
        @click.stop="$emit('edit', project)"
      />
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
import { type Project, type ProjectStatus } from 'src/models/Project';

// Props
interface Props {
  project: Project;
}

defineProps<Props>();

// Emits
defineEmits<{
  view: [project: Project];
  edit: [project: Project];
}>();

// Component name for debugging
defineOptions({
  name: 'ProjectCard',
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
