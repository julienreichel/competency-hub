<template>
  <div class="row q-col-gutter-md q-mb-lg">
    <div class="col-12 col-md-6">
      <q-input v-model="searchModel" outlined :placeholder="searchPlaceholder" clearable>
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>
    <div class="col-6 col-md-3">
      <q-select
        v-model="statusModel"
        :options="statusOptions"
        outlined
        emit-value
        map-options
        clearable
        :label="statusLabel"
      />
    </div>
    <div class="col-6 col-md-3">
      <q-select
        v-model="domainModel"
        :options="domainOptions"
        outlined
        emit-value
        map-options
        clearable
        :label="domainLabel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type Option = { label: string; value: string | null };

const props = defineProps<{
  search: string;
  status: string | null;
  domain: string | null;
  statusOptions: Option[];
  domainOptions: Option[];
  searchPlaceholder: string;
  statusLabel: string;
  domainLabel: string;
}>();

const emit = defineEmits<{
  'update:search': [value: string];
  'update:status': [value: string | null];
  'update:domain': [value: string | null];
}>();

const searchModel = computed({
  get: () => props.search,
  set: (value: string) => emit('update:search', value),
});

const statusModel = computed({
  get: () => props.status,
  set: (value: string | null) => emit('update:status', value),
});

const domainModel = computed({
  get: () => props.domain,
  set: (value: string | null) => emit('update:domain', value),
});
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SearchStatusDomainFilters',
});
</script>
