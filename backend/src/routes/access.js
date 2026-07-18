import { verifyCode } from "../accessCode.js";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const hits = new Map();

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
  return res.json(result);
}
