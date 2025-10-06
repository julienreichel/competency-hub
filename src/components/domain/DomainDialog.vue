<template>
  <base-dialog
    v-model="open"
    :title="mode === 'create' ? $t('domains.createTitle') : $t('domains.editTitle')"
    :primary-label="mode === 'create' ? $t('common.create') : $t('common.save')"
    primary-color="primary"
    :loading="loading"
    :persistent="persistent"
    :use-form="true"
    @submit="onSubmit"
    @cancel="onCancel"
  >
    <q-input
      v-model="localForm.name"
      outlined
      :label="$t('domains.fields.name')"
      :rules="[requiredRule]"
      autofocus
    />
    <div class="column q-gutter-xs q-mt-md">
      <div class="text-subtitle2">{{ $t('domains.fields.color') }}</div>
      <div class="row items-center q-gutter-sm">
        <q-color
          v-model="localForm.colorCode"
          :default-value="DEFAULT_COLOR"
          format="hex"
          default-view="palette"
          no-header
          no-footer
          :palette="[
            '#1976D2', // Blue (primary, calm)
            '#E53935', // Red (energy, alert)
            '#43A047', // Green (success, nature)
            '#FB8C00', // Orange (warm, accent)
            '#8E24AA', // Purple (creative, accent)
            '#00ACC1', // Teal (fresh, modern)
            '#FDD835', // Yellow (highlight, cheerful)
            '#546E7A', // Blue-grey (neutral, balance)
            '#5D4037', // Brown (earthy, grounding)
            '#D733B4', // Pink
          ]"
          class="full-width domain-color-picker"
        />
        <div
          :style="{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            background: localForm.colorCode || DEFAULT_COLOR,
            marginLeft: '8px',
          }"
          aria-label="Selected color preview"
        />
      </div>
    </div>
  </base-dialog>
</template>

<script setup lang="ts">
import BaseDialog from 'src/components/common/BaseDialog.vue';
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const DEFAULT_COLOR = '#607D8B';

const open = defineModel<boolean>({ default: false });

const props = defineProps({
  mode: { type: String as () => 'create' | 'edit', required: true },
  form: { type: Object as () => { name: string; colorCode: string | null }, required: true },
  loading: { type: Boolean, default: false },
  persistent: { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'cancel', 'update:form']);

const localForm = reactive({
  name: props.form.name,
  colorCode: props.form.colorCode,
});

watch(
  () => props.form,
  (newForm) => {
    localForm.name = newForm.name;
    localForm.colorCode = newForm?.colorCode;
  },
  { deep: true },
);

watch(
  open,
  () => {
    localForm.name = props.form.name ?? '';
    localForm.colorCode = props.form.colorCode;
  },
  { deep: true },
);

watch(
  localForm,
  (val) => {
    emit('update:form', { ...val });
  },
  { deep: true },
);

function onCancel(): void {
  emit('cancel');
}
function onSubmit(): void {
  emit('submit', { ...localForm });
}

const requiredRule = (value: string): true | string =>
  value?.trim() ? true : t('validation.required');
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'DomainDialog',
});
</script>

<style scoped>
.domain-color-picker {
  min-width: 120px;
}
</style>
