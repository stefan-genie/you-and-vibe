import { verifyCode } from "../accessCodes.js";

const REASON_LABELS = {
  malformed: "Неверный формат кода.",
  bad_signature: "Код недействителен.",
  expired: "Код истёк.",
  not_yet_valid: "Код ещё не действителен.",
};

export function requireAccessCode(req, res, next) {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return res.status(401).json({ error: "Требуется код доступа (Authorization: Bearer <code>)." });
  }
  const result = verifyCode(m[1]);
  if (!result.ok) {
    return res.status(401).json({ error: REASON_LABELS[result.reason] || "Код недействителен." });
  }
  next();
}
