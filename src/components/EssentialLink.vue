<template>
  <q-item clickable v-bind="linkAttributes">
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface EssentialLinkProps {
  title: string;
  caption?: string;
  link?: string;
  icon?: string;
}

const props = withDefaults(defineProps<EssentialLinkProps>(), {
  caption: '',
  link: '#',
  icon: '',
});

/**
 * Dynamic attributes for the q-item based on link type
 */
const linkAttributes = computed(() => {
  if (!props.link || props.link === '#') {
    return {};
  }

  // Internal links start with '/' and don't include protocol
  const isInternal = props.link.startsWith('/') && !props.link.includes('://');

  return isInternal
    ? { to: props.link, exact: true }
    : { tag: 'a', href: props.link, target: '_blank' };
});
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'EssentialLink',
});
</script>
