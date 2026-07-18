import { taskPrompts } from "../taskPrompts.js";

const MAX_TOKENS = 1000;
const CODE_BLOCK_RE = /```(?:python)?\s*\n([\s\S]*?)\n```/;

function extractCode(text) {
  if (typeof text !== "string") return { code: null, reply: null };
  const match = text.match(CODE_BLOCK_RE);
  if (match) {
    const code = match[1].trim();
    const reply = text.replace(match[0], "").trim();
    return {
      code,
      reply: reply.length > 0 ? reply : "Готово, смотри код →",
    };
  }
  return { code: null, reply: null };
}

export async function chatHandler(req, res) {
  const { taskId, message, history = [] } = req.body || {};

  if (!taskId || !message) {
    return res.status(400).json({ error: "taskId and message are required." });
  }

  const systemPrompt = taskPrompts[taskId];
  if (!systemPrompt) {
    return res.status(400).json({ error: `Unknown taskId: ${taskId}` });
  }

  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!baseUrl || !apiKey || !model) {
    return res.status(500).json({ error: "AI upstream is not configured." });
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const messages = [
    { role: "system", content: systemPrompt },
    ...(Array.isArray(history) ? history : []),
    { role: "user", content: message },
  ];

  const body = JSON.stringify({ model, max_tokens: MAX_TOKENS, messages });
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`,
  };

  const MAX_RETRIES = 2;
  const RETRY_DELAYS = [2000, 4000];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
      });

      if (response.status === 429 && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }

      if (!response.ok) {
        const msg =
          response.status === 429
            ? "Слишком много запросов к ИИ. Подожди минуту и попробуй снова."
            : `Ошибка ИИ (${response.status}). Попробуй ещё раз.`;
        return res.status(response.status).json({ error: msg });
      }

      const data = await response.json();
      const choice = data?.choices?.[0];
      const content = choice?.message?.content;
      if (typeof content !== "string") {
        return res
          .status(502)
          .json({ error: "Upstream model returned an unexpected response." });
      }

      const { code, reply } = extractCode(content);
      const payload = { content };
      if (code !== null) {
        payload.code = code;
        payload.reply = reply;
      }
      return res.json(payload);
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }
      return res.status(502).json({ error: "Не удалось связаться с ИИ-сервером." });
    }
  }
}
