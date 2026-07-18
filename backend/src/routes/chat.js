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

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        messages,
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Upstream model error (${response.status}). Please try again.`,
      });
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
    return res.status(502).json({ error: "Failed to reach corporate AI upstream." });
  }
}
