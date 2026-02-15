import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { askRouter } from "./routes/ask.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Main route
app.use("/ask", askRouter);

app.listen(PORT, () => {
  console.log(`\n  🚀 Analytics Agent server running on http://localhost:${PORT}`);
  console.log(`  📊 POST /ask to query your data\n`);
});
