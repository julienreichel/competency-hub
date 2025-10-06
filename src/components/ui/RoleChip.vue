<template>
  <q-chip :color="roleColor" text-color="white" :size="size" :dense="dense" class="role-chip">
    <q-icon v-if="showIcon" :name="roleIcon" size="16px" class="q-mr-xs" />
    <slot>{{ roleLabel }}</slot>
  </q-chip>
</template>

<script setup lang="ts">
import { computed, withDefaults } from 'vue';
import { useI18n } from 'vue-i18n';

export type RoleChipRole = 'Student' | 'Educator' | 'Parent' | 'Admin' | 'Unknown';

export interface RoleChipProps {
  role: RoleChipRole;
  dense?: boolean;
  size?: string;
  showIcon?: boolean;
}

const props = withDefaults(defineProps<RoleChipProps>(), {
  dense: false,
  size: 'sm',
  showIcon: true,
});

const { t } = useI18n();

const roleColor = computed((): string => {
  switch (props.role) {
    case 'Admin':
      return 'warning';
    case 'Educator':
      return 'accent';
    case 'Parent':
      return 'secondary';
    case 'Student':
      return 'info';
    default:
      return 'grey';
  }
});

const roleIcon = computed((): string => {
  switch (props.role) {
    case 'Admin':
      return 'admin_panel_settings';
    case 'Educator':
      return 'psychology';
    case 'Parent':
      return 'family_restroom';
    case 'Student':
      return 'school';
    default:
      return 'person';
  }
});

const roleLabel = computed(() => t(`roles.${props.role.toLowerCase()}`));
</script>

<style scoped>
.role-chip {
  font-weight: 500;
}
</style>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'RoleChip',
});
</script>
