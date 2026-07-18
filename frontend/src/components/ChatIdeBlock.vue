<script setup>
import { ref, nextTick, watch, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import AttemptsCounter from "./AttemptsCounter.vue";
import { authHeaders, handle401 } from "../utils/access.js";

const props = defineProps({
  content: { type: Object, required: true },
  pass: { type: Function, required: true },
});

const route = useRoute();
const router = useRouter();
const taskId = route.params.id;
const mode = computed(() => props.content.mode || "generate");
const isFixMode = computed(() => mode.value === "fix");

const messages = ref([]);
const input = ref("");
const chatBusy = ref(false);
const chatError = ref("");

const generatedCode = ref(isFixMode.value ? props.content.brokenCode || "" : "");
const codeReply = ref("");
const codeBlock = ref(null);
const codeReplaced = ref(false);

const runResult = ref(null);
const runBusy = ref(false);

const counter = ref(null);

const MAX_ATTEMPTS = 3;
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

const chatPlaceholder = computed(() =>
  isFixMode.value
    ? "Попроси ИИ починить код…"
    : "Попроси ИИ написать скрипт…"
);

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
      headers: authHeaders(),
      body: JSON.stringify({ taskId, message: text, history: buildHistory().slice(0, -1) }),
    });
    if (await handle401(resp, router)) return;
    const data = await resp.json();
    if (!resp.ok || data.error) {
      chatError.value = data.error || "Не удалось получить ответ.";
      messages.value.push({ role: "assistant", content: "⚠️ " + chatError.value });
    } else {
      messages.value.push({ role: "assistant", content: data.content });
      if (data.code) {
        generatedCode.value = data.code;
        codeReply.value = data.reply || "Готово, смотри код →";
        codeReplaced.value = true;
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

const canRun = computed(() => {
  if (runBusy.value) return false;
  if (isFixMode.value && !codeReplaced.value) return false;
  return generatedCode.value.length > 0;
});

async function runCode() {
  if (!canRun.value) return;

  runResult.value = null;
  runBusy.value = true;

  try {
    const resp = await fetch("/api/sandbox/run", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ code: generatedCode.value, taskId }),
    });
    if (await handle401(resp, router)) return;
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
    counter.value?.registerResult(runResult.value.passed);
  } catch {
    runResult.value = {
      passed: false,
      statusCode: null,
      stdout: "",
      stderr: "Сеть недоступна.",
    };
    counter.value?.registerResult(false);
  } finally {
    runBusy.value = false;
  }
}

function copyErrorLog() {
  const text = `${props.content.brokenCode || ""}\n\nЛог:\n${props.content.errorLog || ""}`;
  navigator.clipboard?.writeText(text);
}

function copyServiceUrl() {
  const url = props.content.serviceUrl || "";
  if (url) navigator.clipboard?.writeText(url);
}

const urlCopied = ref(false);
function onCopyUrl() {
  copyServiceUrl();
  urlCopied.value = true;
  setTimeout(() => { urlCopied.value = false; }, 1500);
}

const helpContext = computed(() => {
  const base = isFixMode.value
    ? "Мне нужно починить Python-скрипт, который делает GET-запрос к http://jelly-service:8080/jelly/status через requests и печатает RESULT_STATUS:<HTTP-статус>. Скрипт возвращает 404 вместо 200."
    : "Мне нужно написать Python-скрипт, который делает GET-запрос к http://jelly-service:8080/jelly/status через библиотеку requests и печатает последней строкой RESULT_STATUS:<HTTP-статус>. Мой скрипт не проходит проверку.";
  return `${base}\n\nКод:\n${generatedCode.value}\n\nВывод:\n${runResult.value?.stdout || runResult.value?.stderr || "(пусто)"}`;
});

function onPassed() {
  props.pass();
}
</script>

<template>
  <AttemptsCounter
    ref="counter"
    :task-id="taskId"
    :max="MAX_ATTEMPTS"
    :hints="content.hints"
    :help-context="helpContext"
    @passed="onPassed"
    #default="{ attempts, max, failed }"
  >
    <article class="ide">
      <p class="intro">
        <span>{{ content.introBeforeUrl }}</span>
        <code v-if="content.serviceUrl" class="service-url" @click="onCopyUrl" title="Нажми, чтобы скопировать">{{ content.serviceUrl }}</code>
        <span v-if="urlCopied" class="copied-hint">скопировано ✓</span>
        <span>{{ content.introAfterUrl }}</span>
      </p>

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
              :placeholder="chatPlaceholder"
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
          <div class="col-header">
            {{ isFixMode && !codeReplaced ? "Сломанный код" : "Код" }}
          </div>
          <div class="code-window">
            <pre v-if="generatedCode" class="code-wrap"><code ref="codeBlock" class="language-python">{{ generatedCode }}</code></pre>
            <div v-else class="code-empty">
              Код появится здесь, когда ИИ его сгенерирует.
            </div>
          </div>

          <div v-if="isFixMode && !codeReplaced && content.errorLog" class="error-log">
            <div class="error-log-head">
              <span class="col-header">Лог ошибки</span>
              <button class="copy-btn" @click="copyErrorLog">Скопировать</button>
            </div>
            <pre class="error-log-output">{{ content.errorLog }}</pre>
          </div>

          <button
            class="btn run-btn"
            :disabled="!canRun"
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
          <span class="attempts">Попытка {{ attempts }}/{{ max }}</span>
        </div>
        <pre class="console-output">{{ runResult.stdout || runResult.stderr || "(пусто)" }}</pre>
      </div>
    </article>
  </AttemptsCounter>
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
.service-url {
  font-family: ui-monospace, "Cascadia Code", "Fira Code", monospace;
  font-size: 0.88rem;
  color: var(--accent);
  background: rgba(251, 191, 36, 0.08);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.service-url:hover {
  background: rgba(251, 191, 36, 0.16);
}
.copied-hint {
  font-size: 0.8rem;
  color: #4ade80;
  margin-left: 0.4rem;
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
  min-height: 12rem;
  max-height: 20rem;
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
  min-height: 10rem;
}
.error-log {
  background: rgba(248, 113, 113, 0.06);
  border: 1px solid rgba(248, 113, 113, 0.25);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
}
.error-log-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}
.copy-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-dim);
  font: inherit;
  font-size: 0.72rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.copy-btn:hover {
  color: var(--text);
  border-color: var(--text-dim);
}
.error-log-output {
  font-family: ui-monospace, "Cascadia Code", "Fira Code", monospace;
  font-size: 0.8rem;
  color: #f87171;
  white-space: pre-wrap;
  margin: 0;
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
@media (max-width: 720px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
