<template>
  <q-page class="q-pa-lg">
    <page-header :icon="'quiz'" :title="t('assessments.title')" />

    <q-banner v-if="errorMessage" class="bg-negative text-white q-mb-md">
      {{ errorMessage }}
    </q-banner>

    <div v-else-if="targetUser && viewer && targetUser.id !== viewer.id" class="text-body2 q-mb-md">
      {{ t('assessments.viewingFor', { name: targetUser.name }) }}
    </div>

    <div v-if="summaryCards.length" class="row q-col-gutter-md q-mb-lg">
      <div v-for="card in summaryCards" :key="card.key" class="col-6 col-md-3">
        <dashboard-stat-card
          :title="card.caption"
          :value="card.value"
          :icon="card.icon"
          :icon-color="card.color"
        />
      </div>
    </div>

    <search-status-domain-filters
      v-model:search="searchQuery"
      v-model:status="statusFilter"
      v-model:domain="domainFilter"
      :status-options="statusOptions"
      :domain-options="domainOptions"
      :search-placeholder="t('assessments.filters.searchPlaceholder')"
      :status-label="t('assessments.filters.status')"
      :domain-label="t('assessments.filters.domain')"
    />

    <div v-if="!loading && filteredEvaluations.length === 0" class="text-center q-mt-xl">
      <q-icon name="quiz" size="80px" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">{{ t('assessments.empty') }}</div>
    </div>

    <evaluation-table
      v-if="filteredEvaluations.length"
      :evaluations="filteredEvaluations"
      :variant="cardVariant"
      :student-id="cardVariant === 'student' ? currentStudentId : undefined"
      :busy-map="busyMap"
      :student-actions-allowed="studentActionsAllowed"
      :sub-competency-map="subCompetenciesByEvaluation"
      card-class="col-12 col-md-6"
      @open="handleOpen"
      @start="handleStudentStart"
      @complete="handleStudentComplete"
    />

    <q-inner-loading :showing="loading">
      <q-spinner-tail color="primary" size="64px" />
    </q-inner-loading>
  </q-page>
</template>

<script setup lang="ts">
import SearchStatusDomainFilters from 'src/components/common/SearchStatusDomainFilters.vue';
import PageHeader from 'src/components/common/PageHeader.vue';
import DashboardStatCard from 'src/components/dashboard/DashboardStatCard.vue';
import EvaluationTable from 'src/components/evaluation/EvaluationTable.vue';
import { useEvaluationStudentActions } from 'src/composables/useEvaluationStudentActions';
import { useUsers } from 'src/composables/useUsers';
import { Evaluation } from 'src/models/Evaluation';
import type { EvaluationAttempt } from 'src/models/EvaluationAttempt';
import { subCompetencyRepository } from 'src/models/repositories/SubCompetencyRepository';
import type { SubCompetency } from 'src/models/SubCompetency';
import type { User } from 'src/models/User';
import { UserRole } from 'src/models/User';
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const { t } = useI18n();
const route = useRoute();
const { getCurrentUser, getUserById } = useUsers();

const loading = ref(false);
const errorMessage = ref<string | null>(null);
const viewer = ref<User | null>(null);
const targetUser = ref<User | null>(null);
const evaluations = ref<Evaluation[]>([]);
const subCompetenciesByEvaluation = reactive<Record<string, SubCompetency | null | undefined>>({});

const searchQuery = ref('');
const statusFilter = ref<string | null>(null);
const domainFilter = ref<string | null>(null);

const normalizedSearch = computed(() => searchQuery.value.trim().toLowerCase());

const studentTarget = computed(() => targetUser.value?.role === UserRole.STUDENT);
const cardVariant = computed<'manager' | 'student'>(() =>
  studentTarget.value ? 'student' : 'manager',
);
const currentStudentId = computed(() => (studentTarget.value ? (targetUser.value?.id ?? '') : ''));
const studentActionsAllowed = computed(
  () => studentTarget.value && targetUser.value?.id === viewer.value?.id,
);

