<template>
  <q-btn-group flat data-testid="user-actions-group">
    <q-btn
      flat
      icon="visibility"
      size="sm"
      data-testid="user-actions-view"
      @click="$emit('view', user)"
    >
      <q-tooltip>{{ $t('common.view') }} {{ $t('common.profile') }}</q-tooltip>
    </q-btn>
    <q-btn flat icon="edit" size="sm" data-testid="user-actions-edit" @click="$emit('edit', user)">
      <q-tooltip>{{ $t('common.edit') }} {{ $t('common.user') }}</q-tooltip>
    </q-btn>
    <q-btn flat icon="more_vert" size="sm" data-testid="user-actions-menu">
      <q-menu>
        <q-list>
          <q-item
            clickable
            data-testid="user-actions-view-activity"
            @click="$emit('view-activity', user)"
          >
            <q-item-section>{{ $t('admin.viewActivity') }}</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </q-btn-group>
</template>

<script setup lang="ts">
import type { User } from 'src/models/User';

defineProps<{ user: User }>();

defineEmits<{
  view: [user: User];
  edit: [user: User];
  'view-activity': [user: User];
}>();
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'UserActions',
});
</script>
