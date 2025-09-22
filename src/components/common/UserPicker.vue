<template>
  <q-select
    :label="label || 'Select user'"
    :options="users"
    :option-label="(u) => u.name || u.email || u.id"
    :option-value="(u) => u.id"
    :loading="loading"
    :model-value="modelValue"
    @update:model-value="onSelect"
    emit-value
    map-options
    clearable
    dense
    filled
  />
</template>

<script setup lang="ts">
import { useUsers } from 'src/composables/useUsers';
import { type User, type UserRole } from 'src/models/User';
import { onMounted, ref, watch } from 'vue';

const props = defineProps<{
  modelValue?: string | null;
  userRole?: UserRole | null; // optional filter by type/role
  label?: string;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', id: string | null): void }>();

const users = ref<User[]>([]);
const loading = ref(false);

async function fetchUsers(): Promise<void> {
  loading.value = true;
  try {
    const all = await useUsers().fetchUsers();
    users.value = props.userRole
      ? all.filter((u: User) => u.role === props.userRole || u.role === props.userRole)
      : all;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchUsers);
watch(() => props.userRole, fetchUsers);

function onSelect(id: string): void {
  emit('update:modelValue', id);
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({ name: 'UserPicker' });
</script>
