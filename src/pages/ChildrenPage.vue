<template>
  <q-page class="q-pa-lg">
    <page-header :icon="'family_restroom'" :title="t('parents.children.title')">
      <q-btn
        color="primary"
        icon="add"
        :label="t('parents.children.actions.addChild')"
        @click="showAddChildDialog = true"
      />
    </page-header>

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
      <div class="text-h6 q-mt-md text-grey-6">{{ t('parents.children.loading') }}</div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoadingChildren && children.length === 0" class="text-center q-mt-xl">
      <q-icon name="family_restroom" size="4em" color="grey-5" />
      <div class="text-h6 q-mt-md text-grey-6">{{ t('parents.children.emptyTitle') }}</div>
      <div class="text-body2 text-grey-5">
        {{ t('parents.children.emptyDescription') }}
      </div>
      <q-btn
        color="primary"
        :label="t('parents.children.actions.addFirstChild')"
        class="q-mt-md"
        @click="showAddChildDialog = true"
      />
    </div>

    <!-- Add Child Dialog -->
    <q-dialog v-model="showAddChildDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ t('parents.children.dialog.title') }}</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="addChild" class="q-gutter-md">
            <q-input
              v-model="newChild.name"
              outlined
              :label="t('parents.children.fields.fullName')"
              :rules="[nameRequiredRule]"
            />

            <q-input
              v-model.number="newChild.age"
              outlined
              type="number"
              :label="t('parents.children.fields.age')"
              :rules="[ageRequiredRule]"
            />

            <q-select
              v-model="newChild.grade"
              outlined
              :options="gradeOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              :label="t('parents.children.fields.grade')"
              :rules="[gradeRequiredRule]"
            />

            <q-input
              v-model="newChild.school"
              filled
              :label="t('parents.children.fields.school')"
            />

            <q-input
              v-model="newChild.studentId"
              outlined
              :label="t('parents.children.fields.studentId')"
              :hint="t('parents.children.fields.studentIdHint')"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="t('common.cancel')" @click="showAddChildDialog = false" />
          <q-btn
            color="primary"
            :label="t('parents.children.actions.addChild')"
            @click="addChild"
            :disable="!isNewChildValid"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import PageHeader from 'src/components/common/PageHeader.vue';
import ChildCard from 'src/components/parent/ChildCard.vue';
import { useReportData } from 'src/composables/useReportData';
import { useUsers } from 'src/composables/useUsers';
import type { User } from 'src/models/User';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

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
  grade: GradeOptionKey | '';
  school: string;
  studentId: string;
}

const router = useRouter();
const { getCurrentUser, getUserById } = useUsers();
const { t } = useI18n();

const showAddChildDialog = ref(false);

const newChild = ref<NewChild>({
  name: '',
  age: null,
  grade: '',
  school: '',
  studentId: '',
});

const gradeOptionKeys = [
  'preK',
  'kindergarten',
  'grade1',
  'grade2',
  'grade3',
  'grade4',
  'grade5',
  'grade6',
  'grade7',
  'grade8',
  'grade9',
  'grade10',
  'grade11',
  'grade12',
] as const;

type GradeOptionKey = (typeof gradeOptionKeys)[number];

const gradeOptions = computed(() =>
  gradeOptionKeys.map((key) => ({
    value: key,
    label: t(`parents.children.gradeOptions.${key}`),
  })),
);

const nameRequiredRule = (val: unknown): boolean | string => {
  if (typeof val === 'string' && val.trim().length > 0) {
    return true;
  }
  return t('parents.children.validation.nameRequired');
};

const ageRequiredRule = (val: unknown): boolean | string => {
  if (typeof val === 'number' && val > 0) {
    return true;
  }
  if (typeof val === 'string') {
    const numeric = Number.parseFloat(val);
    if (!Number.isNaN(numeric) && numeric > 0) {
      return true;
    }
  }
  return t('parents.children.validation.ageRequired');
};

const gradeRequiredRule = (val: unknown): boolean | string => {
  if (typeof val === 'string' && val.length > 0) {
    return true;
  }
  return t('parents.children.validation.gradeRequired');
};

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
