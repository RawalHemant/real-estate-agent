import PDFDocument from "pdfkit";

const PAGE_MARGIN = 50;
const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const FOOTER_HEIGHT = 30;
const USABLE_BOTTOM_OFFSET = PAGE_MARGIN + FOOTER_HEIGHT;

function getUsableBottom(doc) {
  return doc.page.height - USABLE_BOTTOM_OFFSET;
}

function ensureSpace(doc, heightNeeded = 24) {
  if (doc.y + heightNeeded > getUsableBottom(doc)) {
    doc.addPage();
  }
}

function safeText(value) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  return String(value);
}

function measureTextHeight(doc, text, options = {}) {
  return doc.heightOfString(safeText(text), {
    width: CONTENT_WIDTH,
    ...options,
  });
}

function addSectionTitle(doc, title) {
  ensureSpace(doc, 36);
  doc.moveDown(0.5);
  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor("#12355B")
    .text(title, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });

  const lineY = doc.y + 4;
  doc
    .lineWidth(1)
    .strokeColor("#D8E1EA")
    .moveTo(PAGE_MARGIN, lineY)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, lineY)
    .stroke();

  doc.y = lineY + 10;
}

function addLabelValue(doc, label, value, options = {}) {
  const labelText = `${label}: `;
  const valueText = safeText(value);
  const fontSize = options.valueSize || 10;
  const lineGap = options.lineGap || 2;

  doc.font("Helvetica-Bold").fontSize(fontSize);
  const labelWidth = doc.widthOfString(labelText);
  const valueWidth = Math.max(CONTENT_WIDTH - labelWidth, 120);
  const valueHeight = doc.heightOfString(valueText, {
    width: valueWidth,
    lineGap,
  });
  const rowHeight = Math.max(valueHeight, fontSize + 4);

  ensureSpace(doc, rowHeight + 6);

  const startY = doc.y;
  doc
    .font("Helvetica-Bold")
    .fontSize(fontSize)
    .fillColor("#1F2937")
    .text(labelText, PAGE_MARGIN, startY, {
      width: labelWidth,
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(fontSize)
    .fillColor("#374151")
    .text(valueText, PAGE_MARGIN + labelWidth, startY, {
      width: valueWidth,
      lineGap,
    });

  doc.y = startY + rowHeight + 4;
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
    doc.font("Helvetica").fontSize(10.5);
    const paragraphHeight = measureTextHeight(doc, paragraph, {
      align: "left",
      lineGap: 3,
    });

    ensureSpace(doc, paragraphHeight + 8);
    doc
      .fillColor("#374151")
      .text(paragraph, PAGE_MARGIN, doc.y, {
        width: CONTENT_WIDTH,
        align: "left",
        lineGap: 3,
      });

    doc.moveDown(0.4);
  });
}

