import { verifyCode } from "../accessCodes.js";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const hits = new Map();

const REASON_LABELS = {
  malformed: "Неверный формат кода.",
  bad_signature: "Код недействителен.",
  expired: "Код истёк.",
  not_yet_valid: "Код ещё не действителен.",
};

function clientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}

function checkRate(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_ATTEMPTS) {
    return false;
  }
  arr.push(now);
  hits.set(ip, arr);
  return true;
}

export function accessVerifyHandler(req, res) {
  const { code } = req.body || {};

  if (typeof code !== "string" || code.length === 0) {
    return res.status(400).json({ ok: false, reason: "Код не указан." });
  }

  const ip = clientIp(req);
  if (!checkRate(ip)) {
    return res.status(429).json({ ok: false, reason: "Слишком много попыток. Попробуйте через 15 минут." });
  }

  const result = verifyCode(code);
  if (result.ok) {
    return res.json({ ok: true });
  }
  return res.json({ ok: false, reason: REASON_LABELS[result.reason] || "Код недействителен." });
}
