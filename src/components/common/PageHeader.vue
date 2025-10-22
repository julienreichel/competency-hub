<template>
  <div class="row items-center justify-between page-header q-mb-lg">
    <div>
      <div class="row q-gutter-sm page-header__title">
        <q-icon v-if="icon" :name="icon" class="page-header__icon" />
        <div :class="['text-h4 text-weight-medium', titleClass]">
          <slot name="title">
            {{ title }}
          </slot>
        </div>
      </div>
      <div class="text-caption text-grey-7">
        <slot name="subtitle">
          {{ subtitle }}
        </slot>
      </div>
      <slot name="subtitle" />
    </div>
    <div class="row items-center q-gutter-sm page-header__actions">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    icon?: string;
    titleClass?: string;
  }>(),
  {
    title: '',
    subtitle: '',
    icon: '',
    titleClass: '',
  },
);
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PageHeader',
});
</script>

<style scoped>
.page-header__icon {
  font-size: 32px;
  padding-top: 4px;
}

.page-header__title {
  min-height: 48px;
}

.page-header__actions > * {
  margin-bottom: 0;
}
</style>
