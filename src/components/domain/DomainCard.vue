<template>
  <base-card
    :background-color="backgroundColor"
    :clickable="clickable"
    :show-open-action="clickable"
    :show-edit-action="showEdit"
    :show-delete-action="showDelete"
    @card-click="$emit('open', domain.id)"
    @open="$emit('open', domain.id)"
    @edit="$emit('edit', domain)"
    @delete="$emit('delete', domain.id)"
  >
    <template #default>
      <div class="text-subtitle1 text-weight-medium text-truncate">{{ domain.name }}</div>
      <div class="text-caption text-grey-7">
        {{
          $t('domains.competencyCount', {
            count: domain.competencies?.length ?? 0,
          })
        }}
      </div>
    </template>
  </base-card>
</template>

<script setup lang="ts">
import BaseCard from 'src/components/common/BaseCard.vue';
import type { Domain } from 'src/models/Domain';
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    domain: Domain;
    clickable?: boolean;
    showEdit?: boolean;
    showDelete?: boolean;
  }>(),
  {
    clickable: true,
    showEdit: false,
    showDelete: false,
    cardClass: '',
    sectionClass: '',
  },
);

defineEmits<{
  (e: 'open', id: string): void;
  (e: 'edit', domain: Domain): void;
  (e: 'delete', id: string): void;
}>();

const backgroundColor = computed(() => {
  return (props.domain.colorCode || '#607D8B') + '40';
});
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'DomainCard',
});
</script>
