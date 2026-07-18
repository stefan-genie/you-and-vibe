import { taskPrompts } from "../taskPrompts.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";
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

  const messages = [
    ...(Array.isArray(history) ? history : []),
    { role: "user", content: message },
  ];

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Anthropic API error (${response.status}). Please try again.`,
      });
    }

    const data = await response.json();
    const content = Array.isArray(data.content)
      ? data.content.filter((b) => b.type === "text").map((b) => b.text).join("")
      : "";
    return res.json({ content });
  } catch (err) {
    return res.status(502).json({ error: "Failed to reach Anthropic API." });
  }
}
