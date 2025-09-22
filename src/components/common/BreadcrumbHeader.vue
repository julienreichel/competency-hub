<template>
  <div class="row items-center q-gutter-sm q-mb-md">
    <q-btn flat round icon="arrow_back" color="primary" @click="goBack" />
    <div class="column">
      <q-breadcrumbs v-if="breadcrumbs?.length" class="text-grey-7">
        <q-breadcrumbs-el
          v-for="(crumb, idx) in breadcrumbs"
          :key="idx"
          :label="crumb.label"
          v-bind="crumb.to ? { to: crumb.to } : {}"
        />
      </q-breadcrumbs>
      <div class="text-h5">
        {{ title }}
      </div>
    </div>
    <q-space />
    <q-spinner v-if="loading" size="sm" />
  </div>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import { useRouter } from 'vue-router';

interface Breadcrumb {
  label: string;
  to?: RouteLocationRaw;
}

const props = defineProps<{
  breadcrumbs?: Breadcrumb[];
  title?: string;
  loading?: boolean;
  backTarget?: RouteLocationRaw;
}>();

const router = useRouter();
async function goBack(): Promise<void> {
  if (props.backTarget) {
    await router.push(props.backTarget);
  } else {
    router.back();
  }
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BreadcrumbHeader',
});
</script>

<style scoped></style>
