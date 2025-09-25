<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4">{{ greeting }}</div>
        <div v-if="subtitle" class="text-subtitle2 text-grey-6">{{ subtitle }}</div>
      </div>
    </div>

    <q-inner-loading :showing="pageLoading">
      <q-spinner-tail color="primary" size="64px" />
    </q-inner-loading>

    <template v-if="!pageLoading">
      <div v-if="summaryCards.length" class="row q-col-gutter-md q-mb-lg">
        <div
          v-for="card in summaryCards"
          :key="card.title"
          class="col-12 col-sm-6 col-md-4 col-lg-3"
        >
          <dashboard-stat-card v-bind="card" />
        </div>
      </div>

      <div class="row q-col-gutter-lg">
        <div v-if="!hasRole('Admin')" class="col-12 col-lg-8">
          <q-card>
            <q-card-section class="row items-center justify-between">
              <div class="text-h6">{{ t('dashboard.recentActivity') }}</div>
            </q-card-section>
            <q-separator />
            <q-list v-if="recentActivities.length">
              <q-item v-for="activity in recentActivities" :key="activity.id">
                <q-item-section>
                  <div class="text-body1">{{ activity.title }}</div>
                  <div class="text-caption text-grey-6">{{ activity.subtitle }}</div>
                  <div class="text-caption text-grey-5">{{ activity.timestamp }}</div>
                </q-item-section>
                <q-item-section side top>
                  <q-badge :color="activity.statusColor" :label="activity.statusLabel" />
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-caption text-grey-6 q-pa-md">
              {{ t('dashboard.noRecentActivity') }}
            </div>
          </q-card>
        </div>

        <div class="col-12 col-lg-4" v-if="quickActions.length">
          <q-card>
            <q-card-section>
              <div class="text-h6">{{ t('dashboard.quickActions') }}</div>
            </q-card-section>
            <q-card-section class="column q-gutter-sm">
              <q-btn
                v-for="action in quickActions"
                :key="action.label"
                :color="action.color || 'primary'"
                outline
                align="left"
                :icon="action.icon"
                :label="action.label"
                @click="handleQuickAction(action)"
              />
            </q-card-section>
          </q-card>
        </div>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import DashboardStatCard from 'src/components/dashboard/DashboardStatCard.vue';
import { useAuth } from 'src/composables/useAuth';
import { useUsers } from 'src/composables/useUsers';
import { subCompetencyRepository } from 'src/models/repositories/SubCompetencyRepository';
import type { StudentSubCompetencyProgress } from 'src/models/StudentSubCompetencyProgress';
import { UserRole, type User } from 'src/models/User';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

interface DashboardCardProps {
  title: string;
  value: string | number;
  caption?: string;
  icon?: string;
  iconColor?: string;
}

interface QuickAction {
  label: string;
  icon: string;
  color?: string;
  to: string;
}

interface RecentActivity {
  id: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusColor: string;
  timestamp: string;
}

interface ProgressContext {
  progress: StudentSubCompetencyProgress;
  actor?: string;
}

const RECENT_ACTIVITY_LIMIT = 10;

const router = useRouter();
const { t } = useI18n();
const { userFullName, hasRole } = useAuth();
const { getCurrentUser, getUserById, fetchUsers } = useUsers();

const pageLoading = ref(true);
const currentUser = ref<User | null>(null);
const allUsers = ref<User[]>([]);
const summaryCards = ref<DashboardCardProps[]>([]);
const quickActions = ref<QuickAction[]>([]);
const recentActivities = ref<RecentActivity[]>([]);

const greeting = computed(() =>
  t('dashboard.welcome', { name: userFullName.value || t('dashboard.defaultName') }),
);

const subtitle = computed(() => {
  const role = currentUser.value?.role;
  switch (role) {
    case UserRole.STUDENT:
      return t('dashboard.subtitle.student');
    case UserRole.PARENT:
      return t('dashboard.subtitle.parent');
    case UserRole.EDUCATOR:
      return t('dashboard.subtitle.educator');
    case UserRole.ADMIN:
      return t('dashboard.subtitle.admin');
    default:
      return '';
  }
});

onMounted(() => {
  void loadDashboard();
});

