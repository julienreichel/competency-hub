<template>
  <q-avatar :size="size">
    <q-img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
    <span v-else>{{ userInitials }}</span>
  </q-avatar>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface User {
  name: string;
  avatar?: string;
}

export interface UserAvatarProps {
  user: User;
  size?: string;
}

const props = withDefaults(defineProps<UserAvatarProps>(), {
  size: '40px',
});

/**
 * Generate user initials from name
 */
const userInitials = computed((): string => {
  return props.user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
});
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'UserAvatar',
});
</script>
