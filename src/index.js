import "dotenv/config";
import express from "express";
import LLMService from "./services/llmService.js";
import CacheService from "./cache/cacheService.js";
import RealEstateAgent from "./agents/realEstateAgent.js";
import { createRouter } from "./routes/report.js";

//Config 
const PORT = process.env.PORT || 3000;
const CACHE_TTL = parseInt(process.env.CACHE_TTL, 10) || 3600;
const LLM_MODEL = process.env.LLM_MODEL || "gemini-flash-latest";

//Bootstrap services
const llmService = new LLMService(process.env.GEMINI_API_KEY, LLM_MODEL);
const cacheService = new CacheService(CACHE_TTL);
const agent = new RealEstateAgent(llmService, cacheService);

//Express app
const app = express();
app.use(express.json());
// Mount API routes
app.use("/", createRouter(agent, cacheService));
// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Not found" });
});
// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});
app.listen(PORT, () => {
  console.log(`Real Estate Market Research Agent running on http://localhost:${PORT}`);
  console.log(`  POST /generate-report  — generate a report`);
  console.log(`  GET  /health           — health check`);
});

export default app;
