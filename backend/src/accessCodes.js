// Stateless HMAC+TTL access codes.
//
// COMPROMISE: each code is valid for 48 hours from the moment of creation and
// can be used unlimited times within that window. Revoking a specific code
// without a database is impossible — the only way to invalidate all codes at
// once is to change ACCESS_CODE_SECRET. This is acceptable for an MVP with a
// single admin issuing codes via CLI.

import { createHmac, timingSafeEqual } from "node:crypto";

const TTL_SECONDS = 48 * 3600;
const CLOCK_SKEW_SECONDS = 60;
const SIG_LENGTH = 22;

function getSecret() {
  const secret = process.env.ACCESS_CODE_SECRET;
  if (!secret) {
    throw new Error("ACCESS_CODE_SECRET is not set — check .env");
  }
  return secret;
}

export function sign(tsSeconds) {
  const hmac = createHmac("sha256", getSecret())
    .update(String(tsSeconds))
    .digest("base64url");
  return hmac.slice(0, SIG_LENGTH);
}

export function generateCode() {
  const ts = Math.floor(Date.now() / 1000);
  return `${ts.toString(36)}.${sign(ts)}`;
}

export function verifyCode(code) {
  let secret;
  try {
    secret = getSecret();
  } catch {
    return { ok: false, reason: "bad_signature" };
  }

  if (typeof code !== "string" || code.length === 0) {
    return { ok: false, reason: "malformed" };
  }

  const dot = code.indexOf(".");
  if (dot < 1 || dot === code.length - 1) {
    return { ok: false, reason: "malformed" };
  }

  const tsPart = code.slice(0, dot);
  const sigPart = code.slice(dot + 1);

  const ts = parseInt(tsPart, 36);
  if (Number.isNaN(ts)) {
    return { ok: false, reason: "malformed" };
  }

  const expected = createHmac("sha256", secret)
    .update(String(ts))
    .digest("base64url")
    .slice(0, SIG_LENGTH);
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(sigPart);

  if (expectedBuf.length !== providedBuf.length) {
    return { ok: false, reason: "bad_signature" };
  }
  if (!timingSafeEqual(expectedBuf, providedBuf)) {
    return { ok: false, reason: "bad_signature" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (ts > now + CLOCK_SKEW_SECONDS) {
    return { ok: false, reason: "not_yet_valid" };
  }
  if (now - ts > TTL_SECONDS) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true };
}
