const STORAGE_KEY = "vibeAndYou.accessCode";
const TTL_MS = 48 * 3600 * 1000;

export function getAccessCode() {
  return localStorage.getItem(STORAGE_KEY) || "";
}

export function setAccessCode(code) {
  localStorage.setItem(STORAGE_KEY, code);
}

export function clearAccessCode() {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasAccessCode() {
  return getAccessCode().length > 0;
}

export function authHeaders(extra = {}) {
  const code = getAccessCode();
  const headers = { "content-type": "application/json", ...extra };
  if (code) {
    headers.authorization = `Bearer ${code}`;
  }
  return headers;
}

export function isLocallyExpired(code = getAccessCode()) {
  const dot = code.indexOf(".");
  if (dot < 1) return false;
  const ts = parseInt(code.slice(0, dot), 36);
  if (Number.isNaN(ts)) return false;
  const ageMs = Date.now() - ts * 1000;
  return ageMs > TTL_MS;
}

export async function handle401(resp, router) {
  if (resp.status === 401) {
    clearAccessCode();
    if (router) {
      router.push({ path: "/access", query: { reason: "expired" } });
    }
    return true;
  }
  return false;
}
