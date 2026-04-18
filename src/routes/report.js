import { Router } from "express";
import { validateLocationInput } from "../utils/validation.js";
import { ZodError } from "zod";

/**
 * Creates the API router.
 * @param {import('../agents/realEstateAgent.js').default} agent
 * @param {import('../cache/cacheService.js').default} cacheService
 */
export function createRouter(agent, cacheService) {
  const router = Router();

  /**
   * POST /generate-report
   *
   * Body (JSON):
   *   { "city": "Mumbai" }
   *   OR
   *   { "latitude": 19.076, "longitude": 72.8777 }
   */
  router.post("/generate-report", async (req, res) => {
    try {
      // Validate input
      const { location, type } = validateLocationInput(req.body);

      // Generate report via agent
      const report = await agent.generateReport(location, type);

      return res.json({
        success: true,
        data: report,
      });
    } catch (err) {
      // Validation errors
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          details: err.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }

      // LLM / parse errors
      console.error("[generate-report] Error:", err.message);
      return res.status(500).json({
        success: false,
        error: "Failed to generate report",
        message: err.message,
      });
    }
  });

  /** GET /health — simple health check */
  router.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      cache: cacheService.stats(),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
