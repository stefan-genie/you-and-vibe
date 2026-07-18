<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  state: {
    type: String,
    default: "calm",
    validator: (v) =>
      ["landing", "calm", "happy", "sad", "sick", "puzzled"].includes(v),
  },
});

// TODO: replace missing sprite PNGs (calm, happy, sad, sick, puzzled) with real assets.
// Until then, only landing.png exists — others gracefully render nothing.
const spriteModules = import.meta.glob("../assets/sprites/*.png", { eager: true, import: "default" });

const SPRITE_PATHS = {
  landing: "../assets/sprites/landing.png",
  calm: "../assets/sprites/calm.png",
  happy: "../assets/sprites/happy.png",
  sad: "../assets/sprites/sad.png",
  sick: "../assets/sprites/sick.png",
  puzzled: "../assets/sprites/puzzled.png",
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
  <div v-if="loaded" class="jelly-sprite">
    <img :src="src" :alt="`Желе-кубик: ${state}`" />
  </div>
</template>

<style scoped>
@import "../styles/sprite.css";
</style>
