import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.ACCESS_CODE_SECRET;

if (!SECRET) {
  console.warn("WARNING: ACCESS_CODE_SECRET is not set — access codes will not validate.");
}

function b64url(s) {
  return Buffer.from(s).toString("base64url");
}

function b64urlDecode(s) {
  return Buffer.from(s, "base64url");
}

export function signCode(payload) {
  const hmac = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${hmac}`;
}

export function verifyCode(code) {
  if (!SECRET) {
    return { ok: false, reason: "Сервер не настроен для проверки кодов доступа." };
  }
  if (typeof code !== "string" || code.length === 0) {
    return { ok: false, reason: "Код не указан." };
  }

  const dot = code.lastIndexOf(".");
  if (dot < 1 || dot === code.length - 1) {
    return { ok: false, reason: "Неверный формат кода." };
  }

  const payload = code.slice(0, dot);
  const sig = code.slice(dot + 1);

  let decoded;
  try {
    decoded = JSON.parse(b64urlDecode(payload).toString("utf8"));
  } catch {
    return { ok: false, reason: "Неверный формат кода." };
  }

  if (typeof decoded.exp !== "number" || Date.now() > decoded.exp) {
    return { ok: false, reason: "Код истёк." };
  }

  const expected = createHmac("sha256", SECRET).update(payload).digest();
  const provided = b64urlDecode(sig);

  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return { ok: false, reason: "Код недействителен." };
  }

  return { ok: true };
}
