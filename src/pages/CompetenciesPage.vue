<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg row items-center q-gutter-sm">
      <q-icon name="psychology" />
      <span>{{ t('competencies.title') }}</span>
    </div>

    <q-banner v-if="errorMessage" class="bg-negative text-white q-mb-md">
      {{ errorMessage }}
    </q-banner>

    <div v-if="targetUser && viewer && targetUser.id !== viewer.id" class="text-body2 q-mb-md">
      {{ t('competencies.viewingFor', { name: targetUser.name }) }}
    </div>

    <div v-if="summaryCardsToShow.length" class="row q-col-gutter-md q-mb-lg">
      <div v-for="card in summaryCardsToShow" :key="card.key" class="col-6 col-md-3">
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
      :search-placeholder="t('competencies.searchPlaceholder')"
      :status-label="t('common.status')"
      :domain-label="t('domains.title')"
    />

    <div class="row q-col-gutter-md">
      <div v-for="sub in filteredSubCompetencies" :key="sub.id" class="col-12 col-md-6">
        <sub-competency-card
          class="full-height"
          :sub="sub"
          :show-open="allowActions"
          :show-edit="false"
          :show-delete="false"
          :show-student-progress="displayProgress"
          :show-context="true"
          @open="handleOpen"
        />
      </div>
    </div>

    <div v-if="!loading && filteredSubCompetencies.length === 0" class="text-center q-mt-xl">
      <q-icon name="psychology" size="80px" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">{{ t('subCompetencies.emptyState') }}</div>
      <div class="text-body2 text-grey-6">{{ t('competencies.searchPlaceholder') }}</div>
    </div>

    <q-inner-loading :showing="loading">
      <q-spinner-tail color="primary" size="64px" />
    </q-inner-loading>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import SearchStatusDomainFilters from 'src/components/common/SearchStatusDomainFilters.vue';
import SubCompetencyCard from 'src/components/competency/SubCompetencyCard.vue';
import DashboardStatCard from 'src/components/dashboard/DashboardStatCard.vue';
import { useUsers } from 'src/composables/useUsers';
import { subCompetencyRepository } from 'src/models/repositories/SubCompetencyRepository';
import type { SubCompetency } from 'src/models/SubCompetency';
import type { User } from 'src/models/User';
import { UserRole } from 'src/models/User';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const { getCurrentUser, getUserById } = useUsers();

const loading = ref(false);
const errorMessage = ref<string | null>(null);
const searchQuery = ref('');
const statusFilter = ref<string | null>(null);
const domainFilter = ref<string | null>(null);
const subCompetencies = ref<SubCompetency[]>([]);
const viewer = ref<User | null>(null);
const targetUser = ref<User | null>(null);

const normalizedSearch = computed(() => searchQuery.value.trim().toLowerCase());

const isTargetStudent = computed(() => targetUser.value?.role === UserRole.STUDENT);
const viewingSelf = computed(() => {
  const paramId = route.params.userId as string | undefined;
  if (!paramId) {
    return viewer.value && targetUser.value && viewer.value.id === targetUser.value.id;
  }
  return viewer.value?.id === targetUser.value?.id && viewer.value?.id === paramId;
});

const allowActions = computed(() => {
  if (!isTargetStudent.value) return false;
  const role = viewer.value?.role;
  if (role === UserRole.EDUCATOR) return true;
  if (role === UserRole.STUDENT && viewingSelf.value) return true;
  return false;
});

const displayProgress = computed(() => isTargetStudent.value);

const statusOptions = computed(() => {
  const statuses = new Set<string>();
  subCompetencies.value.forEach((sub) => statuses.add(sub.getStatus()));
  return Array.from(statuses).map((status) => ({
    label: t(`progressStatus.${status}`),
    value: status,
  }));
});

const domainOptions = computed(() => {
  const domains = new Set<string>();
  subCompetencies.value.forEach((sub) => {
    const domainName = sub.competency?.domain?.name ?? t('domains.title');
    domains.add(domainName);
  });
  return Array.from(domains).map((domain) => ({ label: domain, value: domain }));
});

const statusSummary = computed(() => {
  const summary = {
    total: subCompetencies.value.length,
    validated: 0,
    inProgress: 0,
    pending: 0,
    notStarted: 0,
    locked: 0,
  };

  subCompetencies.value.forEach((sub) => {
    const status = sub.getStatus();
    switch (status) {
      case 'Validated':
        summary.validated += 1;
        break;
      case 'InProgress':
        summary.inProgress += 1;
        break;
      case 'PendingValidation':
        summary.pending += 1;
        break;
      case 'NotStarted':
        summary.notStarted += 1;
        break;
      case 'Locked':
        summary.locked += 1;
        break;
      default:
        break;
    }
  });

  return summary;
});

