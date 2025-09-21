<script setup lang="ts">
import FileUploaderField from 'src/components/common/FileUploaderField.vue';
import {
  ResourceType,
  type CompetencyResource,
  type CreateResourceInput,
  type UpdateResourceInput,
} from 'src/models/Competency';
import { computed, reactive, ref, watch } from 'vue';

const props = defineProps<{
  label?: string;
  subCompetencyId?: string; // required for create
  initial?: CompetencyResource | null; // if provided -> edit mode
}>();
const emit = defineEmits<{
  (e: 'create', payload: CreateResourceInput): void;
  (e: 'update', payload: UpdateResourceInput): void;
}>();

const dlg = ref(false);
function show(): void {
  dlg.value = true;
}
defineExpose({ show });

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
  dlg.value = false;
}
</script>

<template>
  <q-btn
    :label="label || (isEdit ? 'Edit resource' : 'Add resource')"
    color="primary"
    @click="dlg = true"
  />

  <q-dialog v-model="dlg" persistent>
    <q-card style="min-width: 560px; max-width: 720px">
      <q-card-section class="text-h6">
        {{ isEdit ? 'Edit CompetencyResource' : 'Add CompetencyResource' }}
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="onSubmit">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-select
                v-model="form.type"
                :options="['Digital', 'Human', 'LearnerAdded']"
                label="Type"
                dense
                filled
              />
            </div>
            <div class="col-12 col-md-8">
              <q-input
                v-model="form.name"
                label="Title"
                dense
                filled
                :rules="[(v) => !!v || 'Required']"
              />
            </div>

            <div class="col-12">
              <q-input
                v-model="form.description"
                label="Description"
                type="textarea"
                filled
                autogrow
              />
            </div>

            <!-- Digital specific -->
            <template v-if="form.type === 'Link' || form.type === 'Document'">
              <div class="col-12 col-md-7">
                <q-input
                  v-model="form.url"
                  label="URL (optional if uploading a file)"
                  dense
                  filled
                />
              </div>
              <div class="col-12 col-md-5">
                <file-uploader-field
                  v-model="form.fileKey"
                  label="Upload file"
                  :accept="'application/pdf, image/*'"
                />
              </div>
            </template>

            <!-- Human helper -->
            <template v-else-if="form.type === 'Human'">
              <div class="col-12 col-md-6">
                <q-input v-model="form.personUserId" label="Helper User ID" dense filled />
                <!-- If you have a proper user picker, replace the input with it -->
              </div>
            </template>

            <!-- LearnerAdded -->
            <template v-else>
              <div class="col-12">
                <q-banner dense class="bg-grey-2 text-grey-9">
                  Learner-added resource: title/description are usually enough. Optionally attach a
                  URL or file.
                </q-banner>
              </div>
              <div class="col-12 col-md-7">
                <q-input v-model="form.url" label="URL (optional)" dense filled />
              </div>
              <div class="col-12 col-md-5">
                <file-uploader-field
                  v-model="form.fileKey"
                  label="Upload file"
                  :accept="'application/pdf, image/*'"
                />
              </div>
            </template>
          </div>

          <div class="q-mt-md">
            <q-btn
              color="primary"
              :label="isEdit ? 'Save changes' : 'Create resource'"
              type="submit"
            />
            <q-btn flat label="Cancel" class="q-ml-sm" v-close-popup />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ResourceFormDialog',
});
</script>
