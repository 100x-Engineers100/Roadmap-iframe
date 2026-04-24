import type { RoadmapJSON } from "./roadmap-schema.ts";

// Brand tokens
const C = {
  coral: "#f96846",
  peach: "#ffeee9",
  blush: "#fff8f6",
  text: "#1a1a1a",
  muted: "#888",
  muted2: "#aaa",
  border: "#e0ddd8",
  surface: "#f5f5f3",
  white: "#ffffff",
};

const W = 1200;
const H = 1800;
const PAD = 32;
const HEADER_H = 130;
const FOOTER_H = 160;
const MAIN_Y = HEADER_H;
const MAIN_H = H - HEADER_H - FOOTER_H;
const LEFT_W = 680;
const RIGHT_X = LEFT_W + 24;
const RIGHT_W = W - RIGHT_X - PAD;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


function renderHeader(r: RoadmapJSON): string {
  const title = esc(r.roadmap_title);
  const outcome = esc(r.target_outcome.slice(0, 100));
  return `
  <rect x="0" y="0" width="${W}" height="${HEADER_H}" fill="${C.white}"/>
  <rect x="0" y="${HEADER_H - 1}" width="${W}" height="1" fill="${C.border}"/>
  <!-- coral accent bar -->
  <rect x="0" y="0" width="6" height="${HEADER_H}" fill="${C.coral}"/>
  <!-- title -->
  <text x="${PAD + 16}" y="52" font-family="Space Grotesk, sans-serif" font-size="22" font-weight="700" fill="${C.text}">${title}</text>
  <!-- outcome -->
  <text x="${PAD + 16}" y="80" font-family="Space Grotesk, sans-serif" font-size="13" fill="${C.muted}">${outcome}</text>
  <!-- brand tag -->
  <text x="${W - PAD}" y="52" font-family="JetBrains Mono, monospace" font-size="10" fill="${C.muted2}" text-anchor="end">Built with 100x Engineers curriculum</text>
  <!-- generated date -->
  <text x="${W - PAD}" y="70" font-family="JetBrains Mono, monospace" font-size="10" fill="${C.muted2}" text-anchor="end">${new Date(r.generated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</text>`;
}

function renderPhaseCards(phases: RoadmapJSON["phases"]): string {
  const count = phases.length;
  const totalH = MAIN_H - PAD;
  const cardH = Math.floor(totalH / count) - 12;
  let out = "";

  phases.forEach((phase, i) => {
    const y = MAIN_Y + PAD / 2 + i * (cardH + 12);
    const x = PAD;
    const w = LEFT_W - PAD;
    const diffColor = phase.difficulty === "beginner" ? "#22c55e" : phase.difficulty === "intermediate" ? C.coral : "#ef4444";

    // Card background
    out += `<rect x="${x}" y="${y}" width="${w}" height="${cardH}" rx="12" fill="${C.peach}" stroke="${C.border}" stroke-width="0.5"/>`;
    // Coral left border
    out += `<rect x="${x}" y="${y}" width="4" height="${cardH}" rx="2" fill="${C.coral}"/>`;

    // Phase number circle
    out += `<circle cx="${x + 28}" cy="${y + 28}" r="16" fill="${C.coral}"/>`;
    out += `<text x="${x + 28}" y="${y + 34}" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="white" text-anchor="middle">${String(phase.number).padStart(2, "0")}</text>`;

    // Phase title
    out += `<text x="${x + 54}" y="${y + 22}" font-family="Space Grotesk, sans-serif" font-size="14" font-weight="700" fill="${C.text}">${esc(phase.title.toUpperCase())}</text>`;

    // Weeks badge
    const badgeTxt = `Wk ${esc(phase.weeks)}`;
    out += `<rect x="${x + w - 80}" y="${y + 10}" width="72" height="22" rx="11" fill="${C.surface}" stroke="${C.border}" stroke-width="0.5"/>`;
    out += `<text x="${x + w - 44}" y="${y + 25}" font-family="JetBrains Mono, monospace" font-size="10" fill="${C.muted}" text-anchor="middle">${badgeTxt}</text>`;

    // Focus line
    out += `<text x="${x + 54}" y="${y + 38}" font-family="Space Grotesk, sans-serif" font-size="12" fill="${C.muted}">${esc(phase.focus.slice(0, 60))}</text>`;

    // Divider
    out += `<line x1="${x + 12}" y1="${y + 50}" x2="${x + w - 12}" y2="${y + 50}" stroke="${C.border}" stroke-width="0.5"/>`;

    // Milestones
    const mMax = Math.min(phase.milestones.length, 3);
    for (let mi = 0; mi < mMax; mi++) {
      const m = phase.milestones[mi];
      const my = y + 64 + mi * 22;
      const dotColor = m.priority === "high" ? C.coral : m.priority === "medium" ? "#f59e0b" : C.muted2;
      out += `<circle cx="${x + 22}" cy="${my}" r="4" fill="${dotColor}"/>`;
      out += `<text x="${x + 36}" y="${my + 4}" font-family="Space Grotesk, sans-serif" font-size="12" fill="${C.text}">${esc(m.title.slice(0, 55))}</text>`;
    }

    // Difficulty badge
    out += `<rect x="${x + 12}" y="${y + cardH - 28}" width="80" height="18" rx="9" fill="${diffColor}22" stroke="${diffColor}" stroke-width="0.5"/>`;
    out += `<text x="${x + 52}" y="${y + cardH - 16}" font-family="JetBrains Mono, monospace" font-size="9" font-weight="700" fill="${diffColor}" text-anchor="middle">${phase.difficulty.toUpperCase()}</text>`;
  });

  return out;
}

