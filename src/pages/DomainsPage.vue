<template>
  <q-page class="q-pa-lg column q-gutter-lg">
    <div class="row items-center justify-between">
      <div>
        <div class="text-h5">{{ $t('domains.title') }}</div>
        <div class="text-caption text-grey-7">{{ $t('domains.subtitle') }}</div>
      </div>
      <q-btn
        v-if="hasRole('Admin')"
        color="secondary"
        icon="add"
        :label="$t('domains.addDomain')"
        class="self-end"
        @click="openCreateDialog"
      />
    </div>

    <domain-list
      :domains="domains"
      :loading="loading"
      @edit="openEditDialog"
      @select="goToDomain"
    />

    <domain-dialog
      v-model="dialog.open"
      :mode="dialog.mode"
      :form="form"
      @submit="submitDialog"
      @cancel="closeDialog"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import DomainDialog from 'src/components/domain/DomainDialog.vue';
import DomainList from 'src/components/domain/DomainList.vue';
import { useAuth } from 'src/composables/useAuth';
import type { Domain } from 'src/models/Domain';
import { domainRepository } from 'src/models/repositories/DomainRepository';
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();
const { t } = useI18n();
const { hasRole } = useAuth();

const domains = ref<Domain[]>([]);
const loading = ref(false);

const dialog = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  targetId: '' as string,
  loading: false,
});

const form = reactive({
  name: '',
  colorCode: null as string | null,
});

async function loadDomains(): Promise<void> {
  loading.value = true;
  try {
    domains.value = await domainRepository.findAll();
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: t('domains.messages.error') });
  } finally {
    loading.value = false;
  }
}

function openCreateDialog(): void {
  dialog.open = true;
  dialog.mode = 'create';
  dialog.targetId = '';
  form.name = '';
  form.colorCode = null;
}

function openEditDialog(domain: Pick<Domain, 'id' | 'name' | 'colorCode'>): void {
  dialog.open = true;
  dialog.mode = 'edit';
  dialog.targetId = domain.id;
  form.name = domain.name;
  form.colorCode = domain.colorCode ?? null;
}

function closeDialog(): void {
  dialog.open = false;
}

async function submitDialog(form: { name: string; colorCode: string | null }): Promise<void> {
  const trimmedName = form.name.trim();
  if (!trimmedName) {
    $q.notify({ type: 'warning', message: t('validation.required') });
    return;
  }

  dialog.loading = true;
  try {
    if (dialog.mode === 'create') {
      const created = await domainRepository.create({
        name: trimmedName,
        colorCode: form.colorCode ?? null,
      });
      domains.value = [...domains.value, created];
      $q.notify({ type: 'positive', message: t('domains.messages.created') });
    } else {
      const updated = await domainRepository.update(dialog.targetId, {
        name: trimmedName,
        colorCode: form.colorCode ?? null,
      });
      domains.value = domains.value.map((domain) => (domain.id === updated.id ? updated : domain));
      $q.notify({ type: 'positive', message: t('domains.messages.updated') });
    }
    closeDialog();
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: t('domains.messages.error') });
  } finally {
    dialog.loading = false;
  }
}

function goToDomain(domainId: string): void {
  void router.push({ name: 'domain', params: { domainId } });
}

onMounted(() => {
  void loadDomains();
});
</script>

<style scoped>
.domain-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}
</style>
