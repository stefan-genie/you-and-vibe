<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  taskId: { type: String, required: true },
  max: { type: Number, default: 3 },
  hints: { type: Array, default: () => [] },
  helpContext: { type: String, default: "" },
});
const emit = defineEmits(["passed"]);

const router = useRouter();
const attempts = ref(0);
const failed = ref(false);

watch(
  () => props.taskId,
  () => {
    attempts.value = 0;
    failed.value = false;
  }
);

function registerResult(passed) {
  if (passed) {
    emit("passed");
    return;
  }
  attempts.value++;
  if (attempts.value >= props.max) {
    failed.value = true;
  }
}

function copyHelp() {
  navigator.clipboard?.writeText(props.helpContext);
}

defineExpose({ registerResult, attempts, failed });

const externalHelperUrl = "https://claude.ai";
</script>

<template>
  <div v-if="!failed" class="counter-slot">
    <slot :attempts="attempts" :max="max" :failed="failed" />
    <p
      v-if="attempts > 0 && attempts < max && hints[attempts - 1]"
      class="hint"
    >
      💡 {{ hints[attempts - 1] }}
    </p>
  </div>

  <article v-else class="failed-screen">
    <h2>Не получилось</h2>
    <p class="fail-text">
      Ты исчерпал {{ max }} попытки. Это нормально — ИИ-ассистенты не всегда
      угадывают с первого раза.
    </p>
    <div class="fail-actions">
      <RouterLink to="/profile" class="btn secondary">Повторить предыдущие задания</RouterLink>
      <a
        :href="externalHelperUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="btn"
        @click="copyHelp"
      >
        Попроси своего ИИ-помощника объяснить ↗
      </a>
    </div>
    <p class="copy-note">Промпт скопирован в буфер обмена — вставь его в открывшемся окне.</p>
  </article>
</template>

<style scoped>
.counter-slot {
  display: contents;
}
.hint {
  margin-top: 0.5rem;
  color: var(--accent);
  font-size: 0.85rem;
  line-height: 1.5;
}
.failed-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
}
.failed-screen h2 {
  font-size: 1.75rem;
  letter-spacing: -0.02em;
}
.fail-text {
  color: var(--text-dim);
  max-width: 28rem;
  line-height: 1.6;
}
.fail-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.5rem;
}
.copy-note {
  color: var(--text-dim);
  font-size: 0.82rem;
  margin-top: 0.5rem;
}
.btn {
  background: var(--accent);
  color: #1a1500;
  border: none;
  font: inherit;
  font-weight: 600;
  font-size: 0.92rem;
  padding: 0.55rem 1.2rem;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
  white-space: nowrap;
  text-decoration: none;
}
.btn:hover {
  transform: translateY(-2px);
  opacity: 0.92;
}
.btn.secondary {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}
</style>
