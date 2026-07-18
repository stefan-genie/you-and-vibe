<script setup>
import { ref, nextTick, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const props = defineProps({
  content: { type: Object, required: true },
  pass: { type: Function, required: true },
});

const route = useRoute();
const router = useRouter();
const taskId = route.params.id;

const messages = ref([]);
const input = ref("");
const chatBusy = ref(false);
const chatError = ref("");

const generatedCode = ref("");
const codeReply = ref("");
const codeBlock = ref(null);

const runResult = ref(null);
const runBusy = ref(false);
const attempts = ref(0);
const failed = ref(false);

const MAX_ATTEMPTS = 3;
const CLAUDE_PROMPT = `Мне нужно написать Python-скрипт, который делает GET-запрос к http://jelly-service:8080/jelly/status через библиотеку requests и печатает последней строкой RESULT_STATUS:<HTTP-статус>. Мой скрипт не проходит проверку — помоги понять, почему. Вот что я пробовал и что получил в выводе:`;

const chatWindow = ref(null);

async function scrollToBottom() {
  await nextTick();
  if (chatWindow.value) {
    chatWindow.value.scrollTop = chatWindow.value.scrollHeight;
  }
}

function highlightCode() {
  if (codeBlock.value && window.hljs) {
    window.hljs.highlightElement(codeBlock.value);
  }
}

watch(generatedCode, () => {
  nextTick(highlightCode);
});

onMounted(() => {
  if (window.hljs && codeBlock.value) {
    window.hljs.highlightElement(codeBlock.value);
  }
});

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
      if (data.code) {
        generatedCode.value = data.code;
        codeReply.value = data.reply || "Готово, смотри код →";
      }
    }
  } catch {
    chatError.value = "Сеть недоступна.";
    messages.value.push({ role: "assistant", content: "⚠️ Не удалось связаться с сервером." });
  } finally {
    chatBusy.value = false;
    await scrollToBottom();
  }
}

async function runCode() {
  if (!generatedCode.value || runBusy.value || failed.value) return;

  runResult.value = null;
  runBusy.value = true;

  try {
    const resp = await fetch("/api/sandbox/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: generatedCode.value, taskId }),
    });
    const data = await resp.json();
    if (!resp.ok || data.error) {
      runResult.value = {
        passed: false,
        statusCode: null,
        stdout: "",
        stderr: data.error || "Не удалось запустить.",
      };
    } else {
      runResult.value = data;
    }

    if (runResult.value.passed) {
      props.pass();
    } else {
      attempts.value++;
      if (attempts.value >= MAX_ATTEMPTS) {
        failed.value = true;
      }
    }
  } catch {
    runResult.value = {
      passed: false,
      statusCode: null,
      stdout: "",
      stderr: "Сеть недоступна.",
    };
    attempts.value++;
    if (attempts.value >= MAX_ATTEMPTS) {
      failed.value = true;
    }
  } finally {
    runBusy.value = false;
  }
}

function copyPrompt() {
  const full = `${CLAUDE_PROMPT}\n\nКод:\n${generatedCode.value}\n\nВывод:\n${runResult.value?.stdout || runResult.value?.stderr || "(пусто)"}`;
  navigator.clipboard?.writeText(full);
}

const externalHelperUrl = "https://claude.ai";
</script>

