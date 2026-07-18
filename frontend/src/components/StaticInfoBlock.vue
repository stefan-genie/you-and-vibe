<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  content: { type: Object, required: true },
  pass: { type: Function, required: true },
});

const page = ref(0);
const pages = computed(() => props.content.pages ?? []);
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
  <article class="static">
    <p class="page-text">{{ pages[page] }}</p>
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
.static {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.page-text {
  font-size: 1.08rem;
  line-height: 1.7;
  color: var(--text);
  white-space: pre-wrap;
}
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
</style>
