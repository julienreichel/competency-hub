<template>
  <div class="q-gutter-sm">
    <div class="row q-col-gutter-sm">
      <div v-for="seed in seeds" :key="seed" class="col-3">
        <q-card
          flat
          bordered
          class="cursor-pointer flex flex-center"
          :class="{ 'bg-primary text-white': seed === selectedSeed }"
          @click="selectSeed(seed)"
        >
          <q-img :src="avatarUrl(seed)" ratio="1" :alt="seed" />
        </q-card>
      </div>
    </div>
    <div class="q-ml-none row justify-between q-col-gutter-sm">
      <q-btn icon="close" flat :label="$t('admin.avatar.clear')" @click="clearSelection" />
      <div class="row q-gutter-sm">
        <q-btn
          icon="refresh"
          flat
          :label="$t('admin.avatar.regenerate')"
          @click="regenerateSeeds"
        />
        <q-btn icon="shuffle" flat :label="$t('admin.avatar.random')" @click="pickRandom" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

const SEED_COUNT = 16;
const DICEBEAR_BASE_URL = 'https://api.dicebear.com/9.x/adventurer/svg?seed=';
const RADIX = 36;
const SEED_START_INDEX = 2;
const SEED_END_INDEX = 10;

const props = defineProps<{
  modelValue: string | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const seeds = ref<string[]>([]);
const selectedSeed = ref<string | null>(null);

function generateSeed(): string {
  return Math.random().toString(RADIX).slice(SEED_START_INDEX, SEED_END_INDEX);
}

function generateSeedSet(): string[] {
  const set = new Set<string>();
  while (set.size < SEED_COUNT) {
    set.add(generateSeed());
  }
  return Array.from(set);
}

function ensureSelectedSeedExists(seedList: string[]): string[] {
  if (!selectedSeed.value) {
    return seedList;
  }
  if (seedList.includes(selectedSeed.value)) {
    return seedList;
  }
  return [selectedSeed.value, ...seedList.slice(0, SEED_COUNT - 1)];
}

function extractSeed(avatarUrl?: string | null): string | null {
  if (!avatarUrl) return null;
  const match = avatarUrl.match(/seed=([^&]+)/);
  return match?.[1] ?? null;
}

function regenerateSeeds(): void {
  const newSeeds = ensureSelectedSeedExists(generateSeedSet());
  seeds.value = newSeeds;
}

function selectSeed(seed: string): void {
  selectedSeed.value = seed;
  emit('update:modelValue', avatarUrl(seed));
}

function clearSelection(): void {
  selectedSeed.value = null;
  emit('update:modelValue', null);
}

function pickRandom(): void {
  if (seeds.value.length === 0) {
    regenerateSeeds();
  }
  const randomSeed = seeds.value[Math.floor(Math.random() * seeds.value.length)] ?? null;
  if (randomSeed) {
    selectSeed(randomSeed);
  }
}

function avatarUrl(seed: string): string {
  return `${DICEBEAR_BASE_URL}${seed}`;
}

watch(
  () => props.modelValue,
  (value) => {
    selectedSeed.value = extractSeed(value);
    seeds.value = ensureSelectedSeedExists(
      seeds.value.length > 0 ? seeds.value : generateSeedSet(),
    );
  },
  { immediate: true },
);

onMounted(() => {
  seeds.value = ensureSelectedSeedExists(generateSeedSet());
});
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AvatarPicker',
});
</script>
