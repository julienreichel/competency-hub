<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg">
      <q-icon name="family_restroom" class="q-mr-sm" />
      My Children
    </div>

    <!-- Add Child Button -->
    <div class="row justify-end q-mb-lg">
      <q-btn color="primary" icon="add" label="Add Child" @click="showAddChildDialog = true" />
    </div>

    <!-- Children Cards -->
    <div v-if="!isLoadingChildren" class="row q-gutter-lg">
      <div v-for="child in children" :key="child.id" class="col-12 col-md-6 col-lg-4">
        <child-card
          :child="child"
          @view-reports="viewChildReports"
          @view-competencies="viewChildCompetencies"
          @edit="editChild"
          @view-detailed="viewDetailedProgress"
          @contact="contactTeachers"
          @remove="removeChild"
        />
      </div>
    </div>
    <div v-else class="q-mt-xl text-center">
      <q-spinner size="3em" color="primary" />
      <div class="text-h6 q-mt-md text-grey-6">Loading children...</div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoadingChildren && children.length === 0" class="text-center q-mt-xl">
      <q-icon name="family_restroom" size="4em" color="grey-5" />
      <div class="text-h6 q-mt-md text-grey-6">No children added yet</div>
      <div class="text-body2 text-grey-5">
        Add your children to monitor their learning progress.
      </div>
      <q-btn
        color="primary"
        label="Add Your First Child"
        class="q-mt-md"
        @click="showAddChildDialog = true"
      />
    </div>

    <!-- Add Child Dialog -->
    <q-dialog v-model="showAddChildDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add Child</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="addChild" class="q-gutter-md">
            <q-input
              v-model="newChild.name"
              filled
              label="Full Name *"
              :rules="[(val) => !!val || 'Name is required']"
            />

            <q-input
              v-model.number="newChild.age"
              filled
              type="number"
              label="Age *"
              :rules="[(val) => !!val || 'Age is required']"
            />

            <q-select
              v-model="newChild.grade"
              filled
              :options="gradeOptions"
              label="Grade Level *"
              :rules="[(val) => !!val || 'Grade is required']"
            />

            <q-input v-model="newChild.school" filled label="School" />

            <q-input
              v-model="newChild.studentId"
              filled
              label="Student ID"
              hint="If your child is already registered in the system"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showAddChildDialog = false" />
          <q-btn color="primary" label="Add Child" @click="addChild" :disable="!isNewChildValid" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import ChildCard from 'src/components/parent/ChildCard.vue';
import { useUsers } from 'src/composables/useUsers';
import type { User } from 'src/models/User';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

interface SubjectProgress {
  name: string;
  progress: number;
}

interface ChildStats {
  completedAssessments: number;
  averageScore: number;
  studyHours: number;
}

interface ChildCardData {
  id: string;
  name: string;
  age: number;
  grade: string;
  school: string;
  avatar?: string | null;
  stats: ChildStats;
  subjects: SubjectProgress[];
}

type Child = ChildCardData & { user?: User | null };

interface NewChild {
  name: string;
  age: number | null;
  grade: string;
  school: string;
  studentId: string;
}

const router = useRouter();
const { getCurrentUser } = useUsers();

const showAddChildDialog = ref(false);

const newChild = ref<NewChild>({
  name: '',
  age: null,
  grade: '',
  school: '',
  studentId: '',
});

const gradeOptions = [
  'Pre-K',
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
];

const mockChildrenTemplate: Child[] = [
  {
    id: '1',
    name: '...Loading',
    age: 12,
    grade: '7th Grade',
    school: 'Lincoln Middle School',
    stats: {
      completedAssessments: 18,
      averageScore: 92,
      studyHours: 45,
    },
    subjects: [
      { name: 'Mathematics', progress: 85 },
      { name: 'Science', progress: 92 },
      { name: 'Language Arts', progress: 88 },
      { name: 'Social Studies', progress: 90 },
    ],
  },
  {
    id: '2',
    name: '...Loading',
    age: 9,
    grade: '4th Grade',
    school: 'Riverside Elementary',
    stats: {
      completedAssessments: 12,
      averageScore: 87,
      studyHours: 32,
    },
    subjects: [
      { name: 'Mathematics', progress: 78 },
      { name: 'Science', progress: 85 },
      { name: 'Language Arts', progress: 90 },
      { name: 'Art', progress: 95 },
    ],
  },
];

function cloneChild(child: Child): Child {
  return {
    ...child,
    stats: { ...child.stats },
    subjects: child.subjects.map((subject) => ({ ...subject })),
    user: child.user ?? null,
  };
}

const children = ref<Child[]>([]);
const isLoadingChildren = ref(true);

async function loadChildren(): Promise<void> {
  isLoadingChildren.value = true;
  const current = await getCurrentUser();
  if (!current) {
    children.value = [];
    isLoadingChildren.value = false;
    return;
  }

  const childUsers = Array.isArray(current.children) ? current.children : [];
  if (!childUsers.length) {
    children.value = [];
    isLoadingChildren.value = false;
    return;
  }

  children.value = childUsers.map((childUser, index) => {
    const child = mockChildrenTemplate[index % mockChildrenTemplate.length];
    const template = cloneChild(child as Child);
    return {
      ...template,
      id: childUser.id,
      name: childUser.name,
      avatar: childUser.avatar || childUser.picture || template.avatar || null,
      user: childUser,
    };
  });
  isLoadingChildren.value = false;
}

onMounted(() => {
  void loadChildren();
});

const isNewChildValid = computed(() => {
  return newChild.value.name && newChild.value.age && newChild.value.grade;
});

function viewChildReports(child: Child): void {
  console.log('Viewing reports for:', child.name);
  // TODO: Navigate to child-specific reports page
}

function viewChildCompetencies(child: Child): void {
  if (child.user) {
    void router.push({ name: 'user-competencies', params: { userId: child.user.id } });
    return;
  }
  console.log('Viewing competencies for:', child.name);
}

function editChild(child: Child): void {
  console.log('Editing child:', child.name);
  // TODO: Open edit dialog with child's current information
}

function viewDetailedProgress(child: Child): void {
  console.log('Viewing detailed progress for:', child.name);
  // TODO: Navigate to detailed progress page
}

function contactTeachers(child: Child): void {
  console.log('Contacting teachers for:', child.name);
  // TODO: Open teacher contact interface
}

function removeChild(child: Child): void {
  console.log('Removing child:', child.name);
  // TODO: Show confirmation dialog and remove child
}

function addChild(): void {
  if (!isNewChildValid.value) return;

  console.log('Adding new child:', newChild.value);
  // TODO: Implement API call to add child

  // Reset form
  newChild.value = {
    name: '',
    age: null,
    grade: '',
    school: '',
    studentId: '',
  };
  showAddChildDialog.value = false;
}
</script>

<style scoped></style>
