# Real Estate Market Research AI Agent

An AI-powered agent that generates structured real estate market research reports for any location worldwide. Built with **Node.js**, **Express**, and **Google Gemini 2.5 Flash** (completely free, no credit card needed).

---

## Architecture & Approach

```
Request → Validation → Cache Check → Prompt Builder → Gemini LLM → JSON Parser → Response
```

### Key Design Decisions

| Concern | Decision | Rationale |
|---|---|---|
| **LLM** | Google Gemini 2.5 Flash (free tier) | Completely free API, no credit card required, strong JSON output, 15 RPM / 500 RPD |
| **Prompt strategy** | System + User prompt separation | System sets persona/constraints; user prompt supplies location + exact JSON schema |
| **Output format** | Gemini native JSON mode (`responseMimeType: "application/json"`) | Guarantees valid JSON — no post-processing needed |
| **Caching** | In-memory (node-cache) | Avoids redundant LLM calls for repeated locations; configurable TTL |
| **Validation** | Zod schemas | Runtime type safety for API inputs with clear error messages |
| **Code style** | ES Modules, class-based services | Clean separation of concerns; easy to test and extend |

### Module Structure

```
src/
├── index.js                    # Entry point — wires services & starts server
├── agents/
│   ├── realEstateAgent.js      # Core agent: orchestrates prompt → LLM → parse → cache
│   └── prompts.js              # Prompt engineering: system & user prompt builders
├── services/
│   └── llmService.js           # Thin Anthropic SDK wrapper
├── cache/
│   └── cacheService.js         # In-memory cache with TTL
├── routes/
│   └── report.js               # Express route handlers
└── utils/
    └── validation.js           # Zod-based input validation
```

---

## Setup

### Prerequisites

- **Node.js** ≥ 18
- **Google Gemini API key** — FREE, no credit card needed ([get one here](https://aistudio.google.com/apikey))

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd real-estate-agent

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Run

```bash
# Production
npm start

# Development (auto-restart on changes, Node 18+)
npm run dev
```

The server starts on `http://localhost:3000` by default.

---

## API Usage

### `POST /generate-report`

Generate a real estate market research report.

#### Option A — By city name

```bash
curl -X POST http://localhost:3000/generate-report \
  -H "Content-Type: application/json" \
  -d '{"city": "Mumbai"}'
```

#### Option B — By coordinates

```bash
curl -X POST http://localhost:3000/generate-report \
  -H "Content-Type: application/json" \
  -d '{"latitude": 19.0760, "longitude": 72.8777}'
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "location": {
      "name": "Mumbai",
      "region": "Maharashtra",
      "country": "India",
      "coordinates": { "latitude": 19.076, "longitude": 72.8777 }
    },
    "market_overview": { ... },
    "average_prices": { ... },
    "popular_localities": [ ... ],
    "price_trends": { ... },
    "investment_insights": { ... },
    "pros_and_cons": { ... },
    "summary": "...",
    "disclaimer": "...",
    "generated_at": "2026-04-17T...",
    "_cached": false
  }
}
```

The `_cached` field indicates whether the response came from cache.

#### Error Response (400)

```json
{
  "success": false,
  "error": "Invalid input",
  "details": [
    { "path": "", "message": "Provide either 'city' or both 'latitude' and 'longitude'." }
  ]
}
```

### `GET /health`

```bash
curl http://localhost:3000/health
```

Returns server status and cache statistics.

---

## Report Schema

Each report contains these sections:

| Section | Description |
|---|---|
| `location` | Resolved name, region, country, coordinates |
| `market_overview` | Summary, market stage, demand/supply, economic drivers |
| `average_prices` | Buy & rent prices (residential + commercial) with low/mid/high ranges |
| `popular_localities` | 6+ localities with type, price, highlights, connectivity |
| `price_trends` | Historical changes (1/3/5yr) and short/medium-term forecasts |
| `investment_insights` | Rental yields, best segments, hotspots, risk level, tips |
| `pros_and_cons` | Balanced pros and cons list |
| `summary` | Executive summary |

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | — | **Required.** Your Google Gemini API key (free) |
| `PORT` | `3000` | Server port |
| `CACHE_TTL` | `3600` | Cache duration in seconds (1 hour) |
| `LLM_MODEL` | `gemini-2.5-flash-preview-04-17` | Gemini model to use |

---

## Bonus Features

- **100% Free LLM** — Uses Google Gemini 2.5 Flash free tier. No credit card, no billing, no cost.
- **Native JSON mode** — Gemini's `responseMimeType: "application/json"` guarantees valid JSON output without any parsing heuristics.
- **Caching** — Repeated queries for the same location return instantly from memory cache, saving API quota and latency.
- **Robust JSON parsing** — Fallback parser handles edge cases if the model wraps JSON in code fences or preamble.
- **Coordinate resolution** — Coordinates are sent to the LLM which identifies the nearest city/locality.
- **Structured prompt design** — The prompt enforces an exact JSON schema with numeric types, ensuring machine-readable output.
- **Input validation** — Zod schemas provide clear, actionable error messages for malformed requests.

## Free Tier Limits

| Metric | Limit |
|---|---|
| Requests per minute | ~15 |
| Requests per day | ~500 |
| Tokens per minute | 250,000 |
| Credit card required | No |

These limits are more than sufficient for development and light production use.

---

## Extending the Agent

**Add external data sources**: Inject a data-fetching step in `realEstateAgent.js` before the LLM call to enrich prompts with live API data (e.g., from property listing APIs, census data, or economic indicators).

**Add RAG**: Store market reports or property listings in a vector database, retrieve relevant chunks based on location, and include them in the user prompt for grounded, data-backed analysis.

**Swap the LLM**: Replace `llmService.js` with any OpenAI-compatible client — the agent and prompt layers are LLM-agnostic.