function renderSkillTree(skills: RoadmapJSON["skill_tree"]): string {
  const count = Math.min(skills.length, 8);
  const slotH = Math.floor(MAIN_H / count);
  let out = "";

  for (let i = 0; i < count; i++) {
    const sk = skills[i];
    const y = MAIN_Y + i * slotH + 16;
    const x = RIGHT_X;
    const w = RIGHT_W;
    const nodeH = slotH - 20;

    // Card
    out += `<rect x="${x}" y="${y}" width="${w}" height="${nodeH}" rx="8" fill="${C.white}" stroke="${C.border}" stroke-width="0.5"/>`;

    // Skill name
    out += `<text x="${x + 14}" y="${y + 22}" font-family="Space Grotesk, sans-serif" font-size="13" font-weight="600" fill="${C.text}">${esc(sk.name)}</text>`;

    // Category label
    out += `<text x="${x + w - 14}" y="${y + 22}" font-family="JetBrains Mono, monospace" font-size="9" fill="${C.muted2}" text-anchor="end">${esc(sk.category)}</text>`;

    // Progress bar bg
    const barY = y + 32;
    const barW = w - 28;
    out += `<rect x="${x + 14}" y="${barY}" width="${barW}" height="6" rx="3" fill="${C.surface}"/>`;
    const fill = Math.min((sk.target_level / 5) * barW, barW);
    const done = Math.min((sk.current_level / 5) * barW, barW);
    out += `<rect x="${x + 14}" y="${barY}" width="${fill}" height="6" rx="3" fill="${C.border}"/>`;
    out += `<rect x="${x + 14}" y="${barY}" width="${done}" height="6" rx="3" fill="${C.coral}"/>`;

    // Level label
    out += `<text x="${x + 14}" y="${barY + 18}" font-family="JetBrains Mono, monospace" font-size="9" fill="${C.muted}">${sk.current_level} &#8594; ${sk.target_level}</text>`;

    // Arrow to next skill
    if (i < count - 1) {
      const arrowY = y + nodeH + 2;
      const midX = x + w / 2;
      out += `<line x1="${midX}" y1="${arrowY}" x2="${midX}" y2="${arrowY + 14}" stroke="${C.border}" stroke-width="1" marker-end="url(#arrow)"/>`;
    }
  }

  return out;
}

function renderFooter(r: RoadmapJSON): string {
  const fy = H - FOOTER_H;
  const startHere = esc(r.next_7_days[0]?.slice(0, 90) ?? "");
  const coaching = esc(r.coaching_note.slice(0, 110));

  return `
  <rect x="0" y="${fy}" width="${W}" height="${FOOTER_H}" fill="${C.blush}" stroke="${C.border}" stroke-width="0.5"/>
  <rect x="0" y="${fy}" width="6" height="${FOOTER_H}" fill="${C.coral}"/>
  <text x="${PAD + 16}" y="${fy + 32}" font-family="Space Grotesk, sans-serif" font-size="11" font-weight="700" fill="${C.muted2}">START HERE</text>
  <text x="${PAD + 16}" y="${fy + 54}" font-family="Space Grotesk, sans-serif" font-size="14" font-weight="600" fill="${C.text}">${startHere}</text>
  <text x="${PAD + 16}" y="${fy + 80}" font-family="Space Grotesk, sans-serif" font-size="12" fill="${C.muted}">${coaching}</text>
  <text x="${W / 2}" y="${fy + FOOTER_H - 16}" font-family="JetBrains Mono, monospace" font-size="10" fill="${C.muted2}" text-anchor="middle">Built with 100x Engineers curriculum · 100xengineers.com</text>`;
}

export function renderRoadmapSVG(r: RoadmapJSON): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="${C.border}"/></marker></defs>
  <rect width="${W}" height="${H}" fill="${C.white}"/>
  ${renderHeader(r)}
  ${renderPhaseCards(r.phases)}
  ${renderSkillTree(r.skill_tree)}
  ${renderFooter(r)}
</svg>`;
}