async function loadDashboard(): Promise<void> {
  pageLoading.value = true;
  try {
    const user = await getCurrentUser();
    currentUser.value = user;
    if (!user) {
      summaryCards.value = [];
      recentActivities.value = [];
      quickActions.value = [];
      return;
    }

    if (user.role === UserRole.ADMIN) {
      allUsers.value = await fetchUsers();
    }

    if (user.role === UserRole.EDUCATOR) {
      if (Array.isArray(user.students) && user.students.length) {
        const detailedStudents = await Promise.all(
          user.students.map(async (student) => {
            const detailed = await getUserByIdSafe(student.id);
            return detailed ?? student;
          }),
        );
        user.students = detailedStudents;
      }
    }

    if (user.role === UserRole.PARENT) {
      if (Array.isArray(user.children) && user.children.length) {
        const detailedChildren = await Promise.all(
          user.children.map(async (child) => {
            const detailed = await getUserByIdSafe(child.id);
            return detailed ?? child;
          }),
        );
        user.children = detailedChildren;
      }
    }

    const resolvedUser = currentUser.value ?? user;

    summaryCards.value = buildSummaryCards(resolvedUser);
    quickActions.value = buildQuickActions(resolvedUser.role);
    recentActivities.value = await buildRecentActivities(resolvedUser);
  } catch (error) {
    console.error('Failed to load dashboard', error);
  } finally {
    pageLoading.value = false;
  }
}

async function getUserByIdSafe(id: string): Promise<User | null> {
  try {
    return await getUserById(id);
  } catch (error) {
    console.error('Failed to fetch user by id', id, error);
    return null;
  }
}

function buildSummaryCards(user: User): DashboardCardProps[] {
  switch (user.role) {
    case UserRole.STUDENT:
      return studentSummary(user);
    case UserRole.PARENT:
      return parentSummary(user);
    case UserRole.EDUCATOR:
      return educatorSummary(user);
    case UserRole.ADMIN:
      return adminSummary();
    default:
      return [];
  }
}

function buildQuickActions(role: UserRole | undefined): QuickAction[] {
  switch (role) {
    case UserRole.STUDENT:
      return [
        {
          label: t('dashboard.actions.myCompetencies'),
          icon: 'psychology',
          to: '/me/competencies',
        },
        { label: t('dashboard.actions.viewAssessments'), icon: 'quiz', to: '/assessments' },
        { label: t('dashboard.actions.viewReports'), icon: 'assessment', to: '/reports' },
      ];
    case UserRole.PARENT:
      return [
        { label: t('dashboard.actions.viewChildren'), icon: 'family_restroom', to: '/children' },
        { label: t('dashboard.actions.viewAssessments'), icon: 'quiz', to: '/assessments' },
        { label: t('dashboard.actions.viewReports'), icon: 'assessment', to: '/reports' },
      ];
    case UserRole.EDUCATOR:
      return [
        { label: t('dashboard.actions.manageStudents'), icon: 'groups', to: '/educator/students' },
        {
          label: t('dashboard.actions.viewAssessments'),
          icon: 'assignment',
          to: '/educator/assessments',
        },
        { label: t('dashboard.actions.viewReports'), icon: 'insights', to: '/reports' },
      ];
    case UserRole.ADMIN:
      return [
        {
          label: t('dashboard.actions.manageUsers'),
          icon: 'admin_panel_settings',
          to: '/admin/users',
        },
        { label: t('dashboard.actions.manageDomains'), icon: 'category', to: '/domains' },
        { label: t('dashboard.actions.viewReports'), icon: 'assessment', to: '/reports' },
      ];
    default:
      return [];
  }
}

function studentSummary(user: User): DashboardCardProps[] {
  const progress = normaliseProgress(user.studentProgress);
  const counts = countProgressStatuses(progress);
  const recommended = progress.filter((entry) => entry.recommended).length;

  return [
    {
      title: t('dashboard.cards.totalCompetencies'),
      value: counts.total,
      icon: 'extension',
      iconColor: 'primary',
      caption: t('dashboard.cards.recommended', { count: recommended }),
    },
    {
      title: t('dashboard.cards.validated'),
      value: counts.validated,
      icon: 'verified',
      iconColor: 'positive',
    },
    {
      title: t('dashboard.cards.inProgress'),
      value: counts.inProgress,
      icon: 'autorenew',
      iconColor: 'info',
    },
    {
      title: t('dashboard.cards.pendingValidation'),
      value: counts.pending,
      icon: 'fact_check',
      iconColor: 'warning',
    },
  ];
}

