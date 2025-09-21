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

<template>
  <q-form @submit.prevent="onSave">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-input
          v-model="form.name"
          label="Title"
          dense
          filled
          :rules="[(v) => !!v || 'Required']"
        />
      </div>
      <div class="col-12 col-md-8">
        <q-input v-model="form.objectives" label="Objectives" type="textarea" autogrow filled />
      </div>

      <div class="col-12">
        <q-input v-model="form.description" type="textarea" autogrow label="Description" filled />
      </div>
    </div>

    <div class="q-mt-md">
      <q-btn color="primary" label="Save" type="submit" />
    </div>
  </q-form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CompetencyDetailsForm',
});
</script>
