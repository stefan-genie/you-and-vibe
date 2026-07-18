<script setup>
import { watch, ref } from "vue";

const props = defineProps({
  visible: { type: Boolean, default: false },
});
const emit = defineEmits(["done"]);

const show = ref(false);

watch(
  () => props.visible,
  (v, oldV) => {
    if (v && !oldV) {
      show.value = true;
      setTimeout(() => {
        show.value = false;
        emit("done");
      }, 1900);
    }
  }
);
</script>

<template>
  <Transition name="banner">
    <div v-if="show" class="congrats">
      <span class="check">✓</span>
      <span class="text">Зачёт! Переходим дальше…</span>
    </div>
  </Transition>
</template>

<style scoped>
.congrats {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1.2rem;
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.35);
  border-radius: 999px;
  font-size: 0.95rem;
  color: #4ade80;
  margin-top: 1.25rem;
}
.check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: #4ade80;
  color: #0b0b0d;
  font-size: 0.85rem;
  font-weight: 700;
  animation: pulse 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.text {
  animation: fadeIn 0.4s 0.1s ease both;
}
@keyframes pulse {
  0% { transform: scale(0); }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
}
.banner-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.banner-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.banner-leave-active {
  transition: opacity 0.3s ease;
}
.banner-leave-to {
  opacity: 0;
}
</style>
