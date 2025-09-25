<template>
  <q-card class="child-card">
    <q-card-section>
      <div class="row items-center">
        <q-avatar size="60px" color="primary" text-color="white">
          <q-img v-if="child.avatar" :src="child.avatar" :alt="child.name" />
          <span v-else>{{ getInitials(child.name) }}</span>
        </q-avatar>
        <div class="q-ml-md">
          <div class="text-h6">{{ child.name }}</div>
          <div class="text-subtitle2 text-grey-6">
            Grade {{ child.grade }} • Age {{ child.age }}
          </div>
          <div class="text-caption text-grey-5">
            {{ child.school }}
          </div>
        </div>
      </div>
    </q-card-section>

    <q-card-section>
      <div class="text-subtitle1 q-mb-sm">Recent Progress</div>
      <div class="row q-gutter-sm">
        <div class="col">
          <div class="text-caption">Assessments</div>
          <div class="text-h6 text-green">{{ child.stats.completedAssessments }}</div>
        </div>
        <div class="col">
          <div class="text-caption">Avg Score</div>
          <div class="text-h6 text-blue">{{ child.stats.averageScore }}%</div>
        </div>
        <div class="col">
          <div class="text-caption">Study Time</div>
          <div class="text-h6 text-purple">{{ child.stats.studyHours }}h</div>
        </div>
      </div>
    </q-card-section>

    <q-card-section>
      <div class="text-subtitle1 q-mb-sm">Subject Progress</div>
      <div v-for="subject in child.subjects" :key="subject.name" class="q-mb-xs">
        <div class="row items-center justify-between">
          <span class="text-caption">{{ subject.name }}</span>
          <span class="text-caption">{{ subject.progress }}%</span>
        </div>
        <q-linear-progress
          :value="subject.progress / 100"
          :color="getProgressColor(subject.progress)"
          size="8px"
        />
      </div>
    </q-card-section>

    <q-card-actions>
      <q-btn
        flat
        color="primary"
        icon="analytics"
        label="View Reports"
        @click="emit('view-reports', child)"
      />
      <q-btn
        flat
        color="primary"
        icon="school"
        label="Competencies"
        @click="emit('view-competencies', child)"
      />
      <q-btn flat icon="more_vert">
        <q-menu>
          <q-list>
            <q-item clickable @click="emit('edit', child)">
              <q-item-section>Edit Profile</q-item-section>
            </q-item>
            <q-item clickable @click="emit('view-detailed', child)">
              <q-item-section>Detailed Progress</q-item-section>
            </q-item>
            <q-item clickable @click="emit('contact', child)">
              <q-item-section>Contact Teachers</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable @click="emit('remove', child)">
              <q-item-section>Remove Child</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const MAX_INITIALS = 2;
const PROGRESS_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 80,
  FAIR: 70,
} as const;

const props = defineProps<{
  child: ChildCardData;
}>();

const emit = defineEmits<{
  (e: 'view-reports', child: ChildCardData): void;
  (e: 'view-competencies', child: ChildCardData): void;
  (e: 'edit', child: ChildCardData): void;
  (e: 'view-detailed', child: ChildCardData): void;
  (e: 'contact', child: ChildCardData): void;
  (e: 'remove', child: ChildCardData): void;
}>();

const child = computed(() => props.child);

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, MAX_INITIALS);
}

function getProgressColor(progress: number): string {
  if (progress >= PROGRESS_THRESHOLDS.EXCELLENT) return 'green';
  if (progress >= PROGRESS_THRESHOLDS.GOOD) return 'blue';
  if (progress >= PROGRESS_THRESHOLDS.FAIR) return 'orange';
  return 'red';
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'ChildCard',
});

interface SubjectProgress {
  name: string;
  progress: number;
}

interface ChildCardStats {
  completedAssessments: number;
  averageScore: number;
  studyHours: number;
}

export interface ChildCardData {
  id: string;
  name: string;
  age: number;
  grade: string;
  school: string;
  avatar?: string | null;
  stats: ChildCardStats;
  subjects: SubjectProgress[];
}
</script>
