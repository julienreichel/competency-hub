<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg">
      <q-icon name="psychology" class="q-mr-sm" />
      My Competencies
    </div>

    <!-- Filter and Search -->
    <div class="row q-gutter-md q-mb-lg">
      <div class="col-12 col-md-4">
        <q-input v-model="searchQuery" outlined placeholder="Search competencies..." clearable>
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-3">
        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          outlined
          label="Filter by Status"
          clearable
        />
      </div>
      <div class="col-12 col-md-3">
        <q-select
          v-model="domainFilter"
          :options="domainOptions"
          outlined
          label="Filter by Domain"
          clearable
        />
      </div>
    </div>

    <!-- Progress Overview -->
    <div class="row q-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-lg-3">
        <q-card class="bg-blue-1">
          <q-card-section>
            <div class="text-h6 text-blue-8">Total</div>
            <div class="text-h4 text-blue-10">24</div>
            <div class="text-caption text-blue-7">Competencies</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <q-card class="bg-green-1">
          <q-card-section>
            <div class="text-h6 text-green-8">Acquired</div>
            <div class="text-h4 text-green-10">8</div>
            <div class="text-caption text-green-7">Completed</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <q-card class="bg-orange-1">
          <q-card-section>
            <div class="text-h6 text-orange-8">In Progress</div>
            <div class="text-h4 text-orange-10">6</div>
            <div class="text-caption text-orange-7">Active</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <q-card class="bg-grey-3">
          <q-card-section>
            <div class="text-h6 text-grey-8">Locked</div>
            <div class="text-h4 text-grey-10">10</div>
            <div class="text-caption text-grey-7">Not Started</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Competencies Grid -->
    <div class="row q-gutter-md">
      <div
        v-for="competency in filteredCompetencies"
        :key="competency.id"
        class="col-12 col-md-6 col-lg-4"
      >
        <q-card class="cursor-pointer" @click="openCompetency(competency)">
          <q-card-section>
            <div class="row items-center">
              <div class="col">
                <div class="text-h6">{{ competency.domain }}</div>
                <div class="text-subtitle2 text-grey-7">{{ competency.subDomain }}</div>
              </div>
              <div class="col-auto">
                <q-chip
                  :color="getStatusColor(competency.status)"
                  text-color="white"
                  :icon="getStatusIcon(competency.status)"
                >
                  {{ competency.status }}
                </q-chip>
              </div>
            </div>

            <div class="q-mt-md">
              <p class="text-body2">{{ competency.description }}</p>
            </div>

            <div class="q-mt-md">
              <div class="text-caption text-grey-6 q-mb-xs">Progress</div>
              <q-linear-progress
                :value="competency.progress / 100"
                :color="getStatusColor(competency.status)"
                size="8px"
                rounded
              />
              <div class="text-caption text-right q-mt-xs">{{ competency.progress }}%</div>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              :color="getStatusColor(competency.status)"
              :label="getActionLabel(competency.status)"
              @click.stop="handleAction(competency)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredCompetencies.length === 0" class="text-center q-mt-xl">
      <q-icon name="psychology" size="80px" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">No competencies found</div>
      <div class="text-body2 text-grey-6">Try adjusting your search or filter criteria</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

interface Competency {
  id: string;
  domain: string;
  subDomain: string;
  description: string;
  status: 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'ACQUIRED';
  progress: number;
  stage: string;
}

const router = useRouter();

// Reactive data
const searchQuery = ref('');
const statusFilter = ref('');
const domainFilter = ref('');

// Mock data - replace with actual API call
const competencies = ref<Competency[]>([
  {
    id: '1',
    domain: 'Mathematics',
    subDomain: 'Algebra',
    description: 'Solve linear equations and inequalities',
    status: 'ACQUIRED',
    progress: 100,
    stage: 'Advanced',
  },
  {
    id: '2',
    domain: 'Science',
    subDomain: 'Physics',
    description: "Understand Newton's laws of motion",
    status: 'IN_PROGRESS',
    progress: 65,
    stage: 'Intermediate',
  },
  {
    id: '3',
    domain: 'Language Arts',
    subDomain: 'Writing',
    description: 'Write persuasive essays with clear arguments',
    status: 'UNLOCKED',
    progress: 0,
    stage: 'Beginner',
  },
  {
    id: '4',
    domain: 'Social Studies',
    subDomain: 'History',
    description: 'Analyze primary sources from historical events',
    status: 'LOCKED',
    progress: 0,
    stage: 'Advanced',
  },
]);

// Options for filters
const statusOptions = ['LOCKED', 'UNLOCKED', 'IN_PROGRESS', 'ACQUIRED'];
const domainOptions = ['Mathematics', 'Science', 'Language Arts', 'Social Studies'];

// Computed
const filteredCompetencies = computed(() => {
  return competencies.value.filter((comp) => {
    const matchesSearch =
      !searchQuery.value ||
      comp.domain.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      comp.subDomain.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesStatus = !statusFilter.value || comp.status === statusFilter.value;
    const matchesDomain = !domainFilter.value || comp.domain === domainFilter.value;

    return matchesSearch && matchesStatus && matchesDomain;
  });
});

// Methods
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    LOCKED: 'grey',
    UNLOCKED: 'blue',
    IN_PROGRESS: 'orange',
    ACQUIRED: 'green',
  };
  return colors[status] || 'grey';
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    LOCKED: 'lock',
    UNLOCKED: 'lock_open',
    IN_PROGRESS: 'schedule',
    ACQUIRED: 'check_circle',
  };
  return icons[status] || 'help';
}

function getActionLabel(status: string): string {
  const labels: Record<string, string> = {
    LOCKED: 'Locked',
    UNLOCKED: 'Start',
    IN_PROGRESS: 'Continue',
    ACQUIRED: 'Review',
  };
  return labels[status] || 'View';
}

function openCompetency(competency: Competency): void {
  // Navigate to competency detail page
  console.log('Opening competency:', competency.id);
}

function handleAction(competency: Competency): void {
  if (competency.status === 'UNLOCKED') {
    // Start the competency
    competency.status = 'IN_PROGRESS';
    competency.progress = 10;
  } else if (competency.status === 'IN_PROGRESS') {
    // Continue working on competency
    void router.push(`/assessments?competency=${competency.id}`);
  }
}
</script>
