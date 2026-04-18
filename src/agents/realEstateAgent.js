import { buildSystemPrompt, buildUserPrompt } from "./prompts.js";

/**
 * RealEstateAgent
 *
 * Orchestrates:
 *  1. Prompt construction
 *  2. LLM invocation
 *  3. Response parsing & validation
 *  4. Cache read/write
 */
class RealEstateAgent {
  /**
   * @param {import('../services/llmService.js').default} llmService
   * @param {import('../cache/cacheService.js').default} cacheService
   */
  constructor(llmService, cacheService) {
    this.llm = llmService;
    this.cache = cacheService;
  }

  /**
   * Generate a market research report for the given location.
   * @param {string} location  — city name or "lat, lng"
   * @param {string} locationType — "city" | "coordinates"
   * @returns {Promise<object>} parsed report JSON
   */
  async generateReport(location, locationType) {
    // 1. Check cache
    const cached = this.cache.get(location);
    if (cached) {
      return { ...cached, _cached: true };
    }

    // 2. Build prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(location, locationType);

    // 3. Call LLM
    const rawResponse = await this.llm.complete(systemPrompt, userPrompt);

    // 4. Parse JSON from response (strip code fences if present)
    const report = this._parseJSON(rawResponse);

    // 5. Inject metadata
    report.generated_at = report.generated_at || new Date().toISOString();
    report._cached = false;

    // 6. Cache the result
    this.cache.set(location, report);

    return report;
  }

  /**
   * Robustly parse JSON from LLM output.
   * Handles cases where the model wraps JSON in markdown code fences.
   */
  _parseJSON(raw) {
    let cleaned = raw.trim();

    // Strip ```json ... ``` or ``` ... ```
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    try {
      return JSON.parse(cleaned);
    } catch (err) {
      // Attempt to extract the first JSON object from the string
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          // fall through
        }
      }
      throw new Error(
        `Failed to parse LLM response as JSON: ${err.message}\nRaw (first 500 chars): ${raw.slice(0, 500)}`
      );
    }
  }
}

export default RealEstateAgent;
