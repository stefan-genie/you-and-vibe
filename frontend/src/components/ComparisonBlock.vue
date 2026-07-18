<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  content: { type: Object, required: true },
  pass: { type: Function, required: true },
});

const page = ref(0);
const pages = computed(() => props.content.pages ?? []);
const current = computed(() => pages.value[page.value]);
const isLast = computed(() => page.value >= pages.value.length - 1);

function next() {
  if (isLast.value) {
    props.pass();
  } else {
    page.value++;
  }
}
</script>

<template>
  <article class="comparison">
    <nav class="subtabs">
      <button
        v-for="(p, i) in pages"
        :key="i"
        :class="['subtab', { active: i === page }]"
        @click="page = i"
      >
        {{ p.title }}
      </button>
    </nav>

    <h2 class="page-title">{{ current.title }}</h2>

    <ul class="pairs">
      <li v-for="(pair, i) in current.pairs" :key="i" class="pair">
        <div class="cell bad">
          <span class="label">Плохо</span>
          <p>{{ pair.bad }}</p>
        </div>
        <div class="cell good">
          <span class="label">Хорошо</span>
          <p>{{ pair.good }}</p>
        </div>
        <p class="note">{{ pair.note }}</p>
      </li>
    </ul>

    <div class="pager">
      <div class="dots">
        <span
          v-for="(_, i) in pages"
          :key="i"
          :class="['dot', { active: i === page }]"
        />
      </div>
      <button class="btn" @click="next">
        {{ isLast ? "Завершить" : "Далее →" }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.comparison {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.subtabs {
  display: flex;
  gap: 0.5rem;
}
.subtab {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-dim);
  font: inherit;
  font-size: 0.85rem;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.subtab.active {
  color: var(--text);
  border-color: var(--text-dim);
}
.page-title {
  font-size: 1.25rem;
  letter-spacing: -0.02em;
}
.pairs {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  align-items: start;
}
.cell {
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-elev);
}
.cell.bad {
  border-left: 3px solid #f87171;
}
.cell.good {
  border-left: 3px solid #4ade80;
}
.label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-dim);
  margin-bottom: 0.4rem;
}
.cell p {
  font-size: 0.95rem;
  line-height: 1.5;
}
.note {
  grid-column: 1 / -1;
  font-size: 0.85rem;
  color: var(--text-dim);
  line-height: 1.5;
  padding-left: 0.25rem;
}
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
}
.dots {
  display: flex;
  gap: 0.4rem;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--border);
  transition: background 0.2s ease;
}
.dot.active {
  background: var(--accent);
}
.btn {
  background: var(--accent);
  color: #1a1500;
  border: none;
  font: inherit;
  font-weight: 600;
  font-size: 0.98rem;
  padding: 0.65rem 1.4rem;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.btn:hover {
  transform: translateY(-2px);
  opacity: 0.92;
}
@media (max-width: 540px) {
  .pair {
    grid-template-columns: 1fr;
  }
}
</style>
