import { Router } from "express";
import { validateLocationInput } from "../utils/validation.js";
import { ZodError } from "zod";
import { buildReportFileName, buildReportPdf } from "../services/pdfReportService.js";

//Creates the API router.
//@param {import('../agents/realEstateAgent.js').default} agent
//@param {import('../cache/cacheService.js').default} cacheService

export function createRouter(agent, cacheService) {
  const router = Router();

  async function handleReportRequest(input, format, res) {
    const { location, type } = validateLocationInput(input);
    const responseFormat = String(format || "pdf").toLowerCase();
    const report = await agent.generateReport(location, type);

    if (responseFormat === "json") {
      return res.json({
        success: true,
        data: report,
      });
    }

    const pdfBuffer = await buildReportPdf(report);
    const fileName = buildReportFileName(report);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.send(pdfBuffer);
  }

  router.post("/generate-report", async (req, res) => {
    try {
      return await handleReportRequest(req.body, req.query.format, res);
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

  router.get("/generate-report", async (req, res) => {
    try {
      const body = {
        city: req.query.city,
        latitude: req.query.latitude ? Number(req.query.latitude) : undefined,
        longitude: req.query.longitude ? Number(req.query.longitude) : undefined,
      };

      return await handleReportRequest(body, req.query.format, res);
    } catch (err) {
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
