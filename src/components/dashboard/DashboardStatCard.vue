<template>
  <q-card flat bordered class="full-height">
    <q-card-section class="row items-center justify-between">
      <div>
        <div class="text-caption text-grey-7">{{ title }}</div>
        <div class="text-h5">{{ value }}</div>
      </div>
      <q-icon v-if="icon" :name="icon" :color="iconColor || 'primary'" size="32px" />
    </q-card-section>
    <q-separator v-if="caption" inset />
    <q-card-section v-if="caption" class="text-caption text-grey-6">
      {{ caption }}
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  value: string | number;
  caption?: string;
  icon?: string;
  iconColor?: string;
}>();
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'DashboardStatCard',
});
</script>
