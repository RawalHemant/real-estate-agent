/**
 * Builds structured prompts for real estate market research.
 *
 * Design decisions:
 *  - System prompt sets the agent persona and enforces JSON output.
 *  - User prompt supplies location context and the exact schema expected.
 *  - We request structured JSON so downstream consumers can parse reliably.
 */

export function buildSystemPrompt() {
  return `You are an expert real estate market research analyst with deep knowledge of property markets worldwide. Your role is to generate comprehensive, data-driven market research reports.

IMPORTANT GUIDELINES:
1. Provide realistic, well-reasoned data based on your knowledge. Where exact current figures are unavailable, provide reasonable estimates clearly marked as estimates.
2. Always structure your analysis with specific numbers, price ranges, and percentages.
3. Be balanced — present both opportunities and risks.
4. Tailor insights to the specific location's unique characteristics.
5. Respond ONLY with valid JSON matching the requested schema. No markdown, no preamble, no code fences.`;
}

export function buildUserPrompt(location, locationType) {
  const locationContext =
    locationType === "coordinates"
      ? `the area at coordinates ${location} (identify the nearest city/locality)`
      : location;

  return `Generate a comprehensive real estate market research report for: ${locationContext}

Return a JSON object with exactly this structure:

{
  "location": {
    "name": "<full location name>",
    "region": "<state/province/region>",
    "country": "<country>",
    "coordinates": { "latitude": <number>, "longitude": <number> }
  },
  "market_overview": {
    "summary": "<2-3 paragraph market overview>",
    "market_stage": "<emerging | growing | mature | saturated | declining>",
    "demand_supply_dynamics": "<description of current demand vs supply>",
    "key_economic_drivers": ["<driver1>", "<driver2>", "..."]
  },
  "average_prices": {
    "currency": "<local currency code>",
    "residential": {
      "buy": {
        "apartment_per_sqft": { "low": <number>, "mid": <number>, "high": <number> },
        "house_per_sqft": { "low": <number>, "mid": <number>, "high": <number> }
      },
      "rent_monthly": {
        "1bhk": { "low": <number>, "mid": <number>, "high": <number> },
        "2bhk": { "low": <number>, "mid": <number>, "high": <number> },
        "3bhk": { "low": <number>, "mid": <number>, "high": <number> }
      }
    },
    "commercial": {
      "office_per_sqft_monthly": { "low": <number>, "mid": <number>, "high": <number> },
      "retail_per_sqft_monthly": { "low": <number>, "mid": <number>, "high": <number> }
    },
    "data_note": "<any caveats about the pricing data>"
  },
  "popular_localities": [
    {
      "name": "<locality name>",
      "type": "<premium | mid-range | affordable | upcoming>",
      "avg_price_per_sqft": <number>,
      "highlights": "<what makes this area attractive>",
      "connectivity": "<transport/infra highlights>"
    }
  ],
  "price_trends": {
    "historical": {
      "1_year_change_pct": <number>,
      "3_year_change_pct": <number>,
      "5_year_change_pct": <number>
    },
    "forecast": {
      "short_term_1yr": "<outlook description>",
      "medium_term_3yr": "<outlook description>"
    },
    "factors_influencing_trends": ["<factor1>", "<factor2>", "..."]
  },
  "investment_insights": {
    "rental_yield_pct": { "low": <number>, "high": <number> },
    "best_segments": ["<segment1>", "<segment2>"],
    "emerging_hotspots": ["<area1>", "<area2>"],
    "recommended_investment_horizon": "<short/medium/long term>",
    "risk_level": "<low | moderate | high>",
    "tips": ["<tip1>", "<tip2>", "..."]
  },
  "pros_and_cons": {
    "pros": ["<pro1>", "<pro2>", "..."],
    "cons": ["<con1>", "<con2>", "..."]
  },
  "summary": "<concise 3-4 sentence executive summary with key takeaways>",
  "disclaimer": "This report is generated using AI-based analysis. Data represents estimates and general market knowledge. Consult local real estate professionals and verify current data before making investment decisions.",
  "generated_at": "<ISO 8601 timestamp>"
}

Provide at least 6 popular localities. All numeric values must be actual numbers, not strings. Ensure the report is specific to ${locationContext} with locally relevant details.`;
}
