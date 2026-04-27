import PDFDocument from "pdfkit";

const PAGE_MARGIN = 50;
const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

function ensureSpace(doc, heightNeeded = 24) {
  if (doc.y + heightNeeded > doc.page.height - PAGE_MARGIN) {
    doc.addPage();
  }
}

function addSectionTitle(doc, title) {
  ensureSpace(doc, 30);
  doc
    .moveDown(0.6)
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor("#12355B")
    .text(title, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });

  doc
    .moveDown(0.2)
    .lineWidth(1)
    .strokeColor("#D8E1EA")
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, doc.y)
    .stroke()
    .moveDown(0.4);
}

function addLabelValue(doc, label, value, options = {}) {
  const safeValue = value ?? "N/A";
  ensureSpace(doc, 20);
  doc
    .font("Helvetica-Bold")
    .fontSize(options.labelSize || 10)
    .fillColor("#1F2937")
    .text(`${label}: `, PAGE_MARGIN, doc.y, {
      continued: true,
      width: CONTENT_WIDTH,
    })
    .font("Helvetica")
    .fontSize(options.valueSize || 10)
    .fillColor("#374151")
    .text(String(safeValue), {
      width: CONTENT_WIDTH,
    });
}

function addParagraphs(doc, text) {
  if (!text) {
    return;
  }

  const paragraphs = String(text)
    .split(/\n\s*\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  paragraphs.forEach((paragraph) => {
    ensureSpace(doc, 40);
    doc
      .font("Helvetica")
      .fontSize(10.5)
      .fillColor("#374151")
      .text(paragraph, PAGE_MARGIN, doc.y, {
        width: CONTENT_WIDTH,
        align: "justify",
        lineGap: 3,
      })
      .moveDown(0.4);
  });
}

function addBullets(doc, items) {
  if (!Array.isArray(items) || items.length === 0) {
    addLabelValue(doc, "Details", "N/A");
    return;
  }

  items.forEach((item) => {
    ensureSpace(doc, 18);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#374151")
      .text(`• ${item}`, PAGE_MARGIN + 10, doc.y, {
        width: CONTENT_WIDTH - 10,
        lineGap: 2,
      });
  });

  doc.moveDown(0.3);
}

function formatNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCurrencyValue(value, currency) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency || ""} ${formatNumber(value)}`.trim();
  }
}

function formatRange(range, currency, suffix = "") {
  if (!range) {
    return "N/A";
  }

  return `${formatCurrencyValue(range.low, currency)} - ${formatCurrencyValue(range.high, currency)} (mid: ${formatCurrencyValue(range.mid, currency)})${suffix}`;
}

function addKeyValueGrid(doc, rows) {
  rows.forEach(([label, value]) => {
    addLabelValue(doc, label, value);
  });
}

function addLocalityCard(doc, locality, currency) {
  ensureSpace(doc, 80);
  const startY = doc.y;
  const boxHeight = 78;

  doc
    .roundedRect(PAGE_MARGIN, startY, CONTENT_WIDTH, boxHeight, 6)
    .fillAndStroke("#F8FAFC", "#D8E1EA");

  doc
    .fillColor("#12355B")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(locality.name || "Unnamed locality", PAGE_MARGIN + 12, startY + 10, {
      width: CONTENT_WIDTH - 24,
    });

  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor("#374151")
    .text(
      `Type: ${locality.type || "N/A"}    Avg Price/Sqft: ${formatCurrencyValue(locality.avg_price_per_sqft, currency)}`,
      PAGE_MARGIN + 12,
      startY + 28,
      { width: CONTENT_WIDTH - 24 }
    )
    .text(`Highlights: ${locality.highlights || "N/A"}`, PAGE_MARGIN + 12, startY + 43, {
      width: CONTENT_WIDTH - 24,
    })
    .text(`Connectivity: ${locality.connectivity || "N/A"}`, PAGE_MARGIN + 12, startY + 58, {
      width: CONTENT_WIDTH - 24,
    });

  doc.y = startY + boxHeight + 8;
}

function sanitizeFileName(value) {
  return String(value || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "report";
}

export function buildReportFileName(report) {
  const locationName = report?.location?.name || "real-estate-report";
  return `${sanitizeFileName(locationName)}-market-report.pdf`;
}

export function buildReportPdf(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: PAGE_MARGIN,
      size: "A4",
      bufferPages: true,
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const currency = report?.average_prices?.currency;
    const generatedAt = report?.generated_at
      ? new Date(report.generated_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : new Date().toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        });

    doc
      .fillColor("#12355B")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("Real Estate Market Research Report", PAGE_MARGIN, doc.y, {
        width: CONTENT_WIDTH,
      });

    doc
      .moveDown(0.35)
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#111827")
      .text(report?.location?.name || "Location unavailable", {
        width: CONTENT_WIDTH,
      });

    doc
      .moveDown(0.2)
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#4B5563")
      .text(
        `${report?.location?.region || "N/A"}, ${report?.location?.country || "N/A"} | Generated: ${generatedAt}`,
        { width: CONTENT_WIDTH }
      );

    doc
      .moveDown(0.6)
      .lineWidth(1.2)
      .strokeColor("#12355B")
      .moveTo(PAGE_MARGIN, doc.y)
      .lineTo(PAGE_MARGIN + CONTENT_WIDTH, doc.y)
      .stroke();

    addSectionTitle(doc, "Executive Summary");
    addParagraphs(doc, report?.summary);

    addSectionTitle(doc, "Location Details");
    addKeyValueGrid(doc, [
      ["Region", report?.location?.region],
      ["Country", report?.location?.country],
      [
        "Coordinates",
        report?.location?.coordinates
          ? `${report.location.coordinates.latitude}, ${report.location.coordinates.longitude}`
          : "N/A",
      ],
      ["Market Stage", report?.market_overview?.market_stage],
    ]);

    addSectionTitle(doc, "Market Overview");
    addParagraphs(doc, report?.market_overview?.summary);
    addLabelValue(doc, "Demand vs Supply", report?.market_overview?.demand_supply_dynamics);
    addLabelValue(doc, "Key Economic Drivers", "");
    addBullets(doc, report?.market_overview?.key_economic_drivers);

    addSectionTitle(doc, "Average Prices");
    addKeyValueGrid(doc, [
      [
        "Apartment Buy Price / Sqft",
        formatRange(report?.average_prices?.residential?.buy?.apartment_per_sqft, currency),
      ],
      [
        "House Buy Price / Sqft",
        formatRange(report?.average_prices?.residential?.buy?.house_per_sqft, currency),
      ],
      [
        "1 BHK Monthly Rent",
        formatRange(report?.average_prices?.residential?.rent_monthly?.["1bhk"], currency),
      ],
      [
        "2 BHK Monthly Rent",
        formatRange(report?.average_prices?.residential?.rent_monthly?.["2bhk"], currency),
      ],
      [
        "3 BHK Monthly Rent",
        formatRange(report?.average_prices?.residential?.rent_monthly?.["3bhk"], currency),
      ],
      [
        "Office Rent / Sqft / Month",
        formatRange(report?.average_prices?.commercial?.office_per_sqft_monthly, currency),
      ],
      [
        "Retail Rent / Sqft / Month",
        formatRange(report?.average_prices?.commercial?.retail_per_sqft_monthly, currency),
      ],
      ["Pricing Note", report?.average_prices?.data_note],
    ]);

    addSectionTitle(doc, "Popular Localities");
    if (Array.isArray(report?.popular_localities) && report.popular_localities.length > 0) {
      report.popular_localities.forEach((locality) => addLocalityCard(doc, locality, currency));
    } else {
      addLabelValue(doc, "Localities", "N/A");
    }

    addSectionTitle(doc, "Price Trends");
    addKeyValueGrid(doc, [
      [
        "1 Year Change",
        `${formatNumber(report?.price_trends?.historical?.["1_year_change_pct"])}%`,
      ],
      [
        "3 Year Change",
        `${formatNumber(report?.price_trends?.historical?.["3_year_change_pct"])}%`,
      ],
      [
        "5 Year Change",
        `${formatNumber(report?.price_trends?.historical?.["5_year_change_pct"])}%`,
      ],
      ["1 Year Outlook", report?.price_trends?.forecast?.short_term_1yr],
      ["3 Year Outlook", report?.price_trends?.forecast?.medium_term_3yr],
    ]);
    addLabelValue(doc, "Trend Drivers", "");
    addBullets(doc, report?.price_trends?.factors_influencing_trends);

    addSectionTitle(doc, "Investment Insights");
    addKeyValueGrid(doc, [
      [
        "Rental Yield Range",
        report?.investment_insights?.rental_yield_pct
          ? `${formatNumber(report.investment_insights.rental_yield_pct.low)}% - ${formatNumber(report.investment_insights.rental_yield_pct.high)}%`
          : "N/A",
      ],
      [
        "Recommended Horizon",
        report?.investment_insights?.recommended_investment_horizon,
      ],
      ["Risk Level", report?.investment_insights?.risk_level],
    ]);
    addLabelValue(doc, "Best Segments", "");
    addBullets(doc, report?.investment_insights?.best_segments);
    addLabelValue(doc, "Emerging Hotspots", "");
    addBullets(doc, report?.investment_insights?.emerging_hotspots);
    addLabelValue(doc, "Investor Tips", "");
    addBullets(doc, report?.investment_insights?.tips);

    addSectionTitle(doc, "Pros and Cons");
    addLabelValue(doc, "Pros", "");
    addBullets(doc, report?.pros_and_cons?.pros);
    addLabelValue(doc, "Cons", "");
    addBullets(doc, report?.pros_and_cons?.cons);

    addSectionTitle(doc, "Disclaimer");
    addParagraphs(doc, report?.disclaimer);

    const pageCount = doc.bufferedPageRange().count;
    for (let index = 0; index < pageCount; index += 1) {
      doc.switchToPage(index);
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#6B7280")
        .text(`Page ${index + 1} of ${pageCount}`, PAGE_MARGIN, doc.page.height - 30, {
          width: CONTENT_WIDTH,
          align: "center",
        });
    }

    doc.end();
  });
}
