<template>
  <q-btn
    flat
    dense
    round
    icon="notifications"
    :loading="loading"
    @click="goToInbox"
    aria-label="Notifications"
  >
    <q-badge v-if="unreadCount > 0" color="negative" text-color="white" floating>
      {{ unreadCount }}
    </q-badge>
    <q-tooltip>{{ t('messaging.notifications.tooltip') }}</q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { useMessaging } from 'src/composables/useMessaging';
import { useUsers } from 'src/composables/useUsers';
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const unreadCount = ref(0);
const loading = ref(false);
const currentUserId = ref<string | null>(null);

const { getCurrentUser } = useUsers();
const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const { getUnreadCount } = useMessaging();

async function refresh(): Promise<void> {
  console.log('refresh');
  if (!currentUserId.value) return;
  loading.value = true;
  try {
    unreadCount.value = await getUnreadCount(currentUserId.value);
  } finally {
    loading.value = false;
  }
}

async function initialise(): Promise<void> {
  const user = await getCurrentUser();
  currentUserId.value = user?.id ?? null;
  await refresh();
}

function goToInbox(): void {
  void router.push({ path: '/messages' });
}

onMounted(() => {
  void initialise();
});
const WAITING_TIME = 5000;
watch(
  () => route.fullPath,
  () => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(refresh, WAITING_TIME);
  },
);

defineExpose({ refresh });
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'NotificationBell',
});
</script>
