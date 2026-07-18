import { judgePrompts } from "../judgePrompts.js";

const MAX_TOKENS = 500;
const STRUCTURED_RULE =
  "Верни только JSON вида {\"acceptable\": bool, \"feedback\": string}, без пояснений и без markdown.";

function config() {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  return { baseUrl, apiKey, model };
}

async function callUpstream(systemPrompt, userText, cfg) {
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userText },
  ];
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: MAX_TOKENS,
      messages,
    }),
  });
  if (!response.ok) {
    throw new Error(`upstream ${response.status}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("unexpected upstream shape");
  }
  return content;
}

function extractJson(raw) {
  const trimmed = raw.trim();
  const tryParse = (s) => {
    try {
      const v = JSON.parse(s);
      if (typeof v?.acceptable === "boolean" && typeof v?.feedback === "string") {
        return v;
      }
      return null;
    } catch {
      return null;
    }
  };
  return tryParse(trimmed) ?? tryParse(trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, ""));
}

export async function judgeHandler(req, res) {
  const { taskId, text } = req.body || {};

  if (!taskId || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "taskId and text (non-empty) are required." });
  }

  const systemPrompt = judgePrompts[taskId];
  if (!systemPrompt) {
    return res.status(400).json({ error: `No judge configured for taskId: ${taskId}` });
  }

  const cfg = config();
  if (!cfg.baseUrl || !cfg.apiKey || !cfg.model) {
    return res.status(500).json({ error: "AI upstream is not configured." });
  }

  const fullPrompt = `${STRUCTURED_RULE}\n\nТекст пользователя для оценки:\n${text}`;

  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callUpstream(systemPrompt, fullPrompt, cfg);
      const parsed = extractJson(raw);
      if (parsed) {
        return res.json({
          acceptable: parsed.acceptable,
          feedback: parsed.feedback,
        });
      }
      lastError = "unparseable";
    } catch (err) {
      lastError = err.message;
    }
  }

  return res.json({
    acceptable: false,
    feedback: "Не удалось оценить, попробуй переформулировать.",
  });
}
