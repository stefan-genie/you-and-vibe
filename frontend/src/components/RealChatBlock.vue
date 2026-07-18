<script setup>
import { ref, nextTick } from "vue";
import { useRoute } from "vue-router";

const props = defineProps({
  content: { type: Object, required: true },
  pass: { type: Function, required: true },
});

const route = useRoute();
const taskId = route.params.id;

const messages = ref([]);
const input = ref("");
const chatBusy = ref(false);
const chatError = ref("");

const judgeVisible = ref(false);
const judgeText = ref("");
const judgeBusy = ref(false);
const judgeResult = ref(null);
const judgeError = ref("");

const chatWindow = ref(null);

async function scrollToBottom() {
  await nextTick();
  if (chatWindow.value) {
    chatWindow.value.scrollTop = chatWindow.value.scrollHeight;
  }
}

function buildHistory() {
  return messages.value
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));
}

async function send() {
  const text = input.value.trim();
  if (!text || chatBusy.value) return;

  chatError.value = "";
  messages.value.push({ role: "user", content: text });
  input.value = "";
  chatBusy.value = true;
  await scrollToBottom();

  try {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ taskId, message: text, history: buildHistory().slice(0, -1) }),
    });
    const data = await resp.json();
    if (!resp.ok || data.error) {
      chatError.value = data.error || "Не удалось получить ответ.";
      messages.value.push({ role: "assistant", content: "⚠️ " + chatError.value });
    } else {
      messages.value.push({ role: "assistant", content: data.content });
    }
  } catch {
    chatError.value = "Сеть недоступна.";
    messages.value.push({ role: "assistant", content: "⚠️ Не удалось связаться с сервером." });
  } finally {
    chatBusy.value = false;
    await scrollToBottom();
  }
}

function showJudge() {
  judgeVisible.value = true;
  judgeResult.value = null;
  judgeError.value = "";
}

async function checkJudge() {
  const text = judgeText.value.trim();
  if (!text || judgeBusy.value) return;

  judgeError.value = "";
  judgeBusy.value = true;

  try {
    const resp = await fetch("/api/judge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ taskId, text }),
    });
    const data = await resp.json();
    if (!resp.ok || data.error) {
      judgeError.value = data.error || "Не удалось проверить.";
      judgeResult.value = null;
    } else {
      judgeResult.value = data;
      if (data.acceptable) {
        props.pass();
      }
    }
  } catch {
    judgeError.value = "Сеть недоступна.";
    judgeResult.value = null;
  } finally {
    judgeBusy.value = false;
  }
}
</script>

<template>
  <article class="real-chat">
    <p class="intro">{{ content.intro }}</p>

    <div ref="chatWindow" class="chat-window">
      <div
        v-for="(m, i) in messages"
        :key="i"
        :class="['row', m.role]"
      >
        <span class="who">{{ m.role === "user" ? "Ты" : "ИИ" }}</span>
        <p :class="['bubble', m.role === 'assistant' ? 'ai-bubble' : '']">{{ m.content }}</p>
      </div>
      <div v-if="chatBusy" class="row assistant">
        <span class="who">ИИ</span>
        <p class="bubble ai-bubble typing">
          <span class="dot" /><span class="dot" /><span class="dot" />
        </p>
      </div>
    </div>

    <div class="composer">
      <textarea
        v-model="input"
        class="input"
        placeholder="Напиши сообщение помощнику…"
        rows="2"
        :disabled="chatBusy"
        @keydown.enter.exact.prevent="send"
      />
      <button class="btn" :disabled="chatBusy || !input.trim()" @click="send">
        {{ chatBusy ? "…" : "Отправить" }}
      </button>
    </div>

    <button v-if="!judgeVisible" class="link-btn" @click="showJudge">
      Готов написать финальный текст для начальника →
    </button>

    <section v-if="judgeVisible" class="judge">
      <label class="judge-label">Впиши финальный текст, который ты отправишь начальнику</label>
      <textarea
        v-model="judgeText"
        class="input judge-input"
        placeholder="Например: Уважаемый начальник, к сожалению, я сегодня нездоров…"
        rows="3"
        :disabled="judgeBusy"
      />
      <button class="btn" :disabled="judgeBusy || !judgeText.trim()" @click="checkJudge">
        {{ judgeBusy ? "Проверяю…" : "Проверить" }}
      </button>

      <div v-if="judgeError" class="judge-error">⚠️ {{ judgeError }}</div>

      <div v-if="judgeResult" :class="['judge-result', judgeResult.acceptable ? 'ok' : 'retry']">
        <p class="verdict">
          {{ judgeResult.acceptable ? "✓ Принято!" : "✗ Не принято, попробуй снова" }}
        </p>
        <p class="feedback">{{ judgeResult.feedback }}</p>
      </div>
    </section>
  </article>
</template>

<style scoped>
.real-chat {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.intro {
  color: var(--text-dim);
  font-size: 0.95rem;
  line-height: 1.6;
}
.chat-window {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem;
  min-height: 14rem;
  max-height: 22rem;
  overflow-y: auto;
}
.row {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.row.user {
  align-items: flex-end;
}
.row.assistant {
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
.typing .dot:nth-child(2) { animation-delay: 0.2s; }
.typing .dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}
.composer {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}
.input {
  flex: 1;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  color: var(--text);
  font: inherit;
  font-size: 0.95rem;
  border-radius: 10px;
  padding: 0.65rem 0.85rem;
  resize: none;
  outline: none;
  transition: border-color 0.15s ease;
}
.input:focus {
  border-color: var(--text-dim);
}
.input:disabled {
  opacity: 0.5;
}
.btn {
  background: var(--accent);
  color: #1a1500;
  border: none;
  font: inherit;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.65rem 1.3rem;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
  white-space: nowrap;
}
.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  opacity: 0.92;
}
.btn:disabled {
  background: var(--bg-elev);
  color: var(--text-dim);
  cursor: not-allowed;
}
.link-btn {
  background: transparent;
  border: none;
  color: var(--accent);
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  text-align: left;
  padding: 0;
  transition: opacity 0.15s ease;
}
.link-btn:hover {
  opacity: 0.8;
}
.judge {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.judge-label {
  font-size: 0.88rem;
  color: var(--text);
}
.judge-input {
  background: var(--bg);
}
.judge-error {
  color: #f87171;
  font-size: 0.88rem;
}
.judge-result {
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.92rem;
}
.judge-result.ok {
  background: rgba(74, 222, 128, 0.08);
  border: 1px solid rgba(74, 222, 128, 0.3);
}
.judge-result.retry {
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.3);
}
.verdict {
  font-weight: 600;
  margin-bottom: 0.35rem;
}
.feedback {
  color: var(--text-dim);
  line-height: 1.5;
}
</style>
