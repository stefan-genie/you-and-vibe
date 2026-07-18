import { runInSandbox } from "../sandbox.js";

const KNOWN_TASK_IDS = new Set([
  "intro-1", "intro-2", "intro-3",
  "t1", "t2", "t3", "t4", "t5", "t6",
]);

export async function sandboxRunHandler(req, res) {
  const { code, taskId } = req.body || {};

  if (typeof code !== "string" || code.trim().length === 0) {
    return res.status(400).json({ error: "code (non-empty string) is required." });
  }

  if (taskId !== undefined) {
    if (typeof taskId !== "string" || !KNOWN_TASK_IDS.has(taskId)) {
      return res.status(400).json({ error: `Unknown taskId: ${taskId}` });
    }
  }

  const result = await runInSandbox(code, taskId);
  return res.json(result);
}
