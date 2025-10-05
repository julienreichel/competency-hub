<template>
  <q-form @submit.prevent="onSave">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-8">
        <q-input v-model="form.name" label="Title" outlined :rules="[(v) => !!v || 'Required']" />
      </div>
      <div class="col-12 col-md-8">
        <q-input v-model="form.description" type="textarea" autogrow label="Description" outlined />
      </div>
      <div class="col-12 col-md-8">
        <q-input v-model="form.objectives" label="Objectives" type="textarea" autogrow outlined />
      </div>
    </div>

    <div class="q-mt-md">
      <q-btn color="primary" label="Save" type="submit" />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { type CreateCompetencyInput, type UpdateCompetencyInput } from 'src/models/Competency';
import { reactive, watch } from 'vue';

const props = defineProps<{ modelValue: CreateCompetencyInput }>();
const emit = defineEmits<{ (e: 'save', value: UpdateCompetencyInput): void }>();

const form = reactive<CreateCompetencyInput>({ ...props.modelValue });

watch(
  () => props.modelValue,
  (v) => Object.assign(form, v),
);

function onSave(): void {
  emit('save', { ...form });
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CompetencyDetailsForm',
});
</script>
