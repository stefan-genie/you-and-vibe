import "dotenv/config";
import express from "express";
import cors from "cors";
import { rateLimit } from "./middleware/rateLimit.js";
import { requireAccessCode } from "./middleware/requireAccessCode.js";
import { chatHandler } from "./routes/chat.js";
import { sandboxRunHandler } from "./routes/sandbox.js";
import { judgeHandler } from "./routes/judge.js";
import { accessVerifyHandler } from "./routes/access.js";

const app = express();
app.use(express.json());

function getAllowedOrigins() {
  const origins = ["http://localhost:5173"];
  if (process.env.FRONTEND_ORIGIN) {
    origins.push(process.env.FRONTEND_ORIGIN);
  }
  return origins;
}
app.use(cors({ origin: getAllowedOrigins() }));

app.use(rateLimit);

app.post("/api/access/verify", accessVerifyHandler);
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.post("/api/chat", requireAccessCode, chatHandler);
app.post("/api/sandbox/run", requireAccessCode, sandboxRunHandler);
app.post("/api/judge", requireAccessCode, judgeHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`backend listening on :${PORT}`);
});
