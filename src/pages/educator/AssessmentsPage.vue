<template>
  <q-page class="q-pa-lg">
    <page-header :icon="'assignment_turned_in'" :title="t('educator.assessments.title')" />

    <q-banner v-if="errorMessage" class="bg-negative text-white q-mb-md">
      {{ errorMessage }}
    </q-banner>

    <div class="row items-end q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-4">
        <q-input
          v-model="searchQuery"
          outlined
          :placeholder="t('educator.assessments.searchPlaceholder')"
          clearable
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-4 col-lg-3">
        <q-select
          v-model="domainFilter"
          outlined
          clearable
          emit-value
          map-options
          :options="domainOptions"
          :label="t('educator.assessments.domainFilterLabel')"
        />
      </div>
      <div class="col-12 col-md-4 col-lg-3">
        <q-select
          v-model="studentFilter"
          outlined
          clearable
          emit-value
          map-options
          :options="studentOptions"
          :label="t('educator.assessments.studentFilterLabel')"
        />
      </div>
      <div class="col-12 col-md-auto">
        <q-btn
          outline
          color="primary"
          icon="refresh"
          :label="t('common.refresh')"
          :loading="pageLoading"
          @click="refresh"
        />
      </div>
    </div>

    <student-progress-table
      variant="pending-validation"
      :rows="filteredRows"
      :loading="pageLoading"
      :busy-ids="busyProgressIds"
      :no-data-label="t('educator.assessments.emptyState')"
      @validate-row="handleValidate"
      @open-student-competencies="openStudentCompetencies"
      @open-student-assessments="openStudentAssessments"
      @open-sub-competency="openSubCompetency"
    />

    <q-inner-loading :showing="pageLoading">
      <q-spinner-tail color="primary" size="64px" />
    </q-inner-loading>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import PageHeader from 'src/components/common/PageHeader.vue';
import StudentProgressTable from 'src/components/educator/StudentProgressTable.vue';
import type { StudentProgressRow } from 'src/components/educator/studentProgressTypes';
import {
  buildPendingValidationRows,
  useStudentProgressActions,
} from 'src/composables/useStudentProgress';
import { useUsers } from 'src/composables/useUsers';
import { subCompetencyRepository } from 'src/models/repositories/SubCompetencyRepository';
import type { SubCompetency } from 'src/models/SubCompetency';
import type { User } from 'src/models/User';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();

const { getCurrentUser, getUsersByIds } = useUsers();

const pageLoading = ref(false);
const errorMessage = ref<string | null>(null);
const searchQuery = ref('');
const domainFilter = ref<string | null>(null);
const studentFilter = ref<string | null>(null);
const pendingRows = ref<StudentProgressRow[]>([]);
const students = ref<User[]>([]);
const busyProgressIds = ref<string[]>([]);

const subCompetencyCache = new Map<string, SubCompetency | null>();
const FALLBACK_PLACEHOLDER = '—';

const { persistProgress, syncProgressCaches } = useStudentProgressActions({ students });

const domainOptions = computed(() => {
  const entries = new Map<string, string>();
  pendingRows.value.forEach((row) => {
    if (row.domainValue) {
      entries.set(row.domainValue, row.domainName);
    }
  });
  return Array.from(entries).map(([value, label]) => ({ label, value }));
});

const studentOptions = computed(() =>
  students.value.map((student) => ({ label: student.name, value: student.id })),
);

const normalizedSearch = computed(() => searchQuery.value.trim().toLowerCase());

const filteredRows = computed(() => pendingRows.value.filter((row) => matchesFilters(row)));

watch(domainOptions, (options) => {
  if (domainFilter.value && !options.some((option) => option.value === domainFilter.value)) {
    domainFilter.value = null;
  }
});

watch(studentOptions, (options) => {
  if (studentFilter.value && !options.some((option) => option.value === studentFilter.value)) {
    studentFilter.value = null;
  }
});

onMounted(() => {
  void loadData();
});

async function loadData(): Promise<void> {
  pageLoading.value = true;
  errorMessage.value = null;
  try {
    const educator = await getCurrentUser();
    if (!educator) {
      students.value = [];
      pendingRows.value = [];
      errorMessage.value = t('assessments.errors.noUser');
      return;
    }

    const studentIds = educator.studentIds;
    if (studentIds.length === 0) {
      students.value = [];
      pendingRows.value = [];
      return;
    }

    const loadedStudents = await getUsersByIds(studentIds);
    students.value = loadedStudents;

    await buildPendingRows(loadedStudents);
  } catch (error) {
    console.error('Failed to load educator assessments data', error);
    errorMessage.value = error instanceof Error ? error.message : t('assessments.errors.generic');
  } finally {
    pageLoading.value = false;
  }
}

async function buildPendingRows(studentList: User[]): Promise<void> {
  const rows = await buildPendingValidationRows({
    students: studentList,
    loadSubCompetency,
    cache: subCompetencyCache,
    placeholder: FALLBACK_PLACEHOLDER,
  });
  pendingRows.value = rows;
}

async function loadSubCompetency(id: string): Promise<SubCompetency | null> {
  if (subCompetencyCache.has(id)) {
    return subCompetencyCache.get(id) ?? null;
  }

  try {
    const sub = await subCompetencyRepository.findById(id, true);
    subCompetencyCache.set(id, sub);
    return sub;
  } catch (error) {
    console.error('Failed to load sub-competency', error);
    subCompetencyCache.set(id, null);
    return null;
  }
}

function matchesFilters(row: StudentProgressRow): boolean {
  if (domainFilter.value && row.domainValue !== domainFilter.value) {
    return false;
  }

  if (studentFilter.value && row.student.id !== studentFilter.value) {
    return false;
  }

  if (!normalizedSearch.value) {
    return true;
  }

  const haystack = [
    row.student.name,
    row.student.email,
    row.domainName,
    row.competencyName,
    row.subCompetencyName,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedSearch.value);
}

async function handleValidate(row: StudentProgressRow): Promise<void> {
  if (busyProgressIds.value.includes(row.progress.id)) {
    return;
  }

  busyProgressIds.value = [...busyProgressIds.value, row.progress.id];
  try {
    const updated = await persistProgress(row.progress, { status: 'Validated' });
    syncProgressCaches(row.student, updated);
    pendingRows.value = pendingRows.value.filter((candidate) => candidate.id !== row.id);
    $q.notify({ type: 'positive', message: t('subCompetencies.validateSuccess') });
  } catch (error) {
    console.error('Failed to validate progress', error);
    $q.notify({ type: 'negative', message: t('subCompetencies.progressUpdateError') });
  } finally {
    busyProgressIds.value = busyProgressIds.value.filter((id) => id !== row.progress.id);
  }
}

async function refresh(): Promise<void> {
  await loadData();
}

async function openStudentCompetencies(studentId: string): Promise<void> {
  await router.push({ name: 'user-competencies', params: { userId: studentId } });
}

async function openStudentAssessments(studentId: string): Promise<void> {
  await router.push({ name: 'user-assessments', params: { userId: studentId } });
}

async function openSubCompetency(subCompetency: SubCompetency): Promise<void> {
  await router.push({
    name: 'sub-competency',
    params: { competencyId: subCompetency.competencyId, subId: subCompetency.id },
  });
}
</script>
