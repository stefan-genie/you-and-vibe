// System prompts for tasks, keyed by taskId.
//
// Design principle (phase 14): prompts contain ONLY output-format contracts
// (JSON for judge, python block + RESULT_STATUS for code gen). The task goal,
// context, URLs, and error logs live in the narrative shown to the user —
// the model does NOT know the goal in advance. Success depends on the quality
// of the user's prompt.

const PYTHON_CODE_CONTRACT = `ЖЁСТКОЕ ТРЕБОВАНИЕ К ФОРМАТУ ОТВЕТА:
1. Весь ответ — это ОДИН блок кода в тройных кавычках python, без текста до и после.
2. Внутри блока — ПОЛНЫЙ исполнимый Python-скрипт.
3. ПОСЛЕДНЕЙ строкой скрипт печатает в stdout: RESULT_STATUS:<код>, где <код> — число (HTTP-статус).
4. Только блок \`\`\`python ... \`\`\`, без пояснений, markdown-таблиц, комментариев вне кода.

Пиши кратко. Отвечай только кодом.`;

export const taskPrompts = {
  "t1-fake": "You are a helpful assistant for task t1-fake. (placeholder)",
  t3: "Ты — полезный ассистент. Отвечай на русском, кратко (1–4 предложения).",
  t5: `Ты — ИИ-ассистент в IDE. Отвечай на русском или кодом — по контексту запроса.

${PYTHON_CODE_CONTRACT}`,
  t6: `Ты — ИИ-ассистент в IDE. Отвечай на русском или кодом — по контексту запроса.

${PYTHON_CODE_CONTRACT}`,
};
