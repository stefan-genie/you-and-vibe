<script setup>
import { ref } from "vue";

const props = defineProps({
  content: { type: Object, required: true },
  pass: { type: Function, required: true },
});

const state = ref("idle");
let timer = null;

function send() {
  if (state.value !== "idle") return;
  state.value = "typing";
  timer = setTimeout(() => {
    state.value = "done";
  }, 800);
}

function finish() {
  if (timer) clearTimeout(timer);
  props.pass();
}
</script>

<template>
  <article class="fake-chat">
    <div class="chat-window">
      <div class="row user">
        <span class="who">Ты</span>
        <p class="bubble">{{ content.prompt }}</p>
      </div>
      <div v-if="state !== 'idle'" class="row ai">
        <span class="who">ИИ</span>
        <p v-if="state === 'done'" class="bubble ai-bubble">{{ content.reply }}</p>
        <p v-else class="bubble ai-bubble typing">
          <span class="dot" /><span class="dot" /><span class="dot" />
        </p>
      </div>
    </div>

    <div class="actions">
      <button
        v-if="state === 'idle'"
        class="btn"
        @click="send"
      >
        Отправить промпт
      </button>
      <button
        v-else-if="state === 'done'"
        class="btn"
        @click="finish"
      >
        Задание пройдено ✓
      </button>
      <button v-else disabled class="btn disabled">
        ИИ печатает…
      </button>
    </div>
  </article>
</template>

<style scoped>
.fake-chat {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.chat-window {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem;
  min-height: 12rem;
}
.row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.row.user {
  align-items: flex-end;
}
.row.ai {
  align-items: flex-start;
}
.who {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-dim);
}
.bubble {
  font-size: 0.95rem;
  line-height: 1.55;
  padding: 0.7rem 0.95rem;
  border-radius: 12px;
  max-width: 85%;
  white-space: pre-wrap;
}
.row.user .bubble {
  background: var(--accent);
  color: #1a1500;
  border-bottom-right-radius: 4px;
}
.ai-bubble {
  background: var(--bg);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}
.typing {
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
}
.typing .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-dim);
  animation: blink 1.2s infinite ease-in-out;
}
.typing .dot:nth-child(2) {
  animation-delay: 0.2s;
}
.typing .dot:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes blink {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}
.actions {
  display: flex;
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
.btn:hover:not(.disabled) {
  transform: translateY(-2px);
  opacity: 0.92;
}
.btn.disabled {
  background: var(--bg-elev);
  color: var(--text-dim);
  cursor: not-allowed;
}
</style>