const {
  busyMap,
  openEvaluation: openEvaluationAction,
  startEvaluation: startEvaluationAction,
  completeEvaluation: completeEvaluationAction,
  syncEvaluations: syncStudentEvaluations,
  ensureEvaluationAttempt: attachAttemptToEvaluation,
} = useEvaluationStudentActions({
  evaluations,
  studentId: currentStudentId,
  actionsAllowed: studentActionsAllowed,
  onAttemptUpdated: (attempt) => updateTargetUserAttempt(attempt),
});

const statusForEvaluation = (evaluation: Evaluation): 'NotStarted' | 'InProgress' | 'Completed' => {
  const attempt = findAttempt(evaluation);
  return attempt?.status ?? 'NotStarted';
};

const summaryCards = computed(() => {
  const counts = {
    total: evaluations.value.length,
    notStarted: 0,
    inProgress: 0,
    completed: 0,
  };

  evaluations.value.forEach((evaluation) => {
    switch (statusForEvaluation(evaluation)) {
      case 'Completed':
        counts.completed += 1;
        break;
      case 'InProgress':
        counts.inProgress += 1;
        break;
      default:
        counts.notStarted += 1;
        break;
    }
  });

  return [
    {
      key: 'total',
      caption: t('assessments.summary.total'),
      value: counts.total,
      icon: 'quiz',
      color: 'primary',
    },
    {
      key: 'notStarted',
      caption: t('assessments.summary.notStarted'),
      value: counts.notStarted,
      icon: 'pending',
      color: 'grey',
    },
    {
      key: 'inProgress',
      caption: t('assessments.summary.inProgress'),
      value: counts.inProgress,
      icon: 'schedule',
      color: 'orange',
    },
    {
      key: 'completed',
      caption: t('assessments.summary.completed'),
      value: counts.completed,
      icon: 'check_circle',
      color: 'positive',
    },
  ];
});

const statusOptions = computed(() => [
  {
    label: t('assessments.status.NotStarted'),
    value: 'NotStarted',
  },
  {
    label: t('assessments.status.InProgress'),
    value: 'InProgress',
  },
  {
    label: t('assessments.status.Completed'),
    value: 'Completed',
  },
]);

const domainOptions = computed(() => {
  const set = new Set<string>();
  Object.values(subCompetenciesByEvaluation).forEach((sub) => {
    const domainName = sub?.competency?.domain?.name;
    if (domainName) set.add(domainName);
  });
  return Array.from(set).map((domain) => ({ label: domain, value: domain }));
});

function matchesFilters(evaluation: Evaluation): boolean {
  const status = statusForEvaluation(evaluation);
  if (statusFilter.value && status !== statusFilter.value) {
    return false;
  }
  const sub = subCompetenciesByEvaluation[evaluation.id];
  const domainName = sub?.competency?.domain?.name ?? '';
  if (domainFilter.value && domainName !== domainFilter.value) {
    return false;
  }
  if (normalizedSearch.value) {
    const haystack = [
      evaluation.name,
      evaluation.description ?? '',
      sub?.name ?? '',
      sub?.competency?.name ?? '',
      domainName,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedSearch.value);
  }
  return true;
}

const filteredEvaluations = computed(() =>
  evaluations.value.filter((evaluation) => matchesFilters(evaluation)),
);

watch(
  () => route.params.userId,
  () => {
    void loadData();
  },
);

void loadData();

async function loadData(): Promise<void> {
  loading.value = true;
  errorMessage.value = null;
  try {
    const viewerUser = await getCurrentUser();
    viewer.value = viewerUser;

    const targetId = (route.params.userId as string | undefined) ?? viewerUser?.id;
    if (!targetId) {
      errorMessage.value = t('assessments.errors.noUser');
      evaluations.value = [];
      return;
    }

    const user = await getUserById(targetId);
    if (!user) {
      errorMessage.value = t('assessments.errors.userNotFound');
      evaluations.value = [];
      return;
    }
    targetUser.value = user;

    if (user.role !== UserRole.STUDENT) {
      errorMessage.value = t('assessments.errors.notStudent', { name: user.name });
      evaluations.value = [];
      return;
    }

    await buildEvaluationData(user);
  } catch (error) {
    console.error('Failed to load assessments', error);
    errorMessage.value = error instanceof Error ? error.message : t('assessments.errors.generic');
    evaluations.value = [];
  } finally {
    loading.value = false;
  }
}

