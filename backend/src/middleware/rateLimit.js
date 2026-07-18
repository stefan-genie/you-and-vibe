const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
let hits = 0;
let windowStart = Date.now();

export function rateLimit(req, res, next) {
  const now = Date.now();
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    hits = 0;
  }
  hits++;
  if (hits > MAX_REQUESTS) {
    return res.status(429).json({ error: "Too many requests. Please slow down." });
  }
  next();
}
