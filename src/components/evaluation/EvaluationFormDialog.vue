<template>
  <base-dialog
    v-model="open"
    :title="dialogTitle"
    :primary-label="isEdit ? $t('common.save') : $t('common.create')"
    :secondary-label="$t('common.cancel')"
    :use-form="true"
    size="md"
    @submit="handleSubmit"
    @cancel="handleCancel"
  >
    <q-form ref="formRef" @submit.prevent="handleSubmit" class="q-gutter-md">
      <q-input
        v-model="form.name"
        :label="$t('evaluations.fields.name')"
        dense
        filled
        :rules="[(v) => !!v || $t('validation.required')]"
      />

      <q-input
        v-model="form.description"
        :label="$t('evaluations.fields.description')"
        type="textarea"
        filled
        autogrow
      />

      <div class="q-pl-md q-pt-md row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-select
            v-model="form.mode"
            :options="modes"
            :label="$t('evaluations.fields.mode')"
            dense
            filled
            emit-value
            map-options
          />
        </div>
        <div class="col-12 col-md-6">
          <q-select
            v-model="form.format"
            :options="formats"
            :label="$t('evaluations.fields.format')"
            dense
            filled
            emit-value
            map-options
          />
        </div>
      </div>

      <q-input
        v-model.number="form.durationMin"
        type="number"
        :label="$t('evaluations.fields.duration')"
        dense
        filled
        :min="0"
        @update:model-value="normalizeDuration"
      />

      <div>
        <div class="text-caption text-grey-6 q-mb-xs">{{ $t('evaluations.fields.delivery') }}</div>
        <q-btn-toggle
          v-model="deliveryType"
          spread
          dense
          :options="deliveryOptions"
          @update:model-value="handleDeliveryChange"
        />
      </div>

      <q-input
        v-if="deliveryType === 'url'"
        v-model="form.url"
        :label="$t('evaluations.fields.url')"
        dense
        filled
        @update:model-value="handleUrlUpdate"
      />

      <file-uploader-field
        v-else
        v-model="form.fileKey"
        :sub-competency-id="subCompetencyId"
        :label="$t('evaluations.fields.upload')"
        class="q-pl-md full-width"
        :accept="'application/pdf, image/*'"
        @update:model-value="handleFileUpdate"
      />
    </q-form>
  </base-dialog>
</template>

<script setup lang="ts">
import type { QForm } from 'quasar';
import { useQuasar } from 'quasar';
import BaseDialog from 'src/components/common/BaseDialog.vue';
import FileUploaderField from 'src/components/common/FileUploaderField.vue';
import { type Evaluation, EvaluationFormat, EvaluationMode } from 'src/models/Evaluation';
import {
  type CreateEvaluationInput,
  type UpdateEvaluationInput,
} from 'src/models/repositories/EvaluationRepository';
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  subCompetencyId: string;
  initial?: Evaluation | null;
}>();

const emit = defineEmits<{
  (e: 'create', payload: CreateEvaluationInput): void;
  (e: 'update', payload: { id: string; data: UpdateEvaluationInput }): void;
}>();

const open = defineModel<boolean>({ default: false });

const isEdit = computed(() => Boolean(props.initial));

const modes = Object.values(EvaluationMode).map((value) => ({
  label: value,
  value,
}));
const formats = Object.values(EvaluationFormat).map((value) => ({
  label: value,
  value,
}));

const form = reactive({
  id: props.initial?.id ?? '',
  subCompetencyId: props.subCompetencyId,
  name: props.initial?.name ?? '',
  description: props.initial?.description ?? '',
  mode: props.initial?.mode ?? EvaluationMode.SOLO,
  format: props.initial?.format ?? EvaluationFormat.EXPERIMENT,
  durationMin: props.initial?.durationMin ?? null,
  url: props.initial?.url ?? null,
  fileKey: props.initial?.fileKey ?? null,
});

const deliveryType = ref<'url' | 'file'>(props.initial?.fileKey ? 'file' : 'url');
const formRef = ref<QForm | null>(null);

