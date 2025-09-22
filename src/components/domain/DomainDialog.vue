<template>
  <q-dialog v-model="isOpen">
    <q-card style="min-width: 360px">
      <q-card-section>
        <div class="text-h6">
          {{ mode === 'create' ? $t('domains.createTitle') : $t('domains.editTitle') }}
        </div>
      </q-card-section>
      <q-card-section class="q-gutter-md">
        <q-input
          v-model="localForm.name"
          :label="$t('domains.fields.name')"
          :rules="[requiredRule]"
          autofocus
        />
        <div class="column q-gutter-xs">
          <div class="text-subtitle2">{{ $t('domains.fields.color') }}</div>
          <q-color
            v-model="localForm.colorCode"
            :default-value="DEFAULT_COLOR"
            format="hex"
            default-view="palette"
            class="domain-color-picker"
          />
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat :label="$t('common.cancel')" color="primary" @click="onCancel" />
        <q-btn
          color="primary"
          :label="mode === 'create' ? $t('common.create') : $t('common.save')"
          @click="onSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const DEFAULT_COLOR = '#607D8B';
const props = defineProps<{
  modelValue: boolean;
  mode: string;
  form: { name: string; colorCode: string | null };
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  cancel: [];
  submit: [{ name: string; colorCode: string | null }];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    emit('update:modelValue', value);
  },
});

const localForm = reactive({
  name: props.form.name,
  colorCode: props.form.colorCode,
});

watch(
  () => props.form,
  (newForm) => {
    localForm.name = newForm.name;
    localForm.colorCode = newForm.colorCode;
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
