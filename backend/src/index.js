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

const allowedOrigins = ["http://localhost:5173"];
if (process.env.FRONTEND_ORIGIN) {
  allowedOrigins.push(process.env.FRONTEND_ORIGIN);
}
app.use(cors({ origin: allowedOrigins }));

app.use(rateLimit);

app.post("/api/access/verify", accessVerifyHandler);
app.post("/api/chat", requireAccessCode, chatHandler);
app.post("/api/sandbox/run", requireAccessCode, sandboxRunHandler);
app.post("/api/judge", requireAccessCode, judgeHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`backend listening on :${PORT}`);
});
