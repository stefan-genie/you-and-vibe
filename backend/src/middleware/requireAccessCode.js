import { verifyCode } from "../accessCode.js";

export function requireAccessCode(req, res, next) {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return res.status(401).json({ error: "Требуется код доступа (Authorization: Bearer <code>)." });
  }
  const result = verifyCode(m[1]);
  if (!result.ok) {
    return res.status(401).json({ error: result.reason });
  }
  next();
}
