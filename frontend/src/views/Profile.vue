<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useProgressStore } from "../stores/progress.js";
import { tasks, roadmapStubs } from "../tasks/tasks.config";

const router = useRouter();
const store = useProgressStore();
const { completed } = storeToRefs(store);

const filters = ["all", "easy", "medium", "hard"];
const activeFilter = ref("all");

const mainTasks = computed(() => tasks.filter((t) => !t.id.startsWith("intro-")));
const progressDone = computed(() =>
  mainTasks.value.filter((t) => completed.value.includes(t.id)).length
);
const progressPct = computed(() =>
  mainTasks.value.length === 0
    ? 0
    : Math.round((progressDone.value / mainTasks.value.length) * 100)
);

function statusOf(task) {
  if (completed.value.includes(task.id)) return "passed";
  if (task.unlocksAfter === null || completed.value.includes(task.unlocksAfter))
    return "available";
  return "locked";
}

const visibleTasks = computed(() => {
  if (activeFilter.value === "all") return tasks;
  return tasks.filter((t) => t.difficulty === activeFilter.value);
});

const statusLabel = {
  passed: "Пройдено",
  available: "Доступно",
  locked: "Заблокировано",
};

function openTask(task) {
  const s = statusOf(task);
  if (s === "available" || s === "passed") {
    router.push(`/task/${task.id}`);
  }
}
</script>

<template>
  <main class="profile">
    <header class="head">
      <RouterLink to="/" class="back">← На главную</RouterLink>
      <h1>Задания</h1>
      <div class="progress">
        <div class="progress-bar"><span :style="{ width: progressPct + '%' }" /></div>
        <span class="progress-text">{{ progressDone }}/{{ mainTasks.length }}</span>
      </div>
    </header>

    <p class="banner">Прогресс сохраняется в этом браузере.</p>

    <nav class="filters">
      <button
        v-for="f in filters"
        :key="f"
        :class="['tab', { active: activeFilter === f }]"
        @click="activeFilter = f"
      >
        {{ f === "all" ? "Все" : f === "easy" ? "Лёгкие" : f === "medium" ? "Средние" : "Сложные" }}
      </button>
    </nav>

    <ul class="task-list">
      <li
        v-for="task in visibleTasks"
        :key="task.id"
        :class="['card', statusOf(task)]"
        @click="openTask(task)"
      >
        <span class="indicator" :data-status="statusOf(task)">
          <template v-if="statusOf(task) === 'passed'">✓</template>
          <template v-else-if="statusOf(task) === 'locked'">🔒</template>
          <template v-else>•</template>
        </span>
        <span class="title">{{ task.title }}</span>
        <span v-if="task.difficulty" :class="['badge', task.difficulty]">{{ task.difficulty }}</span>
        <span class="status">{{ statusLabel[statusOf(task)] }}</span>
      </li>
    </ul>

    <section class="soon">
      <h2>Скоро</h2>
      <ul class="stub-list">
        <li v-for="stub in roadmapStubs" :key="stub" class="stub">{{ stub }}</li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.profile {
  min-height: 100dvh;
  max-width: 46rem;
  margin: 0 auto;
  padding: 2.5rem clamp(1.5rem, 5vw, 3rem) 4rem;
}
.head {
  margin-bottom: 1.25rem;
}
.back {
  color: var(--text-dim);
  font-size: 0.9rem;
  transition: color 0.15s ease;
}
.back:hover {
  color: var(--text);
}
.profile h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: -0.03em;
  margin: 0.5rem 0 1.25rem;
}
.progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-elev);
  border-radius: 999px;
  overflow: hidden;
}
.progress-bar span {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.3s ease;
}
.progress-text {
  font-size: 0.85rem;
  color: var(--text-dim);
  font-variant-numeric: tabular-nums;
}
.banner {
  color: var(--text-dim);
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}
.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}
.tab {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-dim);
  font: inherit;
  font-size: 0.85rem;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.tab:hover {
  color: var(--text);
}
.tab.active {
  color: #1a1500;
  background: var(--accent);
  border-color: var(--accent);
}
.task-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem 1rem;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: default;
  transition: border-color 0.15s ease, transform 0.1s ease;
}
.card.available,
.card.passed {
  cursor: pointer;
}
.card.available:hover,
.card.passed:hover {
  border-color: var(--text-dim);
  transform: translateY(-1px);
}
.card.locked {
  opacity: 0.45;
}
.indicator {
  width: 1.5rem;
  text-align: center;
  font-size: 0.95rem;
}
.indicator[data-status="passed"] {
  color: #4ade80;
}
.indicator[data-status="available"] {
  color: var(--accent);
}
.indicator[data-status="locked"] {
  color: var(--text-dim);
}
.title {
  flex: 1;
  font-size: 0.98rem;
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
.status {
  font-size: 0.78rem;
  color: var(--text-dim);
  min-width: 5.5rem;
  text-align: right;
}
.soon {
  margin-top: 3rem;
}
.soon h2 {
  font-size: 1.1rem;
  color: var(--text-dim);
  margin-bottom: 0.85rem;
}
.stub-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.stub {
  padding: 0.75rem 1rem;
  background: var(--bg-elev);
  border: 1px dashed var(--border);
  border-radius: 10px;
  color: var(--text-dim);
  font-size: 0.9rem;
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