function parentSummary(user: User): DashboardCardProps[] {
  const children = Array.isArray(user.children) ? user.children : [];
  const allProgress = children.flatMap((child) => normaliseProgress(child.studentProgress));
  const counts = countProgressStatuses(allProgress);

  return [
    {
      title: t('dashboard.cards.totalChildren'),
      value: children.length,
      icon: 'family_restroom',
      iconColor: 'primary',
    },
    {
      title: t('dashboard.cards.activeCompetencies'),
      value: counts.inProgress + counts.pending,
      icon: 'insights',
      iconColor: 'info',
    },
    {
      title: t('dashboard.cards.validated'),
      value: counts.validated,
      icon: 'emoji_events',
      iconColor: 'positive',
    },
    {
      title: t('dashboard.cards.pendingReviews'),
      value: counts.pending,
      icon: 'hourglass_top',
      iconColor: 'warning',
    },
  ];
}

function educatorSummary(user: User): DashboardCardProps[] {
  const students = Array.isArray(user.students) ? user.students : [];
  const allProgress = students.flatMap((student) => normaliseProgress(student.studentProgress));
  const counts = countProgressStatuses(allProgress);

  return [
    {
      title: t('dashboard.cards.totalStudents'),
      value: students.length,
      icon: 'groups',
      iconColor: 'primary',
    },
    {
      title: t('dashboard.cards.activeCompetencies'),
      value: counts.inProgress,
      icon: 'tune',
      iconColor: 'info',
    },
    {
      title: t('dashboard.cards.pendingReviews'),
      value: counts.pending,
      icon: 'rule',
      iconColor: 'warning',
    },
    {
      title: t('dashboard.cards.locked'),
      value: counts.locked,
      icon: 'lock',
      iconColor: 'negative',
    },
  ];
}

function adminSummary(): DashboardCardProps[] {
  const users = allUsers.value;
  const totals = users.reduce(
    (acc, user) => {
      acc.total += 1;
      switch (user.role) {
        case UserRole.STUDENT:
          acc.students += 1;
          break;
        case UserRole.EDUCATOR:
          acc.educators += 1;
          break;
        case UserRole.PARENT:
          acc.parents += 1;
          break;
        case UserRole.ADMIN:
          acc.admins += 1;
          break;
        default:
          break;
      }
      return acc;
    },
    { total: 0, students: 0, educators: 0, parents: 0, admins: 0 },
  );

  return [
    {
      title: t('dashboard.cards.totalUsers'),
      value: totals.total,
      icon: 'people',
      iconColor: 'primary',
      caption: t('dashboard.cards.adminAdmins', { count: totals.admins }),
    },
    {
      title: t('dashboard.cards.adminStudents'),
      value: totals.students,
      icon: 'school',
      iconColor: 'info',
    },
    {
      title: t('dashboard.cards.adminEducators'),
      value: totals.educators,
      icon: 'psychology',
      iconColor: 'positive',
    },
    {
      title: t('dashboard.cards.adminParents'),
      value: totals.parents,
      icon: 'family_restroom',
      iconColor: 'warning',
    },
  ];
}

