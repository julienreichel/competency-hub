<template>
  <q-form @submit.prevent="onSave">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-input
          v-model="form.name"
          label="Name"
          :rules="[(v) => !!v || 'Required']"
          filled
          dense
        />
      </div>
      <div class="col-12 col-md-6">
        <q-slider filled dense v-model="form.level" :min="1" :max="10" />
      </div>
      <div class="col-12">
        <q-input v-model="form.description" label="Description" type="textarea" autogrow filled />
      </div>
      <div class="col-12">
        <q-input v-model="form.objectives" label="Objectives" type="textarea" autogrow filled />
      </div>
    </div>

    <div class="q-mt-md">
      <q-btn color="primary" label="Save" type="submit" />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import {
  type CreateSubCompetencyInput,
  type UpdateSubCompetencyInput,
} from 'src/models/SubCompetency';
import { reactive, watch } from 'vue';

const props = defineProps<{ modelValue: CreateSubCompetencyInput }>();
const emit = defineEmits<{ (e: 'save', value: UpdateSubCompetencyInput): void }>();

const form = reactive<CreateSubCompetencyInput>({ ...props.modelValue });
watch(
  () => props.modelValue,
  (v) => Object.assign(form, v),
);

function onSave(): void {
  if (!form.id) return;
  const payload: UpdateSubCompetencyInput = {
    id: form.id,
    name: form.name,
    level: form.level || 1,
    description: form.description ?? '',
    objectives: form.objectives ?? '',
  };
  emit('save', payload);
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SubCompetencyForm',
});
</script>
