import { taskPrompts } from "../taskPrompts.js";

const MAX_TOKENS = 1000;

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
    return res.json({ content });
  } catch (err) {
    return res.status(502).json({ error: "Failed to reach corporate AI upstream." });
  }
}

// TODO: verify against a real self-hosted endpoint once AI_BASE_URL/AI_API_KEY are
// available. Example manual check:
//   curl -X POST "$AI_BASE_URL/chat/completions" \
//     -H "content-type: application/json" \
//     -H "authorization: Bearer $AI_API_KEY" \
//     -d '{"model":"'"$AI_MODEL"'","max_tokens":1000,"messages":[{"role":"system","content":"ping"},{"role":"user","content":"hi"}]}'
