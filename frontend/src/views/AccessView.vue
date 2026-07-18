<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { setAccessCode, hasAccessCode, isLocallyExpired } from "../utils/access.js";

const router = useRouter();
const route = useRoute();

const code = ref("");
const busy = ref(false);
const error = ref("");

const REASON_LABELS = {
  malformed: "Код неверный.",
  bad_signature: "Код неверный.",
  expired: "Код истёк, обратись за новым.",
  not_yet_valid: "Код неверный.",
};

onMounted(() => {
  if (hasAccessCode() && !isLocallyExpired()) {
    router.push("/profile");
    return;
  }
  if (route.query.reason === "expired") {
    error.value = "Код больше не действует, введи новый.";
  } else if (isLocallyExpired()) {
    error.value = "Похоже, код истёк. Введи новый.";
  }
});

async function submit() {
  const trimmed = code.value.trim();
  if (!trimmed || busy.value) return;

  busy.value = true;
  error.value = "";

  try {
    const resp = await fetch("/api/access/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: trimmed }),
    });

    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      if (resp.status === 502 || resp.status === 503) {
        error.value = "Сервер недоступен (502). Проверьте, запущен ли backend.";
      } else {
        error.value = `Сервер вернул неожиданный ответ (${resp.status}).`;
      }
      return;
    }

    if (data.ok) {
      setAccessCode(trimmed);
      router.push("/profile");
    } else {
      error.value = REASON_LABELS[data.reason] || "Код неверный.";
    }
  } catch {
    error.value = "Сеть недоступна — проверьте подключение.";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <main class="access">
    <section class="card">
      <h1>Введи код доступа</h1>
      <p class="hint">Код действует 48 часов с момента создания.</p>
      <input
        v-model="code"
        type="text"
        class="input"
        placeholder="например: tid7ud.WRoYf1AytMLhDelm4Nbrps"
        :disabled="busy"
        @keydown.enter="submit"
      />
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn" :disabled="busy || !code.trim()" @click="submit">
        {{ busy ? "Проверяю…" : "Войти" }}
      </button>
      <RouterLink to="/" class="back">← На главную</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.access {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}
.card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-width: 24rem;
  width: 100%;
}
.card h1 {
  font-size: clamp(1.5rem, 4vw, 2rem);
  letter-spacing: -0.02em;
}
.hint {
  color: var(--text-dim);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}
.input {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  color: var(--text);
  font: inherit;
  font-size: 0.95rem;
  font-family: ui-monospace, "Cascadia Code", "Fira Code", monospace;
  border-radius: 10px;
  padding: 0.7rem 0.85rem;
  outline: none;
  transition: border-color 0.15s ease;
}
.input:focus {
  border-color: var(--text-dim);
}
.input:disabled {
  opacity: 0.5;
}
.error {
  color: #f87171;
  font-size: 0.85rem;
}
.btn {
  background: var(--accent);
  color: #1a1500;
  border: none;
  font: inherit;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.7rem 1.4rem;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
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
.back {
  color: var(--text-dim);
  font-size: 0.85rem;
  text-align: center;
  margin-top: 0.5rem;
  transition: color 0.15s ease;
}
.back:hover {
  color: var(--text);
}
</style>
