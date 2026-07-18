<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useProgressStore } from "../stores/progress.js";
import { tasks, nextTaskAfter } from "../tasks/tasks.config";
import CongratulationsOverlay from "./CongratulationsOverlay.vue";

const props = defineProps({
  task: { type: Object, required: true },
});
const emit = defineEmits(["pass"]);

const router = useRouter();
const store = useProgressStore();

const showCongrats = ref(false);

const currentIndex = computed(
  () => tasks.findIndex((t) => t.id === props.task.id) + 1
);
const total = computed(() => tasks.length);

const difficultyLabel = {
  easy: "Лёгкое",
  medium: "Среднее",
  hard: "Сложное",
};

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push("/profile");
}

function handlePass() {
  if (!store.completed.includes(props.task.id)) {
    store.completed.push(props.task.id);
  }
  emit("pass");
  showCongrats.value = true;
}

function onCongratsDone() {
  showCongrats.value = false;
  const next = nextTaskAfter(props.task.id);
  if (next) router.push(`/task/${next.id}`);
  else router.push("/profile");
}
</script>

<template>
  <main class="shell">
    <header class="head">
      <div class="head-row">
        <button class="back" @click="goBack">← Назад</button>
        <RouterLink to="/profile" class="home">Профиль</RouterLink>
      </div>
      <div class="meta">
        <span class="idx">{{ currentIndex }} / {{ total }}</span>
        <span v-if="task.difficulty" :class="['badge', task.difficulty]">
          {{ difficultyLabel[task.difficulty] }}
        </span>
      </div>
      <h1>{{ task.title }}</h1>
    </header>

    <section class="body">
      <slot :pass="handlePass" />
    </section>

    <CongratulationsOverlay :visible="showCongrats" @done="onCongratsDone" />
  </main>
</template>

<style scoped>
.shell {
  min-height: 100dvh;
  max-width: 46rem;
  margin: 0 auto;
  padding: 2.5rem clamp(1.5rem, 5vw, 3rem) 4rem;
  display: flex;
  flex-direction: column;
}
.head {
  margin-bottom: 2rem;
}
.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.back {
  background: transparent;
  border: none;
  color: var(--text-dim);
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s ease;
}
.back:hover {
  color: var(--text);
}
.home {
  color: var(--text-dim);
  font-size: 0.85rem;
  transition: color 0.15s ease;
}
.home:hover {
  color: var(--accent);
}
.meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.idx {
  font-size: 0.8rem;
  color: var(--text-dim);
  font-variant-numeric: tabular-nums;
}
.badge {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}
.badge.easy {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.12);
}
.badge.medium {
  color: #fb923c;
  background: rgba(251, 146, 60, 0.12);
}
.badge.hard {
  color: #f87171;
  background: rgba(248, 113, 113, 0.12);
}
.shell h1 {
  font-size: clamp(1.75rem, 4.5vw, 2.5rem);
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.body {
  flex: 1;
}
</style>