const SUMMARY_CARD_ICONS: Record<string, string> = {
  total: 'psychology',
  validated: 'check_circle',
  inProgress: 'schedule',
  pending: 'schedule',
  locked: 'lock',
  notStarted: 'schedule',
};

const SUMMARY_CARD_DISPLAY_LIMIT = 4;

const summaryCards = computed(() => {
  const summary = statusSummary.value;
  const cards = [
    {
      key: 'total',
      caption: t('competencies.summary.total'),
      value: summary.total,
      icon: SUMMARY_CARD_ICONS.total,
      color: 'primary',
    },
    {
      key: 'validated',
      caption: t('competencies.summary.validated'),
      value: summary.validated,
      icon: SUMMARY_CARD_ICONS.validated,
      color: 'positive',
    },
    {
      key: 'inProgress',
      caption: t('competencies.summary.inProgress'),
      value: summary.inProgress,
      icon: SUMMARY_CARD_ICONS.inProgress,
      color: 'info',
    },
    {
      key: 'pending',
      caption: t('competencies.summary.pending'),
      value: summary.pending,
      icon: SUMMARY_CARD_ICONS.pending,
      color: 'accent',
    },
    {
      key: 'locked',
      caption: t('competencies.summary.locked'),
      value: summary.locked,
      icon: SUMMARY_CARD_ICONS.locked,
      color: 'grey',
    },
    {
      key: 'notStarted',
      caption: t('competencies.summary.notStarted'),
      value: summary.notStarted,
      icon: SUMMARY_CARD_ICONS.notStarted,
      color: 'grey',
    },
  ];
  return cards
    .filter((card) => card.key === 'total' || card.value > 0)
    .map((card) => ({ ...card, icon: card.icon ?? '' })); // always provide a string for icon
});

const summaryCardsToShow = computed(() => summaryCards.value.slice(0, SUMMARY_CARD_DISPLAY_LIMIT));

const filteredSubCompetencies = computed(() => {
  const status = statusFilter.value;
  const domain = domainFilter.value;

  return subCompetencies.value
    .filter((sub) => {
      if (status && sub.getStatus() !== status) {
        return false;
      }

      const domainName = sub.competency?.domain?.name ?? t('domains.title');
      if (domain && domainName !== domain) {
        return false;
      }

      if (!normalizedSearch.value) {
        return true;
      }

      const haystack = [sub.name, sub.description ?? '', sub.competency?.name ?? '', domainName]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch.value);
    })
    .sort((a, b) => {
      const domainA = a.competency?.domain?.name ?? '';
      const domainB = b.competency?.domain?.name ?? '';
      if (domainA !== domainB) {
        return domainA.localeCompare(domainB);
      }
      const levelA = typeof a.level === 'number' ? a.level : 0;
      const levelB = typeof b.level === 'number' ? b.level : 0;
      if (levelA !== levelB) {
        return levelA - levelB;
      }
      return a.name.localeCompare(b.name);
    });
});

async function load(): Promise<void> {
  loading.value = true;
  errorMessage.value = null;
  subCompetencies.value = [];
  try {
    const loggedIn = await getCurrentUser();
    viewer.value = loggedIn;

    const requestedUserId = route.params.userId as string | undefined;
    let resolvedTarget: User | null = null;

    if (requestedUserId) {
      if (loggedIn?.id === requestedUserId) {
        resolvedTarget = loggedIn;
      } else {
        resolvedTarget = await getUserById(requestedUserId);
      }
    } else {
      resolvedTarget = loggedIn;
    }

    targetUser.value = resolvedTarget;

    if (!resolvedTarget || resolvedTarget.role !== UserRole.STUDENT) {
      return;
    }

    const progressIds = Array.from(
      new Set(
        (resolvedTarget.studentProgress ?? [])
          .map((progress) => progress.subCompetencyId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    if (progressIds.length === 0) {
      return;
    }

    const fetched = await Promise.all(
      progressIds.map(async (id) => {
        const sub = await subCompetencyRepository.findById(id);
        if (sub && resolvedTarget) {
          sub.attachUserProgress(resolvedTarget);
        }
        return sub;
      }),
    );

    subCompetencies.value = fetched.filter((entry): entry is SubCompetency => entry !== null);
  } catch (error) {
    console.error('Failed to load competencies', error);
    const message = error instanceof Error ? error.message : t('competencies.messages.loadError');
    errorMessage.value = message;
    $q.notify({ type: 'negative', message });
  } finally {
    loading.value = false;
  }
}

async function handleOpen(subId: string): Promise<void> {
  if (!allowActions.value) {
    return;
  }
  const target = subCompetencies.value.find((sub) => sub.id === subId);
  if (!target) {
    return;
  }
  await router.push({
    name: 'sub-competency',
    params: { competencyId: target.competencyId, subId },
  });
}

onMounted(() => {
  void load();
});

watch(
  () => route.params.userId,
  () => {
    void load();
  },
);
</script>

<style scoped></style>