function addBullets(doc, items) {
  if (!Array.isArray(items) || items.length === 0) {
    addLabelValue(doc, "Details", "N/A");
    return;
  }

  items.forEach((item) => {
    doc.font("Helvetica").fontSize(10);
    const bulletIndent = 14;
    const bulletText = `- ${safeText(item)}`;
    const bulletHeight = doc.heightOfString(bulletText, {
      width: CONTENT_WIDTH - bulletIndent,
      lineGap: 2,
    });

    ensureSpace(doc, bulletHeight + 4);
    doc
      .fillColor("#374151")
      .text(bulletText, PAGE_MARGIN + bulletIndent, doc.y, {
        width: CONTENT_WIDTH - bulletIndent,
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

function formatRange(range, currency) {
  if (!range) {
    return "N/A";
  }

  return `${formatCurrencyValue(range.low, currency)} - ${formatCurrencyValue(range.high, currency)} (mid: ${formatCurrencyValue(range.mid, currency)})`;
}

function addKeyValueGrid(doc, rows) {
  rows.forEach(([label, value]) => addLabelValue(doc, label, value));
}

function addLocalityCard(doc, locality, currency) {
  const title = locality?.name || "Unnamed locality";
  const meta = `Type: ${safeText(locality?.type)} | Avg Price/Sqft: ${formatCurrencyValue(locality?.avg_price_per_sqft, currency)}`;
  const highlights = `Highlights: ${safeText(locality?.highlights)}`;
  const connectivity = `Connectivity: ${safeText(locality?.connectivity)}`;

  doc.font("Helvetica-Bold").fontSize(11);
  const titleHeight = doc.heightOfString(title, {
    width: CONTENT_WIDTH - 24,
  });

  doc.font("Helvetica").fontSize(9.5);
  const metaHeight = doc.heightOfString(meta, {
    width: CONTENT_WIDTH - 24,
    lineGap: 2,
  });
  const highlightsHeight = doc.heightOfString(highlights, {
    width: CONTENT_WIDTH - 24,
    lineGap: 2,
  });
  const connectivityHeight = doc.heightOfString(connectivity, {
    width: CONTENT_WIDTH - 24,
    lineGap: 2,
  });

  const padding = 12;
  const contentHeight =
    titleHeight + metaHeight + highlightsHeight + connectivityHeight + padding * 2 + 12;

  ensureSpace(doc, contentHeight + 8);

  const startY = doc.y;
  doc
    .roundedRect(PAGE_MARGIN, startY, CONTENT_WIDTH, contentHeight, 6)
    .fillAndStroke("#F8FAFC", "#D8E1EA");

  let currentY = startY + padding;

  doc
    .fillColor("#12355B")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(title, PAGE_MARGIN + 12, currentY, {
      width: CONTENT_WIDTH - 24,
    });

  currentY = doc.y + 4;
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor("#374151")
    .text(meta, PAGE_MARGIN + 12, currentY, {
      width: CONTENT_WIDTH - 24,
      lineGap: 2,
    });

  currentY = doc.y + 3;
  doc.text(highlights, PAGE_MARGIN + 12, currentY, {
    width: CONTENT_WIDTH - 24,
    lineGap: 2,
  });

  currentY = doc.y + 3;
  doc.text(connectivity, PAGE_MARGIN + 12, currentY, {
    width: CONTENT_WIDTH - 24,
    lineGap: 2,
  });

  doc.y = startY + contentHeight + 8;
}

function sanitizeFileName(value) {
  return (
    String(value || "report")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "report"
  );
}

export function buildReportFileName(report) {
  const locationName = report?.location?.name || "real-estate-report";
  return `${sanitizeFileName(locationName)}-market-report.pdf`;
}

function addFooter(doc) {
  const range = doc.bufferedPageRange();
  const pageCount = range.count;

  for (let index = 0; index < pageCount; index += 1) {
    doc.switchToPage(index);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#6B7280")
      .text(`Page ${index + 1} of ${pageCount}`, PAGE_MARGIN, doc.page.height - 24, {
        width: CONTENT_WIDTH,
        align: "center",
      });
  }
}

export function buildReportPdf(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: PAGE_MARGIN,
      size: "A4",
      bufferPages: true,
      autoFirstPage: true,
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
      .text(safeText(report?.location?.name || "Location unavailable"), {
        width: CONTENT_WIDTH,
      });

    doc
      .moveDown(0.2)
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#4B5563")
      .text(
        `${safeText(report?.location?.region)}, ${safeText(report?.location?.country)} | Generated: ${generatedAt}`,
        { width: CONTENT_WIDTH }
      );

    const ruleY = doc.y + 6;
    doc
      .lineWidth(1.2)
      .strokeColor("#12355B")
      .moveTo(PAGE_MARGIN, ruleY)
      .lineTo(PAGE_MARGIN + CONTENT_WIDTH, ruleY)
      .stroke();
    doc.y = ruleY + 10;

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
    addLabelValue(doc, "Key Economic Drivers", " ");
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
    addLabelValue(doc, "Trend Drivers", " ");
    addBullets(doc, report?.price_trends?.factors_influencing_trends);

    addSectionTitle(doc, "Investment Insights");
    addKeyValueGrid(doc, [
      [
        "Rental Yield Range",
        report?.investment_insights?.rental_yield_pct
          ? `${formatNumber(report.investment_insights.rental_yield_pct.low)}% - ${formatNumber(report.investment_insights.rental_yield_pct.high)}%`
          : "N/A",
      ],
      ["Recommended Horizon", report?.investment_insights?.recommended_investment_horizon],
      ["Risk Level", report?.investment_insights?.risk_level],
    ]);
    addLabelValue(doc, "Best Segments", " ");
    addBullets(doc, report?.investment_insights?.best_segments);
    addLabelValue(doc, "Emerging Hotspots", " ");
    addBullets(doc, report?.investment_insights?.emerging_hotspots);
    addLabelValue(doc, "Investor Tips", " ");
    addBullets(doc, report?.investment_insights?.tips);

    addSectionTitle(doc, "Pros and Cons");
    addLabelValue(doc, "Pros", " ");
    addBullets(doc, report?.pros_and_cons?.pros);
    addLabelValue(doc, "Cons", " ");
    addBullets(doc, report?.pros_and_cons?.cons);

    addSectionTitle(doc, "Disclaimer");
    addParagraphs(doc, report?.disclaimer);

    addFooter(doc);
    doc.end();
  });
}
