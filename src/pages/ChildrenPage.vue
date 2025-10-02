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
import { useReportData } from 'src/composables/useReportData';
import { useUsers } from 'src/composables/useUsers';
import type { User } from 'src/models/User';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

interface ChildDomainProgress {
  name: string;
  color: string;
  progress: number;
}

interface ChildStats {
  totalCompetencies: number;
  validatedCount: number;
  inProgressCount: number;
}

interface ChildCardData {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  primaryEducator?: string | null;
  stats: ChildStats;
  domains: ChildDomainProgress[];
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
const { getCurrentUser, getUserById } = useUsers();

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

function generateStatsFromUser(user: User): ChildStats {
  const progress = user.studentProgress || [];

  const totalCompetencies = progress.length;
  const validatedCount = progress.filter((p) => p.status === 'Validated').length;
  // InProgress should include both InProgress and PendingValidation
  const inProgressCount = progress.filter(
    (p) => p.status === 'InProgress' || p.status === 'PendingValidation',
  ).length;

  return {
    totalCompetencies,
    validatedCount,
    inProgressCount,
  };
}

const { generateDomainSummary } = useReportData();

async function generateDomainsFromUser(user: User): Promise<ChildDomainProgress[]> {
  // Use the composable's generateDomainSummary method
  return await generateDomainSummary(user);
}

function getPrimaryEducator(user: User): string | null {
  if (user.educators && user.educators.length > 0 && user.educators[0]) {
    return user.educators[0].name;
  }
  return null;
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

  children.value = await Promise.all(
    childUsers.map(async (childUser) => {
      childUser = (await getUserById(childUser.id)) || childUser;
      return {
        id: childUser.id,
        name: childUser.name,
        email: childUser.email,
        avatar: childUser.avatar || childUser.picture || null,
        primaryEducator: getPrimaryEducator(childUser),
        stats: generateStatsFromUser(childUser),
        domains: await generateDomainsFromUser(childUser),
        user: childUser,
      };
    }),
  );
  isLoadingChildren.value = false;
}

onMounted(() => {
  void loadChildren();
});

const isNewChildValid = computed(() => {
  return newChild.value.name && newChild.value.age && newChild.value.grade;
});

function viewChildReports(child: Child): void {
  if (child.user) {
    void router.push({ name: 'student-report', params: { studentId: child.user.id } });
    return;
  }
  console.log('No user data available for child:', child.name);
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
