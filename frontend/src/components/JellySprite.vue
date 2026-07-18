<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  state: {
    type: String,
    default: "calm",
    validator: (v) =>
      ["landing", "calm", "happy", "sad", "sick", "puzzled"].includes(v),
  },
  context: {
    type: String,
    default: "task",
    validator: (v) => ["landing", "task"].includes(v),
  },
});

// TODO: replace missing sprite PNGs (calm, happy, sad, sick, puzzled) with real assets.
// Until then, only landing.png exists — others gracefully render nothing.
const spriteModules = import.meta.glob("../assets/sprites/*.webp", { eager: true, import: "default" });

const SPRITE_PATHS = {
  landing: "../assets/sprites/landing.webp",
  calm: "../assets/sprites/calm.webp",
  happy: "../assets/sprites/happy.webp",
  sad: "../assets/sprites/sad.webp",
  sick: "../assets/sprites/sick.webp",
  puzzled: "../assets/sprites/puzzled.webp",
};

const src = ref("");
const loaded = ref(false);

function loadSprite() {
  const path = SPRITE_PATHS[props.state];
  const mod = spriteModules[path];
  if (mod) {
    src.value = mod;
    loaded.value = true;
  } else {
    src.value = "";
    loaded.value = false;
  }
}

watch(() => props.state, loadSprite, { immediate: true });
</script>

<template>
  <div v-if="loaded" :class="['jelly-sprite', `jelly-sprite--${context}`]">
    <img :src="src" :alt="`Желе-кубик: ${state}`" />
  </div>
</template>

<style scoped>
</style>