<template>
  <article v-if="!failed" class="ide">
    <p class="intro">{{ content.intro }}</p>

    <div class="layout">
      <div class="col chat-col">
        <div class="col-header">Чат с ИИ</div>
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
            placeholder="Попроси ИИ написать скрипт…"
            rows="2"
            :disabled="chatBusy"
            @keydown.enter.exact.prevent="send"
          />
          <button class="btn" :disabled="chatBusy || !input.trim()" @click="send">
            {{ chatBusy ? "…" : "Отправить" }}
          </button>
        </div>
      </div>

      <div class="col code-col">
        <div class="col-header">Код</div>
        <div class="code-window">
          <pre v-if="generatedCode" class="code-wrap"><code ref="codeBlock" class="language-python">{{ generatedCode }}</code></pre>
          <div v-else class="code-empty">
            Код появится здесь, когда ИИ его сгенерирует.
          </div>
        </div>
        <button
          class="btn run-btn"
          :disabled="!generatedCode || runBusy || failed"
          @click="runCode"
        >
          {{ runBusy ? "Запускаю…" : "Запустить" }}
        </button>
      </div>
    </div>

    <div v-if="runResult" :class="['console', runResult.passed ? 'ok' : 'fail']">
      <div class="console-head">
        <span class="verdict">
          {{ runResult.passed ? "✓ Зачёт" : "✗ Не прошло" }}
        </span>
        <span v-if="runResult.statusCode !== null" class="status-code">
          HTTP {{ runResult.statusCode }}
        </span>
        <span class="attempts">Попытка {{ attempts }}/{{ MAX_ATTEMPTS }}</span>
      </div>
      <pre class="console-output">{{ runResult.stdout || runResult.stderr || "(пусто)" }}</pre>
      <p v-if="!runResult.passed && attempts < MAX_ATTEMPTS && content.hints[attempts - 1]" class="hint">
        💡 {{ content.hints[attempts - 1] }}
      </p>
    </div>
  </article>

  <article v-else class="failed-screen">
    <h2>Не получилось</h2>
    <p class="fail-text">Ты исчерпал {{ MAX_ATTEMPTS }} попытки. Это нормально — ИИ-ассистенты не всегда угадывают с первого раза.</p>
    <div class="fail-actions">
      <RouterLink to="/profile" class="btn secondary">Повторить предыдущие задания</RouterLink>
      <a
        :href="externalHelperUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="btn"
        @click="copyPrompt"
      >
        Попроси своего ИИ-помощника объяснить ↗
      </a>
    </div>
    <p class="copy-note">Промпт скопирован в буфер обмена — вставь его в открывшемся окне.</p>
  </article>
</template>

<style scoped>
.ide {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.intro {
  color: var(--text-dim);
  font-size: 0.95rem;
  line-height: 1.6;
}
.layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  min-height: 20rem;
}
.col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.col-header {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim);
  padding-bottom: 0.25rem;
}
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1rem;
  min-height: 16rem;
  max-height: 24rem;
  overflow-y: auto;
}
.row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.row.user { align-items: flex-end; }
.row.assistant { align-items: flex-start; }
.who {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-dim);
}
.bubble {
  font-size: 0.88rem;
  line-height: 1.5;
  padding: 0.55rem 0.8rem;
  border-radius: 10px;
  max-width: 88%;
  white-space: pre-wrap;
  word-break: break-word;
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
  width: 6px;
  height: 6px;
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
  gap: 0.5rem;
  align-items: flex-end;
}
.input {
  flex: 1;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  color: var(--text);
  font: inherit;
  font-size: 0.9rem;
  border-radius: 8px;
  padding: 0.55rem 0.75rem;
  resize: none;
  outline: none;
  transition: border-color 0.15s ease;
}
.input:focus { border-color: var(--text-dim); }
.input:disabled { opacity: 0.5; }
.code-window {
  flex: 1;
  background: #1a1b26;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1rem;
  min-height: 16rem;
  max-height: 24rem;
  overflow: auto;
}
.code-wrap {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
}
.code-empty {
  color: var(--text-dim);
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 14rem;
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
.btn.secondary {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}
.run-btn {
  align-self: flex-start;
  margin-top: 0.5rem;
}
.console {
  border-radius: 10px;
  padding: 0.85rem 1rem;
  font-size: 0.88rem;
}
.console.ok {
  background: rgba(74, 222, 128, 0.08);
  border: 1px solid rgba(74, 222, 128, 0.3);
}
.console.fail {
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.3);
}
.console-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.verdict { font-weight: 600; }
.status-code {
  font-size: 0.8rem;
  color: var(--text-dim);
  font-variant-numeric: tabular-nums;
}
.attempts {
  margin-left: auto;
  font-size: 0.78rem;
  color: var(--text-dim);
}
.console-output {
  font-family: ui-monospace, "Cascadia Code", "Fira Code", monospace;
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
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
@media (max-width: 720px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
