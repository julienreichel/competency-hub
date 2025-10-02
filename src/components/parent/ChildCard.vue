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
            {{ child.email }}
          </div>
          <div class="text-caption text-grey-5" v-if="child.primaryEducator">
            Educator: {{ child.primaryEducator }}
          </div>
        </div>
      </div>
    </q-card-section>

    <q-card-section>
      <div class="text-subtitle1 q-mb-sm">Progress Overview</div>
      <div class="row q-gutter-sm">
        <div class="col">
          <div class="text-caption">Total Competencies</div>
          <div class="text-h6 text-blue">{{ child.stats.totalCompetencies }}</div>
        </div>
        <div class="col">
          <div class="text-caption">Validated</div>
          <div class="text-h6 text-green">{{ child.stats.validatedCount }}</div>
        </div>
        <div class="col">
          <div class="text-caption">In Progress</div>
          <div class="text-h6 text-orange">{{ child.stats.inProgressCount }}</div>
        </div>
      </div>
    </q-card-section>

    <q-card-section>
      <div class="text-subtitle1 q-mb-sm">Domain Progress</div>
      <div v-for="domain in child.domains" :key="domain.name" class="q-mb-xs">
        <div class="row items-center justify-between">
          <span class="text-caption">{{ domain.name }}</span>
          <span class="text-caption">{{ Math.round(domain.progress) }}%</span>
        </div>
        <q-linear-progress
          :value="domain.progress / 100"
          :style="{ color: domain.color }"
          size="md"
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
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'ChildCard',
});

interface DomainProgress {
  name: string;
  color: string;
  progress: number;
}

interface ChildCardStats {
  totalCompetencies: number;
  validatedCount: number;
  inProgressCount: number;
}

export interface ChildCardData {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  primaryEducator?: string | null;
  stats: ChildCardStats;
  domains: DomainProgress[];
}
</script>
