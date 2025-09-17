<template>
  <div class="row q-col-gutter-md q-mt-lg">
    <div v-for="stat in statsConfig" :key="stat.key" class="col-12 col-sm-6 col-md-3">
      <stat-card v-bind="stat" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserRole } from 'src/models/User';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import StatCard from '../ui/StatCard.vue';

type StatsUser = {
  role: UserRole;
  createdAt?: string | undefined;
  lastActive?: string | undefined;
};

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const MILLISECONDS_PER_SECOND = 1000;
const ONE_HOUR_IN_MS = MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

const props = defineProps<{ users: StatsUser[] }>();

const { t } = useI18n();

const stats = computed(() => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalUsers = props.users.length;
  const studentCount = props.users.filter((user) => user.role === UserRole.STUDENT).length;
  const newThisMonthCount = props.users.filter((user) => {
    if (!user.createdAt) return false;
    const createdDate = new Date(user.createdAt);
    if (Number.isNaN(createdDate.getTime())) {
      return false;
    }
    return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
  }).length;
  const onlineNowCount = props.users.filter((user) => {
    if (!user.lastActive) return false;
    const lastActiveDate = new Date(user.lastActive);
    if (Number.isNaN(lastActiveDate.getTime())) {
      return false;
    }
    return now.getTime() - lastActiveDate.getTime() <= ONE_HOUR_IN_MS;
  }).length;

  return {
    total: totalUsers,
    students: studentCount,
    newThisMonth: newThisMonthCount,
    onlineNow: onlineNowCount,
  };
});

/**
 * Configuration for statistics cards
 */
const statsConfig = computed(() => [
  {
    key: 'total',
    icon: 'people',
    color: 'blue',
    value: stats.value.total,
    label: t('admin.stats.totalUsers'),
  },
  {
    key: 'active',
    icon: 'check_circle',
    color: 'green',
    value: stats.value.students,
    label: t('admin.stats.students'),
  },
  {
    key: 'newThisMonth',
    icon: 'person_add',
    color: 'purple',
    value: stats.value.newThisMonth,
    label: t('admin.stats.newThisMonth'),
  },
  {
    key: 'onlineNow',
    icon: 'schedule',
    color: 'orange',
    value: stats.value.onlineNow,
    label: t('admin.stats.onlineNow'),
  },
]);
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'UserStatsCards',
});
</script>
