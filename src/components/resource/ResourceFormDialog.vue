<template>
  <base-dialog
    v-model="open"
    :title="isEdit ? $t('resources.editTitle') : $t('resources.addTitle')"
    :primary-label="isEdit ? $t('common.save') : $t('common.create')"
    :persistent="true"
    :use-form="true"
    @submit="onSubmit"
    @cancel="onCancel"
    size="md"
    :loading="false"
  >
    <q-form @submit.prevent="onSubmit">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-select
            v-model="form.type"
            :options="['Link', 'Document', 'Human', 'Location']"
            :label="$t('resources.fields.type')"
            dense
            filled
          />
        </div>
        <div class="col-12 col-md-8">
          <q-input
            v-model="form.name"
            :label="$t('resources.fields.title')"
            dense
            filled
            :rules="[(v) => !!v || $t('validation.required')]"
          />
        </div>

        <div class="col-12">
          <q-input
            v-model="form.description"
            :label="$t('resources.fields.description')"
            type="textarea"
            filled
            autogrow
          />
        </div>

        <!-- Digital specific -->
        <template v-if="form.type === 'Link'">
          <q-input
            v-model="form.url"
            :label="$t('resources.fields.url')"
            dense
            filled
            class="col-12"
          />
        </template>

        <template v-else-if="form.type === 'Document'">
          <file-uploader-field
            v-model="form.fileKey"
            class="col-12"
            :label="$t('resources.fields.upload')"
            :sub-competency-id="subCompetencyId"
            :accept="'application/pdf, image/*'"
          />
        </template>

        <!-- Human helper -->
        <template v-else-if="form.type === 'Human'">
          <div class="col-12 col-md-6">
            <user-picker
              :model-value="form.personUserId ?? null"
              @update:model-value="(val) => (form.personUserId = val)"
              :label="$t('resources.fields.helperUser')"
              dense
              filled
            />
          </div>
        </template>
      </div>
    </q-form>
  </base-dialog>
</template>

<script setup lang="ts">
import BaseDialog from 'src/components/common/BaseDialog.vue';
import FileUploaderField from 'src/components/common/FileUploaderField.vue';
import UserPicker from 'src/components/common/UserPicker.vue';
import {
  ResourceType,
  type CompetencyResource,
  type CreateResourceInput,
  type UpdateResourceInput,
} from 'src/models/CompetencyResource';
import { computed, reactive, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    subCompetencyId: string; // required for create
    initial?: CompetencyResource | null; // if provided -> edit mode
  }>(),
  {
    initial: null,
  },
);
const emit = defineEmits<{
  (e: 'create', payload: CreateResourceInput): void;
  (e: 'update', payload: UpdateResourceInput): void;
}>();

const open = defineModel<boolean>({ default: false });

const isEdit = computed(() => !!props.initial?.id);

const form = reactive<CreateResourceInput>({
  id: props.initial?.id ?? '',
  subCompetencyId: props.subCompetencyId ?? '',
  type: props.initial?.type ?? ResourceType.LINK,
  name: props.initial?.name ?? '',
  description: props.initial?.description ?? '',
  url: props.initial?.url ?? null,
  personUserId: props.initial?.personUserId ?? null,
  fileKey: props.initial?.fileKey ?? null,
});

watch(
  () => props.initial,
  (v) => {
    if (!v) return;
    Object.assign(form, {
      id: v.id,
      type: v.type,
      name: v.name,
      description: v.description ?? '',
      url: v.url ?? null,
      personUserId: v.personUserId ?? null,
      fileKey: v.fileKey ?? null,
    });
  },
);

function onSubmit(): void {
  if (isEdit.value && form.id) {
    emit('update', {
      id: form.id,
      type: form.type,
      name: form.name,
      description: form.description ?? '',
      url: form.url ?? null,
      personUserId: form.personUserId || null,
      fileKey: form.fileKey || null,
    });
  } else {
    emit('create', {
      subCompetencyId: form.subCompetencyId || '',
      type: form.type,
      name: form.name,
      description: form.description ?? '',
      url: form.url ?? null,
      personUserId: form.personUserId ?? null,
      fileKey: form.fileKey ?? null,
    });
  }
  open.value = false;
}

function onCancel(): void {
  open.value = false;
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ResourceFormDialog',
});
</script>
