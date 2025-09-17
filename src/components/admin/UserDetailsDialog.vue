<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 360px">
      <q-card-section class="row items-center justify-between text-subtitle1 text-primary">
        <span>{{ t('admin.userDetails') }}</span>
        <q-btn flat dense round icon="close" @click="handleClose" />
      </q-card-section>

      <q-card-section class="row items-center q-gutter-sm">
        <user-avatar v-if="user" :user="user" size="64px" />
        <div class="column">
          <div class="text-h6">{{ user?.name }}</div>
          <div class="text-body2 text-grey-7">{{ user?.email }}</div>
        </div>
      </q-card-section>

      <q-card-section v-if="user">
        <q-list dense>
          <q-item>
            <q-item-section>
              <div class="text-caption text-grey-7">{{ t('common.role') }}</div>
              <div>{{ user.role }}</div>
            </q-item-section>
          </q-item>
          <q-item v-if="user.contactInfo">
            <q-item-section>
              <div class="text-caption text-grey-7">{{ t('admin.contactInfo') }}</div>
              <div class="text-body2" style="white-space: pre-wrap">{{ user.contactInfo }}</div>
            </q-item-section>
          </q-item>
          <q-item v-if="user.lastActive">
            <q-item-section>
              <div class="text-caption text-grey-7">{{ t('admin.lastActive') }}</div>
              <div>{{ formatLastActive(user.lastActive) }}</div>
            </q-item-section>
          </q-item>
          <q-item v-if="user.createdAt">
            <q-item-section>
              <div class="text-caption text-grey-7">{{ t('admin.memberSince') }}</div>
              <div>{{ formatDate(user.createdAt) }}</div>
            </q-item-section>
          </q-item>
          <q-item v-if="user.picture">
            <q-img
              :src="picturePreview"
              :ratio="1"
              class="profile-picture-preview"
              spinner-color="primary"
              :alt="t('profile.uploadPhoto')"
            />
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat :label="t('common.close')" color="primary" @click="handleClose" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import UserAvatar from 'src/components/ui/UserAvatar.vue';
import { useUserFormatters } from 'src/composables/useUserFormatters';
import type { User } from 'src/models/User';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type UserDetailsUser = Pick<User, 'name' | 'email' | 'role' | 'avatar'> & {
  contactInfo?: string | null;
  createdAt?: string | undefined;
  lastActive?: string | undefined;
  picture?: string | null;
};

const props = defineProps<{
  modelValue: boolean;
  user: UserDetailsUser | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

const { formatLastActive, resolvePictureUrl } = useUserFormatters();
const { t } = useI18n();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    emit('update:modelValue', value);
    if (!value) {
      emit('close');
    }
  },
});

function handleClose(): void {
  emit('update:modelValue', false);
  emit('close');
}

function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toLocaleDateString();
}

const picturePreview = ref<string | undefined>();
watch(
  () => props.user?.picture,
  async (picture) => {
    const resolvedUrl = await resolvePictureUrl(picture ?? null);
    picturePreview.value = resolvedUrl || undefined;
  },
  { immediate: true },
);
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'UserDetailsDialog',
});
</script>
