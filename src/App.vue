<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { configureAmplify } from './boot/amplify';

/**
 * Initialize application
 */
onMounted(() => {
  configureAmplify();
});
</script>