async function buildRecentActivities(user: User): Promise<RecentActivity[]> {
  if (user.role === UserRole.ADMIN) {
    return [];
  }

  const contexts: ProgressContext[] = [];

  if (user.role === UserRole.STUDENT) {
    normaliseProgress(user.studentProgress).forEach((progress) =>
      contexts.push({ progress, actor: user.name }),
    );
  }

  if (user.role === UserRole.PARENT) {
    const children = Array.isArray(user.children) ? user.children : [];
    children.forEach((child) => {
      normaliseProgress(child.studentProgress).forEach((progress) =>
        contexts.push({ progress, actor: child.name }),
      );
    });
  }

  if (user.role === UserRole.EDUCATOR) {
    const students = Array.isArray(user.students) ? user.students : [];
    students.forEach((student) => {
      normaliseProgress(student.studentProgress).forEach((progress) =>
        contexts.push({ progress, actor: student.name }),
      );
    });
  }

  if (!contexts.length) return [];

  const sorted = contexts
    .filter((ctx) => ctx.progress.subCompetencyId)
    .sort((a, b) => getProgressTimestamp(b.progress) - getProgressTimestamp(a.progress))
    .slice(0, RECENT_ACTIVITY_LIMIT);

  const ids = Array.from(
    new Set(
      sorted.map((ctx) => ctx.progress.subCompetencyId).filter((id): id is string => Boolean(id)),
    ),
  );

  const nameMap = await resolveSubNames(ids);

  return sorted.map((ctx) => {
    const status = getProgressStatus(ctx.progress);
    const statusLabel = t(`progressStatus.${status}`);
    const statusColor = mapStatusToColor(status);
    const title =
      nameMap.get(ctx.progress.subCompetencyId ?? '') ?? t('dashboard.labels.unknownSub');

    const details: string[] = [];
    if (ctx.actor && user.role !== UserRole.STUDENT) {
      details.push(ctx.actor);
    }
    if (typeof ctx.progress.percent === 'number') {
      details.push(t('dashboard.activityPercent', { percent: Math.round(ctx.progress.percent) }));
    }
    const subtitle = details.length ? details.join(' • ') : t('dashboard.activityDefaultSubtitle');
    const timestamp = formatTimestamp(ctx.progress);

    return {
      id: ctx.progress.id,
      title,
      subtitle,
      statusLabel,
      statusColor,
      timestamp,
    };
  });
}

function normaliseProgress(
  list: StudentSubCompetencyProgress[] | undefined,
): StudentSubCompetencyProgress[] {
  return Array.isArray(list) ? list : [];
}

function countProgressStatuses(progress: StudentSubCompetencyProgress[]): {
  total: number;
  validated: number;
  inProgress: number;
  pending: number;
  locked: number;
} {
  return progress.reduce(
    (acc, entry) => {
      acc.total += 1;
      const status = getProgressStatus(entry);
      switch (status) {
        case 'Validated':
          acc.validated += 1;
          break;
        case 'InProgress':
          acc.inProgress += 1;
          break;
        case 'PendingValidation':
          acc.pending += 1;
          break;
        case 'Locked':
          acc.locked += 1;
          break;
        default:
          break;
      }
      return acc;
    },
    { total: 0, validated: 0, inProgress: 0, pending: 0, locked: 0 },
  );
}

function getProgressStatus(
  progress: StudentSubCompetencyProgress,
): 'Validated' | 'InProgress' | 'PendingValidation' | 'NotStarted' | 'Locked' {
  if (progress.lockOverride === 'Locked') return 'Locked';
  return progress.status ?? 'NotStarted';
}

function mapStatusToColor(status: string): string {
  switch (status) {
    case 'Validated':
      return 'positive';
    case 'InProgress':
      return 'info';
    case 'PendingValidation':
      return 'warning';
    case 'Locked':
      return 'negative';
    default:
      return 'grey';
  }
}

function getProgressTimestamp(progress: StudentSubCompetencyProgress): number {
  const source = progress.updatedAt;
  return source ? new Date(source).getTime() : 0;
}

async function resolveSubNames(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  await Promise.all(
    ids.map(async (id) => {
      try {
        const sub = await subCompetencyRepository.findById(id);
        map.set(id, sub?.name ?? t('dashboard.labels.unknownSub'));
      } catch (error) {
        console.error('Failed to resolve sub-competency name', error);
        map.set(id, t('dashboard.labels.unknownSub'));
      }
    }),
  );
  return map;
}

function formatTimestamp(progress: StudentSubCompetencyProgress): string {
  const source = progress.updatedAt;
  if (!source) return t('dashboard.updatedUnknown');
  const date = new Date(source);
  return t('dashboard.updatedOn', { date: date.toLocaleString() });
}

function handleQuickAction(action: QuickAction): void {
  void router.push(action.to);
}
</script>

<style scoped></style>
