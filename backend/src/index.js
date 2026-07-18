import "dotenv/config";
import express from "express";
import cors from "cors";
import { rateLimit } from "./middleware/rateLimit.js";
import { chatHandler } from "./routes/chat.js";

const app = express();
app.use(express.json());

const allowedOrigins = ["http://localhost:5173"];
if (process.env.FRONTEND_ORIGIN) {
  allowedOrigins.push(process.env.FRONTEND_ORIGIN);
}
app.use(cors({ origin: allowedOrigins }));

app.use(rateLimit);

app.post("/api/chat", chatHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`backend listening on :${PORT}`);
});
