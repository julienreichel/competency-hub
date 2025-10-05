<template>
  <div class="">
    <div v-if="loading" class="q-pa-lg column items-center justify-center full-width">
      <q-spinner color="primary" size="32px" />
      <div class="text-caption text-grey-7 q-mt-sm">{{ $t('domains.loading') }}</div>
    </div>

    <template v-else>
      <div
        v-if="domains.length === 0"
        class="q-pa-lg column items-center justify-center text-grey-6"
      >
        <q-icon name="category" size="42px" class="q-mb-sm" />
        <div>{{ $t('domains.emptyState') }}</div>
      </div>

      <div v-else class="row q-col-gutter-md">
        <div v-for="domain in domains" :key="domain.id" class="col-12 col-sm-6 col-md-4">
          <domain-card
            :domain="domain"
            :show-edit="hasRole('Admin')"
            @open="$emit('select', domain.id)"
            @edit="$emit('edit', domain)"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import DomainCard from 'src/components/domain/DomainCard.vue';
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

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'DomainList',
});
</script>
