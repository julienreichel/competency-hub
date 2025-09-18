<template>
  <q-page class="q-pa-lg column q-gutter-lg">
    <div class="row items-center justify-between">
      <div>
        <div class="text-h5">{{ $t('domains.title') }}</div>
        <div class="text-caption text-grey-7">{{ $t('domains.subtitle') }}</div>
      </div>
      <q-btn
        v-if="hasRole('Admin')"
        color="primary"
        icon="add"
        :label="$t('domains.addDomain')"
        class="self-end"
        @click="openCreateDialog"
      />
    </div>

    <q-card flat bordered class="q-pa-md">
      <div class="row q-col-gutter-md">
        <div v-if="loading" class="q-pa-lg column items-center justify-center full-width">
          <q-spinner color="primary" size="32px" />
          <div class="text-caption text-grey-7 q-mt-sm">{{ $t('domains.loading') }}</div>
        </div>

        <template v-else>
          <div
            v-if="domains.length === 0"
            class="q-pa-lg column items-center justify-center full-width text-grey-6"
          >
            <q-icon name="category" size="42px" class="q-mb-sm" />
            <div>{{ $t('domains.emptyState') }}</div>
          </div>

          <div v-else class="row q-col-gutter-md full-width">
            <div
              v-for="domain in domains"
              :key="domain.id"
              class="col-xs-12 col-sm-6 col-md-4 col-lg-3"
            >
              <q-card flat bordered class="full-height column">
                <q-card-section class="row items-start q-gutter-sm">
                  <div
                    class="domain-color"
                    :style="{ backgroundColor: domain.colorCode ?? '#607D8B' }"
                  />
                  <div class="column">
                    <div class="text-subtitle1">{{ domain.name }}</div>
                    <div class="text-caption text-grey-7">
                      {{
                        $t('domains.competencyCount', {
                          count: domain.competencyCount ?? domain.competencies?.length ?? 0,
                        })
                      }}
                    </div>
                  </div>
                </q-card-section>

                <q-space />

                <q-card-actions align="right">
                  <q-btn flat color="primary" icon="edit" @click="openEditDialog(domain)" />
                  <q-btn flat color="primary" icon="arrow_forward" @click="goToDomain(domain.id)" />
                </q-card-actions>
              </q-card>
            </div>
          </div>
        </template>
      </div>
    </q-card>

    <q-dialog v-model="dialog.open">
      <q-card style="min-width: 360px">
        <q-card-section>
          <div class="text-h6">
            {{ dialog.mode === 'create' ? $t('domains.createTitle') : $t('domains.editTitle') }}
          </div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="form.name"
            :label="$t('domains.fields.name')"
            :rules="[requiredRule]"
            autofocus
          />
          <div class="column q-gutter-xs">
            <div class="text-subtitle2">{{ $t('domains.fields.color') }}</div>
            <q-color
              v-model="form.colorCode"
              :default-value="DEFAULT_COLOR"
              format="hex"
              default-view="palette"
              class="domain-color-picker"
            />
            <div class="text-caption text-grey-7">
              {{ form.colorCode ?? DEFAULT_COLOR }}
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" color="primary" @click="closeDialog" />
          <q-btn
            color="primary"
            :label="
              dialog.mode === 'create' ? $t('domains.actions.create') : $t('domains.actions.save')
            "
            :loading="dialog.loading"
            @click="submitDialog"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
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

const DEFAULT_COLOR = '#607D8B';

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

const requiredRule = (value: string): true | string =>
  value?.trim() ? true : t('validation.required');

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
  if (dialog.loading) return;
  dialog.open = false;
}

async function submitDialog(): Promise<void> {
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
  void router.push({ name: 'domain-competencies', params: { domainId } });
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
