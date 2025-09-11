<template>
  <div class="row q-gutter-md q-mt-lg">
    <div v-for="stat in statsConfig" :key="stat.key" class="col-12 col-sm-6 col-md-3">
      <stat-card v-bind="stat" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import StatCard from '../ui/StatCard.vue';

export interface UserStats {
  total: number;
  active: number;
  newThisMonth: number;
  onlineNow: number;
}

export interface UserStatsCardsProps {
  stats: UserStats;
}

const props = defineProps<UserStatsCardsProps>();

/**
 * Configuration for statistics cards
 */
const statsConfig = computed(() => [
  {
    key: 'total',
    icon: 'people',
    color: 'blue',
    value: props.stats.total,
    label: 'Total Users',
  },
  {
    key: 'active',
    icon: 'check_circle',
    color: 'green',
    value: props.stats.active,
    label: 'Active Users',
  },
  {
    key: 'newThisMonth',
    icon: 'person_add',
    color: 'purple',
    value: props.stats.newThisMonth,
    label: 'New This Month',
  },
  {
    key: 'onlineNow',
    icon: 'schedule',
    color: 'orange',
    value: props.stats.onlineNow,
    label: 'Online Now',
  },
]);
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'UserStatsCards',
});
</script>
