import type { RoadmapJSON, WeekCard, MonthCard, MilestoneMonth } from "./roadmap-schema.ts";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const C = {
  coral:   "#f96846",
  indigo:  "#6366f1",
  peach:   "#ffeee9",
  blush:   "#fff8f6",
  text:    "#1a1a1a",
  muted:   "#666",
  muted2:  "#aaa",
  border:  "#e0ddd8",
  surface: "#f5f5f3",
  white:   "#ffffff",
  shadow:  "#d8d4ce",
};

// ── Canvas constants ──────────────────────────────────────────────────────────
const W        = 1200;
const PAD      = 32;
const HEADER_H = 132;

// ── Columns ───────────────────────────────────────────────────────────────────
const LEFT_W  = 700;
const COL_GAP = 20;
const RIGHT_X = PAD + LEFT_W + COL_GAP;   // 752
const RIGHT_W = W - RIGHT_X - PAD;         // 416
const CARD_W  = LEFT_W;

const CARD_GAP = 16;

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Word-wrap s into lines of at most charsPerLine chars. Never truncates.
function wordWrapLines(s: string, charsPerLine: number, maxLines = 6): string[] {
  const clean = s.replace(/\s+/g, " ").trim();
  const words = clean.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (test.length <= charsPerLine) {
      cur = test;
    } else {
      if (cur) lines.push(cur);
      // word longer than line — split it
      cur = w.length > charsPerLine ? w.slice(0, charsPerLine) : w;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

// Render wrapped text; returns [svgString, heightConsumed]
function wrapText(
  s: string, x: number, startY: number,
  charsPerLine: number, lineH: number,
  fontFamily: string, fontSize: number, fill: string,
  fontStyle = "normal", maxLines = 4,
): [string, number] {
  const lines = wordWrapLines(s, charsPerLine, maxLines);
  const fa = `font-family="${fontFamily}" font-size="${fontSize}" fill="${fill}" font-style="${fontStyle}"`;
  const svg = lines.map((l, i) =>
    `<text x="${x}" y="${startY + i * lineH}" ${fa}>${esc(l)}</text>`
  ).join("");
  return [svg, lines.length * lineH];
}

// ── Dynamic heights ───────────────────────────────────────────────────────────
const TOPIC_CPL   = 78;  // chars per line for week card topics
const CONTENT_CPL = 86;  // chars per line for build / checkpoint
const MS_CPL      = 52;  // chars per line for milestone items
const NOTE_CPL    = 72;  // chars per line for coaching note
const SUMMARY_CPL = 88;  // chars per line for summary

function weekCardH(card: WeekCard): number {
  const n      = Math.min(card.topics.length, 8);
  const topicH = card.topics.slice(0, n).reduce(
    (s, t) => s + wordWrapLines(t, TOPIC_CPL, 2).length * 16, 0,
  );
  const buildH = wordWrapLines("▸  " + card.mini_project, CONTENT_CPL, 2).length * 16;
  const chkH   = wordWrapLines(card.capability_checkpoint, CONTENT_CPL, 2).length * 16;
  // header(46) + div(10) + topicsLabel(22) + topics + gap+div(14)
  // + BUILDlabel(26) + buildText + div(10) + CANYOUlabel(26) + chkText + pad(18)
  return 46 + 10 + 22 + topicH + 14 + 26 + buildH + 10 + 26 + chkH + 18;
}

function monthCardH(card: MonthCard): number {
  const rowsH = card.week_breakdowns.slice(0, 4).reduce((s, wb) => {
    const lines = wordWrapLines(wb.topics.join("  ·  "), 72, 2).length;
    return s + lines * 16 + 6;  // 16px/line + 6px row gap
  }, 0);
  const projH = wordWrapLines("▸  " + card.mini_project, 82, 2).length * 16;
  // header(44) + div(10) + weekLabel(18) + rows + gap+div(14) + projLabel(20) + proj + pad(18)
  return 44 + 10 + 18 + rowsH + 14 + 20 + projH + 18;
}

function footerH(r: RoadmapJSON): number {
  const noteLines    = wordWrapLines(r.coaching_note, NOTE_CPL, 3).length;
  const summaryLines = wordWrapLines(r.summary,       SUMMARY_CPL, 2).length;
  // top(16) + label(20) + gap(8) + note(nL*20) + gap(10) + summary(sL*18) + bottom(20)
  return 16 + 20 + 8 + noteLines * 20 + 10 + summaryLines * 18 + 20;
}

function milestoneH(tracker: MilestoneMonth[]): number {
  let h = 26; // MILESTONE TRACKER label
  for (const entry of tracker) {
    h += 40; // header bar + spacing
    for (const ms of entry.milestones.slice(0, 4)) {
      h += wordWrapLines(ms, MS_CPL, 2).length * 18 + 4;
    }
    h += 14;
  }
  return h;
}

// ── Canvas height ─────────────────────────────────────────────────────────────
function computeHeight(r: RoadmapJSON): number {
  const weekH  = r.week_cards.reduce((s, wc) => s + weekCardH(wc) + CARD_GAP, 0);
  const monthH = r.month_cards.reduce((s, mc) => s + monthCardH(mc) + CARD_GAP, 0);
  const leftH  = HEADER_H + 12 + weekH + monthH;
  const rightH = HEADER_H + 12 + milestoneH(r.milestone_tracker);
  const fH     = footerH(r);
  return Math.max(leftH, rightH) + fH;
}

// ── Header ────────────────────────────────────────────────────────────────────
function renderHeader(r: RoadmapJSON): string {
  const date = new Date(r.generated_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
  // target_outcome wraps to 2 lines within header
  const [outcomeSvg] = wrapText(
    r.target_outcome, PAD + 14, 70, 105, 16,
    "Space Grotesk, sans-serif", 12, C.muted,
  );
  return `
  <rect x="0" y="0" width="${W}" height="${HEADER_H}" fill="${C.white}"/>
  <rect x="0" y="0" width="5" height="${HEADER_H}" fill="${C.coral}"/>
  <rect x="0" y="${HEADER_H}" width="${W}" height="1.5" fill="${C.border}"/>
  <text x="${PAD + 14}" y="46" font-family="Space Grotesk, sans-serif" font-size="22" font-weight="700" fill="${C.text}">${esc(r.roadmap_title)}</text>
  ${outcomeSvg}
  <rect x="${PAD + 14}" y="88" width="112" height="22" rx="11" fill="${C.peach}"/>
  <text x="${PAD + 70}" y="103" font-family="JetBrains Mono, monospace" font-size="9" font-weight="700" fill="${C.coral}" text-anchor="middle" letter-spacing="0.6">100X ENGINEERS</text>
  <text x="${W - PAD}" y="46" font-family="JetBrains Mono, monospace" font-size="9" fill="${C.muted2}" text-anchor="end">AI Learning Roadmap</text>
  <text x="${W - PAD}" y="62" font-family="JetBrains Mono, monospace" font-size="9" fill="${C.muted2}" text-anchor="end">${esc(date)}</text>`;
}

// ── Week card (Month 1, Weeks 1–4) ────────────────────────────────────────────
function renderWeekCard(card: WeekCard, x: number, y: number): string {
  const w = CARD_W;
  const h = weekCardH(card);
  const n = Math.min(card.topics.length, 8);
  let out = "";
  let cy  = y;

  // Shadow + bg + accent bar
  out += `<rect x="${x+4}" y="${cy+4}" width="${w}" height="${h}" rx="10" fill="${C.shadow}"/>`;
  out += `<rect x="${x}" y="${cy}" width="${w}" height="${h}" rx="10" fill="${C.white}" stroke="${C.border}" stroke-width="1"/>`;
  out += `<rect x="${x}" y="${cy}" width="5" height="${h}" rx="2" fill="${C.coral}"/>`;

  // Circle badge
  out += `<circle cx="${x+28}" cy="${cy+28}" r="14" fill="${C.coral}"/>`;
  out += `<text x="${x+28}" y="${cy+32}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" fill="white" text-anchor="middle">W${card.week}</text>`;

  // WEEK N / M1 badge (top right)
  out += `<rect x="${x+w-84}" y="${cy+10}" width="76" height="20" rx="10" fill="${C.surface}" stroke="${C.border}" stroke-width="0.5"/>`;
  out += `<text x="${x+w-46}" y="${cy+23}" font-family="JetBrains Mono, monospace" font-size="8" fill="${C.muted2}" text-anchor="middle">WEEK ${card.week} / M1</text>`;

  // Theme + tools
  out += `<text x="${x+52}" y="${cy+22}" font-family="Space Grotesk, sans-serif" font-size="14" font-weight="700" fill="${C.text}">${esc(card.theme)}</text>`;
  out += `<text x="${x+52}" y="${cy+38}" font-family="JetBrains Mono, monospace" font-size="8" fill="${C.muted2}">${esc(card.tools.slice(0, 4).join("  ·  "))}</text>`;

  cy += 46;

  // Divider
  out += `<line x1="${x+14}" y1="${cy}" x2="${x+w-14}" y2="${cy}" stroke="${C.border}" stroke-width="0.5"/>`;
  cy += 10;

  // TOPICS label
  out += `<text x="${x+14}" y="${cy+6}" font-family="JetBrains Mono, monospace" font-size="8" font-weight="700" fill="${C.coral}" letter-spacing="0.6">TOPICS</text>`;
  cy += 22;

  // Numbered topics — word-wrapped, no truncation
  for (let i = 0; i < n; i++) {
    const num  = String(i + 1).padStart(2, "0");
    const [tSvg, tH] = wrapText(card.topics[i], x + 38, cy, TOPIC_CPL, 16, "Space Grotesk, sans-serif", 11, C.text, "normal", 2);
    out += `<text x="${x+14}" y="${cy}" font-family="JetBrains Mono, monospace" font-size="9" font-weight="700" fill="${C.coral}">${num}</text>`;
    out += tSvg;
    cy += tH;
  }

  cy += 4;

  // Divider
  out += `<line x1="${x+14}" y1="${cy}" x2="${x+w-14}" y2="${cy}" stroke="${C.border}" stroke-width="0.5"/>`;
  cy += 10;

  // BUILD section
  out += `<text x="${x+14}" y="${cy+10}" font-family="JetBrains Mono, monospace" font-size="8" font-weight="700" fill="${C.coral}" letter-spacing="0.6">BUILD THIS WEEK</text>`;
  cy += 26;
  const [buildSvg, buildH] = wrapText("▸  " + card.mini_project, x + 14, cy, CONTENT_CPL, 16, "Space Grotesk, sans-serif", 11, C.text, "normal", 2);
  out += buildSvg;
  cy += buildH;

  // Divider
  out += `<line x1="${x+14}" y1="${cy+6}" x2="${x+w-14}" y2="${cy+6}" stroke="${C.border}" stroke-width="0.5"/>`;
  cy += 16;

  // CAN YOU section
  out += `<text x="${x+14}" y="${cy+10}" font-family="JetBrains Mono, monospace" font-size="8" font-weight="700" fill="${C.muted2}" letter-spacing="0.6">CAN YOU...</text>`;
  cy += 26;
  const [chkSvg] = wrapText(card.capability_checkpoint, x + 14, cy, CONTENT_CPL, 16, "Space Grotesk, sans-serif", 10, C.muted, "italic", 2);
  out += chkSvg;

  return out;
}

// ── Month card (Month 2+) ─────────────────────────────────────────────────────
function renderMonthCard(card: MonthCard, x: number, y: number): string {
  const w = CARD_W;
  const h = monthCardH(card);
  let out = "";
  let cy  = y;

  // Shadow + bg + accent bar
  out += `<rect x="${x+4}" y="${cy+4}" width="${w}" height="${h}" rx="10" fill="${C.shadow}"/>`;
  out += `<rect x="${x}" y="${cy}" width="${w}" height="${h}" rx="10" fill="${C.white}" stroke="${C.border}" stroke-width="1"/>`;
  out += `<rect x="${x}" y="${cy}" width="5" height="${h}" rx="2" fill="${C.indigo}"/>`;

  // Circle badge
  out += `<circle cx="${x+28}" cy="${cy+26}" r="14" fill="${C.indigo}"/>`;
  out += `<text x="${x+28}" y="${cy+30}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" fill="white" text-anchor="middle">M${card.month}</text>`;

  // MONTH N badge (top right)
  out += `<rect x="${x+w-84}" y="${cy+8}" width="76" height="20" rx="10" fill="${C.surface}" stroke="${C.border}" stroke-width="0.5"/>`;
  out += `<text x="${x+w-46}" y="${cy+21}" font-family="JetBrains Mono, monospace" font-size="8" fill="${C.muted2}" text-anchor="middle">MONTH ${card.month}</text>`;

  // Theme
  out += `<text x="${x+52}" y="${cy+20}" font-family="Space Grotesk, sans-serif" font-size="14" font-weight="700" fill="${C.text}">${esc(card.theme)}</text>`;

  cy += 44;

  // Divider
  out += `<line x1="${x+14}" y1="${cy}" x2="${x+w-14}" y2="${cy}" stroke="${C.border}" stroke-width="0.5"/>`;
  cy += 10;

  // WEEK TOPICS label
  out += `<text x="${x+14}" y="${cy+6}" font-family="JetBrains Mono, monospace" font-size="8" font-weight="700" fill="${C.indigo}" letter-spacing="0.6">WEEK TOPICS</text>`;
  cy += 18;

  // Week rows — wrapped topics, no truncation
  for (const wb of card.week_breakdowns.slice(0, 4)) {
    const topicsStr = wb.topics.join("  ·  ");
    const [tSvg, tH] = wrapText(topicsStr, x + 60, cy, 72, 16, "Space Grotesk, sans-serif", 11, C.text, "normal", 2);
    out += `<text x="${x+14}" y="${cy}" font-family="JetBrains Mono, monospace" font-size="8" font-weight="700" fill="${C.indigo}">${esc(wb.week_label)}</text>`;
    out += tSvg;
    cy += tH + 6;
  }

  // Divider
  out += `<line x1="${x+14}" y1="${cy}" x2="${x+w-14}" y2="${cy}" stroke="${C.border}" stroke-width="0.5"/>`;
  cy += 10;

  // PROJECT section
  out += `<text x="${x+14}" y="${cy+8}" font-family="JetBrains Mono, monospace" font-size="8" font-weight="700" fill="${C.indigo}" letter-spacing="0.6">MONTH PROJECT</text>`;
  cy += 20;
  const [projSvg] = wrapText("▸  " + card.mini_project, x + 14, cy, 82, 16, "Space Grotesk, sans-serif", 11, C.text, "normal", 2);
  out += projSvg;

  return out;
}

// ── All cards (left column) ───────────────────────────────────────────────────
function renderCards(r: RoadmapJSON): string {
  let out = "";
  let y   = HEADER_H + 12;
  const x = PAD;

  for (const wc of r.week_cards) {
    out += renderWeekCard(wc, x, y);
    y   += weekCardH(wc) + CARD_GAP;
  }
  for (const mc of r.month_cards) {
    out += renderMonthCard(mc, x, y);
    y   += monthCardH(mc) + CARD_GAP;
  }
  return out;
}

// ── Milestone tracker (right column) ─────────────────────────────────────────
function renderMilestoneTracker(tracker: MilestoneMonth[]): string {
  const x = RIGHT_X;
  const w = RIGHT_W;
  let out = "";
  let y   = HEADER_H + 12;

  out += `<text x="${x}" y="${y + 10}" font-family="JetBrains Mono, monospace" font-size="8" font-weight="700" fill="${C.muted2}" letter-spacing="0.8">MILESTONE TRACKER</text>`;
  y += 26;

  for (const entry of tracker) {
    const isM1   = entry.month === 1;
    const accent = isM1 ? C.coral : C.indigo;
    const bgFill = isM1 ? C.peach : "#eef2ff";

    // Month header bar
    out += `<rect x="${x+3}" y="${y+3}" width="${w}" height="24" rx="5" fill="${C.shadow}"/>`;
    out += `<rect x="${x}" y="${y}" width="${w}" height="24" rx="5" fill="${bgFill}" stroke="${C.border}" stroke-width="0.5"/>`;
    out += `<rect x="${x}" y="${y}" width="4" height="24" rx="2" fill="${accent}"/>`;
    out += `<text x="${x+12}" y="${y+16}" font-family="JetBrains Mono, monospace" font-size="9" font-weight="700" fill="${accent}">${esc(entry.label)}</text>`;
    y += 40;

    // Milestone rows — wrapped, no truncation
    for (const ms of entry.milestones.slice(0, 4)) {
      const [msSvg, msH] = wrapText(ms, x + 18, y + 1, MS_CPL, 18, "Space Grotesk, sans-serif", 10, C.text, "normal", 2);
      out += `<rect x="${x+2}" y="${y-6}" width="10" height="10" rx="2" fill="none" stroke="${C.border}" stroke-width="1.5"/>`;
      out += msSvg;
      y += msH + 4;
    }

    y += 14;
  }

  return out;
}

// ── Footer ────────────────────────────────────────────────────────────────────
function renderFooter(r: RoadmapJSON, H: number): string {
  const fH = footerH(r);
  const fy = H - fH;

  const [noteSvg]    = wrapText(r.coaching_note, PAD + 14, fy + 44, NOTE_CPL,    20, "Space Grotesk, sans-serif", 13, C.text,  "normal", 3);
  const noteLines    = wordWrapLines(r.coaching_note, NOTE_CPL, 3).length;
  const summaryY     = fy + 44 + noteLines * 20 + 10;
  const [summarySvg] = wrapText(r.summary,       PAD + 14, summaryY,  SUMMARY_CPL, 18, "Space Grotesk, sans-serif", 11, C.muted, "normal", 2);

  return `
  <rect x="0" y="${fy}" width="${W}" height="${fH}" fill="${C.blush}"/>
  <rect x="0" y="${fy}" width="${W}" height="1.5" fill="${C.border}"/>
  <rect x="0" y="${fy}" width="5" height="${fH}" fill="${C.coral}"/>
  <text x="${PAD + 14}" y="${fy + 24}" font-family="JetBrains Mono, monospace" font-size="8" font-weight="700" fill="${C.coral}" letter-spacing="0.8">COACHING NOTE</text>
  ${noteSvg}
  ${summarySvg}
  <rect x="${W - PAD - 176}" y="${fy + 16}" width="176" height="68" rx="8" fill="${C.peach}" stroke="${C.border}" stroke-width="0.5"/>
  <text x="${W - PAD - 88}" y="${fy + 46}" font-family="JetBrains Mono, monospace" font-size="9" font-weight="700" fill="${C.coral}" text-anchor="middle" letter-spacing="0.4">100X ENGINEERS</text>
  <text x="${W - PAD - 88}" y="${fy + 64}" font-family="Space Grotesk, sans-serif" font-size="10" fill="${C.muted}" text-anchor="middle">100xengineers.com</text>
  <text x="${W / 2}" y="${fy + fH - 8}" font-family="JetBrains Mono, monospace" font-size="8" fill="${C.muted2}" text-anchor="middle">100x Engineers — AI Learning Roadmap</text>`;
}

// ── Main export ───────────────────────────────────────────────────────────────
export function renderRoadmapSVG(r: RoadmapJSON): string {
  const H = computeHeight(r);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>svg { width: 100%; height: auto; display: block; }</style>
  </defs>
  <rect width="${W}" height="${H}" fill="${C.white}"/>
  ${renderHeader(r)}
  ${renderCards(r)}
  ${renderMilestoneTracker(r.milestone_tracker)}
  ${renderFooter(r, H)}
</svg>`;
}