watch(
  () => props.initial,
  (value) => {
    if (value) {
      Object.assign(form, {
        id: value.id,
        subCompetencyId: value.subCompetencyId,
        name: value.name,
        description: value.description ?? '',
        mode: value.mode,
        format: value.format,
        durationMin: value.durationMin ?? null,
        url: value.url ?? null,
        fileKey: value.fileKey ?? null,
      });
      deliveryType.value = value.fileKey ? 'file' : 'url';
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

watch(
  () => props.subCompetencyId,
  (value) => {
    form.subCompetencyId = value;
  },
);

watch(open, (value) => {
  if (!value) {
    if (props.initial) {
      Object.assign(form, {
        id: props.initial.id,
        subCompetencyId: props.initial.subCompetencyId,
        name: props.initial.name,
        description: props.initial.description ?? '',
        mode: props.initial.mode,
        format: props.initial.format,
        durationMin: props.initial.durationMin ?? null,
        url: props.initial.url ?? null,
        fileKey: props.initial.fileKey ?? null,
      });
      deliveryType.value = props.initial.fileKey ? 'file' : 'url';
    } else {
      resetForm();
    }
  }
});

const { t } = useI18n();
const $q = useQuasar();
const dialogTitle = computed(() =>
  isEdit.value ? t('evaluations.editTitle') : t('evaluations.addTitle'),
);

const deliveryOptions = computed(() => [
  { label: t('evaluations.delivery.url'), value: 'url' as const },
  { label: t('evaluations.delivery.file'), value: 'file' as const },
]);

function buildFormPayload(): {
  payload: CreateEvaluationInput;
  hasUrl: boolean;
  hasFile: boolean;
} {
  const url = deliveryType.value === 'url' ? form.url?.trim() || null : null;
  const fileKey = deliveryType.value === 'file' ? form.fileKey?.toString() || null : null;

  const payload: CreateEvaluationInput = {
    subCompetencyId: props.subCompetencyId,
    name: form.name.trim(),
    description: form.description?.trim() || null,
    mode: form.mode,
    format: form.format,
    durationMin: form.durationMin ?? null,
    url,
    fileKey,
  };

  return {
    payload,
    hasUrl: Boolean(url),
    hasFile: Boolean(fileKey),
  };
}

watch(
  () => form.fileKey,
  (value) => {
    if (value) {
      deliveryType.value = 'file';
      form.url = null;
    }
  },
);

watch(
  () => form.url,
  (value) => {
    if (value) {
      deliveryType.value = 'url';
      form.fileKey = null;
    }
  },
);

function handleDeliveryChange(type: 'url' | 'file'): void {
  if (type === 'url') {
    form.fileKey = null;
  } else {
    form.url = null;
  }
}

function handleUrlUpdate(value: string | number | null | undefined): void {
  if (typeof value === 'string' && value.trim().length === 0) {
    form.url = null;
  }
}

function handleFileUpdate(value: string | null): void {
  form.fileKey = value;
}

function normalizeDuration(value: number | string | null): void {
  const num = Number(value);
  if (value === null || Number.isNaN(value)) {
    form.durationMin = null;
  } else if (Number(value) < 0) {
    form.durationMin = 0;
  }
}

function resetForm(): void {
  Object.assign(form, {
    id: '',
    subCompetencyId: props.subCompetencyId,
    name: '',
    description: '',
    mode: EvaluationMode.SOLO,
    format: EvaluationFormat.EXPERIMENT,
    durationMin: null,
    url: null,
    fileKey: null,
  });
  deliveryType.value = 'url';
}

async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate();
  if (valid === false) {
    return;
  }

  const { payload, hasUrl, hasFile } = buildFormPayload();

  if (!hasUrl && !hasFile) {
    $q.notify({ type: 'negative', message: t('evaluations.deliveryRequired') });
    return;
  }

  if (isEdit.value && form.id) {
    emit('update', {
      id: form.id,
      data: payload,
    });
  } else {
    emit('create', payload);
  }
  open.value = false;
}

function handleCancel(): void {
  open.value = false;
}
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'EvaluationFormDialog',
});
</script>
