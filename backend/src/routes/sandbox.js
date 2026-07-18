import { runInSandbox } from "../sandbox.js";

export async function sandboxRunHandler(req, res) {
  const { code } = req.body || {};

  if (typeof code !== "string" || code.trim().length === 0) {
    return res.status(400).json({ error: "code (non-empty string) is required." });
  }

  const result = await runInSandbox(code);
  return res.json(result);
}
