<template>
  <q-card>
    <q-card-section class="text-center">
      <q-icon :name="icon" size="2em" :color="color" />
      <div class="text-h5 q-mt-sm">{{ value }}</div>
      <div class="text-subtitle2">{{ label }}</div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
export interface StatCardProps {
  icon: string;
  color: string;
  value: number | string;
  label: string;
}

withDefaults(defineProps<StatCardProps>(), {
  color: 'primary',
});
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'StatCard',
});
</script>
