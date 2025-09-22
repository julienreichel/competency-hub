<template>
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
                        count: domain.competencies?.length ?? 0,
                      })
                    }}
                  </div>
                </div>
              </q-card-section>

              <q-space />

              <q-card-actions align="right">
                <q-btn
                  v-if="hasRole('Admin')"
                  flat
                  color="primary"
                  icon="edit"
                  @click.stop="$emit('edit', domain)"
                />
                <q-btn
                  flat
                  color="primary"
                  icon="arrow_forward"
                  @click.stop="$emit('select', domain.id)"
                />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </template>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { useAuth } from 'src/composables/useAuth';
import type { Domain } from 'src/models/Domain';

defineProps<{
  domains: Domain[];
  loading: boolean;
}>();

defineEmits<{
  (e: 'edit', domain: Domain): void;
  (e: 'select', id: string): void;
}>();

const { hasRole } = useAuth();
</script>

<style scoped>
.domain-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}
</style>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'DomainList',
});
</script>