async function buildEvaluationData(user: User): Promise<void> {
  const progress = Array.isArray(user.studentProgress) ? user.studentProgress : [];
  const unlockedSubIds = progress
    .filter((entry) => entry.status === 'PendingValidation')
    .map((entry) => entry.subCompetencyId);

  const attemptSubIds = (user.evaluationAttempts ?? [])
    .map((attempt) => attempt.evaluation?.subCompetencyId)
    .filter((id): id is string => Boolean(id));

  const subIds = Array.from(new Set([...unlockedSubIds, ...attemptSubIds]));

  const subCompetencies = await Promise.all(
    subIds.map(async (id) => ({ id, data: await subCompetencyRepository.findById(id, false) })),
  );

  const subMap = new Map<string, SubCompetency>();
  subCompetencies.forEach(({ id, data }) => {
    if (data) {
      subMap.set(id, data);
    } else {
      console.warn('Missing sub-competency for id', id);
    }
  });

  Object.keys(busyMap).forEach((key) => delete busyMap[key]);
  Object.keys(subCompetenciesByEvaluation).forEach(
    (key) => delete subCompetenciesByEvaluation[key],
  );

  const evaluationMap = new Map<string, Evaluation>();

  subMap.forEach((sub) => {
    sub.evaluations.forEach((evaluation) => {
      evaluationMap.set(evaluation.id, evaluation);
      subCompetenciesByEvaluation[evaluation.id] = sub;
    });
  });

  (user.evaluationAttempts ?? []).forEach((attempt) => {
    if (!attempt.evaluation) return;
    const evaluationId = attempt.evaluation.id;
    let evaluation = evaluationMap.get(evaluationId);
    if (!evaluation) {
      evaluation =
        attempt.evaluation instanceof Evaluation
          ? attempt.evaluation
          : new Evaluation(attempt.evaluation);
      evaluationMap.set(evaluation.id, evaluation);
      if (!subCompetenciesByEvaluation[evaluation.id]) {
        subCompetenciesByEvaluation[evaluation.id] = subMap.get(evaluation.subCompetencyId ?? '');
      }
    }

    attachAttemptToEvaluation(evaluation, attempt);
  });

  evaluations.value = Array.from(evaluationMap.values());
  syncStudentEvaluations();
}

function findAttempt(evaluation: Evaluation): EvaluationAttempt | null {
  if (evaluation.attempts && currentStudentId.value) {
    const match = evaluation.attempts.find(
      (attempt) => attempt.studentId === currentStudentId.value,
    );
    return match ?? null;
  }
  return null;
}

async function handleOpen(evaluation: Evaluation): Promise<void> {
  await openEvaluationAction(evaluation);
}

async function handleStudentStart(evaluation: Evaluation): Promise<void> {
  await startEvaluationAction(evaluation);
}

async function handleStudentComplete(evaluation: Evaluation): Promise<void> {
  await completeEvaluationAction(evaluation);
}

function updateTargetUserAttempt(attempt: EvaluationAttempt): void {
  if (!targetUser.value) return;
  if (!Array.isArray(targetUser.value.evaluationAttempts)) {
    targetUser.value.evaluationAttempts = [attempt];
    return;
  }
  const index = targetUser.value.evaluationAttempts.findIndex((entry) => entry.id === attempt.id);
  if (index === -1) {
    targetUser.value.evaluationAttempts.push(attempt);
  } else {
    targetUser.value.evaluationAttempts.splice(index, 1, attempt);
  }
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AssessmentsPage',
});
</script>
