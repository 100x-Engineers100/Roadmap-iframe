// Node.js-compatible copy of supabase/functions/_shared/html-renderer.ts
// Types inlined — no Deno imports. Used by roadmap-preview page for dev/agentation workflow.

export interface SubBranch {
  title: string;
  topics: string[];
}

export interface Cluster {
  label: string;
  topics: string[];
}

export interface SpineNode {
  order: number;
  title: string;
  left_cluster: Cluster;
  right_cluster: Cluster;
  sub_branches?: SubBranch[];
  checkpoint: string;
}

export interface UserProfile {
  name: string;
  goal: string;
  background_role: string;
  experience_years: string;
  weak_areas: string[];
  hours_per_week: string;
  learning_style: string;
  timeframe_months: number;
}

export interface RoadmapJSON {
  version: string;
  roadmap_title: string;
  generated_at: string;
  user_profile: UserProfile;
  summary: string;
  target_outcome: string;
  spine_nodes: SpineNode[];
  coaching_note: string;
  reminder_emails?: unknown;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPill(text: string, variant: "left" | "right" | "sub"): string {
  return `<div class="pill pill-${variant}">${esc(text)}</div>`;
}

function renderCluster(label: string, topics: string[], side: "left" | "right"): string {
  const pills = topics.map((t) => renderPill(t, side)).join("\n        ");
  return `<div class="cluster cluster-${side}">
        ${pills}
      </div>`;
}

function renderSubBranch(sb: SubBranch): string {
  const pills = sb.topics.map((t) => renderPill(t, "sub")).join("\n            ");
  return `<div class="sub-branch">
          <div class="sub-branch-title">${esc(sb.title)}</div>
          <div class="sub-branch-pills">
            ${pills}
          </div>
        </div>`;
}

function renderSpineNode(node: SpineNode): string {
  const orderStr = String(node.order).padStart(2, "0");
  const leftCluster = renderCluster(node.left_cluster.label, node.left_cluster.topics, "left");
  const rightCluster = renderCluster(node.right_cluster.label, node.right_cluster.topics, "right");

  let subBranchesHtml = "";
  if (node.sub_branches && node.sub_branches.length > 0) {
    const sbs = node.sub_branches.map(renderSubBranch).join("\n        ");
    subBranchesHtml = `
    <div class="sub-branches-row">
      <div class="sub-branch-connector"></div>
      <div class="sub-branches-inner">
        ${sbs}
      </div>
    </div>`;
  }

  return `<div class="spine-section">
    <div class="spine-row">
      ${leftCluster}
      <div class="spine-center">
        <div class="spine-line-segment spine-line-top"></div>
        <div class="spine-node-badge">
          <span class="node-order">NODE ${orderStr}</span>
          <span class="node-title">${esc(node.title)}</span>
        </div>
        <div class="spine-line-segment spine-line-bottom"></div>
      </div>
      ${rightCluster}
    </div>${subBranchesHtml}
    <div class="checkpoint">
      <span class="checkpoint-label">CHECKPOINT</span>
      <span class="checkpoint-text">${esc(node.checkpoint)}</span>
    </div>
  </div>`;
}

function renderHeader(r: RoadmapJSON): string {
  const date = new Date(r.generated_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const weakAreas = r.user_profile.weak_areas.slice(0, 3).join(", ");
  return `<div class="header">
    <div class="header-top">
      <div class="header-left">
        <div class="brand-badge">100X ENGINEERS</div>
        <h1 class="roadmap-title">${esc(r.roadmap_title)}</h1>
        <div class="header-profile">
          <span class="profile-name">${esc(r.user_profile.name)}</span>
          <span class="divider">·</span>
          <span class="profile-goal">${esc(r.user_profile.goal)}</span>
          <span class="divider">·</span>
          <span class="profile-meta">${r.user_profile.timeframe_months}mo · ${esc(r.user_profile.background_role)} · ${esc(r.user_profile.hours_per_week)}/wk</span>
        </div>
        <div class="target-outcome">${esc(r.target_outcome)}</div>
      </div>
      <div class="header-right">
        <div class="header-date">${esc(date)}</div>
        <div class="header-label">AI LEARNING ROADMAP</div>
        ${weakAreas ? `<div class="weak-areas">Focus: ${esc(weakAreas)}</div>` : ""}
      </div>
    </div>
    <div class="header-summary">${esc(r.summary)}</div>
  </div>`;
}

function renderFooter(r: RoadmapJSON): string {
  return `<div class="footer">
    <div class="footer-inner">
      <div class="footer-note-block">
        <div class="footer-label">COACHING NOTE</div>
        <div class="footer-note">${esc(r.coaching_note)}</div>
      </div>
      <div class="footer-brand">
        <div class="footer-brand-name">100xengineers.com</div>
        <div class="footer-brand-sub">AI Learning Roadmap</div>
      </div>
    </div>
  </div>`;
}

const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.roadmap {
  max-width: 980px;
  min-width: 700px;
  margin: 0 auto;
  padding: 0;
  background: #f9f9f9;
  font-family: 'Space Grotesk', sans-serif;
  color: #1a1c1c;
  -webkit-font-smoothing: antialiased;
}

/* ── HEADER ── */
.header {
  background: #ffffff;
  border-left: 5px solid #b22c11;
  border-bottom: 1.5px solid #e2bfb7;
  padding: 24px 32px 20px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 12px;
}

.header-left { flex: 1; }
.header-right { text-align: right; flex-shrink: 0; }

.brand-badge {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  color: #b22c11;
  background: #ffdad3;
  padding: 3px 10px;
  border-radius: 4px;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.roadmap-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1c1c;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin-bottom: 10px;
}

.header-profile {
  font-size: 12px;
  color: #5a413b;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
}

.profile-name { font-weight: 600; }
.divider { color: #e2bfb7; }
.profile-meta { color: #8e706a; }

.target-outcome {
  font-size: 11px;
  font-weight: 500;
  color: #610c00;
  background: #ffdad3;
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
}

.header-date {
  font-size: 10px;
  color: #8e706a;
  margin-bottom: 4px;
}

.header-label {
  font-size: 9px;
  font-weight: 600;
  color: #5a413b;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.weak-areas {
  font-size: 9px;
  color: #8e706a;
}

.header-summary {
  font-size: 12px;
  color: #5a413b;
  line-height: 1.5;
  border-top: 1px solid #f3f3f3;
  padding-top: 10px;
}

/* ── SPINE CONTAINER ── */
.spine-container {
  padding: 0 32px 16px;
}

/* ── SPINE SECTION ── */
.spine-section {
  position: relative;
  margin-bottom: 0;
}

/* ── SPINE ROW (3-col grid) ── */
.spine-row {
  display: grid;
  grid-template-columns: 1fr 172px 1fr;
  min-height: 120px;
  position: relative;
}

/* ── CLUSTERS ── */
.cluster {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 7px;
  padding: 20px 0;
  position: relative;
  z-index: 1;
}

.cluster-left {
  align-items: flex-end;
  padding-right: 16px;
}

.cluster-left::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: calc(100% - 40px);
  width: 1.5px;
  background: #e2bfb7;
}

.cluster-right {
  align-items: flex-start;
  padding-left: 16px;
}

.cluster-right::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: calc(100% - 40px);
  width: 1.5px;
  background: #e2bfb7;
}

/* ── PILLS ── */
.pill {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  display: inline-block;
  position: relative;
  z-index: 1;
}

.pill-left {
  background: #ffffff;
  color: #3e0500;
  border: 1.5px solid #e2bfb7;
  box-shadow: 2px 2px 0 #f0e0dc;
}

.pill-left::after {
  content: '';
  position: absolute;
  right: -16px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 1.5px;
  background: #e2bfb7;
  z-index: 0;
}

.pill-right {
  background: #ffffff;
  color: #1b1b1c;
  border: 1.5px solid #d6d4d4;
  box-shadow: 2px 2px 0 #ebebeb;
}

.pill-right::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 1.5px;
  background: #d6d4d4;
  z-index: 0;
}

.pill-sub {
  background: #eeeeee;
  color: #1a1c1c;
  font-size: 10px;
  padding: 5px 10px;
  border: 1px solid #e2bfb7;
  display: block;
  word-break: break-word;
  white-space: normal;
}

/* ── SPINE CENTER ── */
.spine-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.spine-line-segment {
  flex: 1;
  width: 2px;
  background: repeating-linear-gradient(
    to bottom,
    #e2bfb7 0px,
    #e2bfb7 5px,
    transparent 5px,
    transparent 10px
  );
}

.spine-node-badge {
  background: #b22c11;
  color: #ffffff;
  border-radius: 8px;
  padding: 10px 12px;
  text-align: center;
  width: 160px;
  box-shadow: 3px 3px 0 #8d1700;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.spine-node-badge::before {
  content: '';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 100%;
  width: 6px;
  height: 1.5px;
  background: #e2bfb7;
}

.spine-node-badge::after {
  content: '';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 100%;
  width: 6px;
  height: 1.5px;
  background: #e2bfb7;
}

.node-order {
  display: block;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1.2px;
  opacity: 0.65;
  margin-bottom: 5px;
}

.node-title {
  display: block;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
}

/* ── SUB-BRANCHES ── */
.sub-branches-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 8px;
}

.sub-branch-connector {
  width: 2px;
  height: 20px;
  background: repeating-linear-gradient(
    to bottom,
    #e2bfb7 0px,
    #e2bfb7 5px,
    transparent 5px,
    transparent 10px
  );
}

.sub-branches-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  padding: 0 32px;
}

.sub-branch {
  border: 1px solid #e2bfb7;
  border-radius: 6px;
  background: #ffffff;
  padding: 12px 14px;
  flex: 1;
  min-width: 160px;
  box-shadow: 2px 2px 0 #eeeeee;
}

.sub-branch-title {
  font-size: 9px;
  font-weight: 700;
  color: #5a413b;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e2bfb7;
}

.sub-branch-pills {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* ── CHECKPOINT ── */
.checkpoint {
  margin: 4px 0 8px;
  padding: 9px 16px 9px 14px;
  background: #ffffff;
  border: 1px solid #e2bfb7;
  border-left: 3px solid #b22c11;
  border-radius: 4px;
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.checkpoint-label {
  font-size: 8px;
  font-weight: 700;
  color: #b22c11;
  letter-spacing: 1px;
  white-space: nowrap;
  flex-shrink: 0;
}

.checkpoint-text {
  font-size: 11px;
  color: #5a413b;
  font-style: italic;
  line-height: 1.5;
}

/* ── SECTION DIVIDER ── */
.spine-section + .spine-section {
  border-top: 1px dashed #e2bfb7;
  padding-top: 8px;
}

/* ── FOOTER ── */
.footer {
  background: #ffdad3;
  border-top: 1.5px solid #e2bfb7;
  border-left: 5px solid #b22c11;
  padding: 20px 32px;
  margin-top: 16px;
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.footer-note-block { flex: 1; }

.footer-label {
  font-size: 8px;
  font-weight: 700;
  color: #b22c11;
  letter-spacing: 1.2px;
  margin-bottom: 6px;
}

.footer-note {
  font-size: 13px;
  color: #1a1c1c;
  line-height: 1.55;
}

.footer-brand { text-align: right; flex-shrink: 0; }

.footer-brand-name {
  font-size: 15px;
  font-weight: 700;
  color: #b22c11;
  margin-bottom: 4px;
}

.footer-brand-sub {
  font-size: 10px;
  color: #5a413b;
}
`;

function renderBody(r: RoadmapJSON): string {
  const nodeRows = r.spine_nodes.map(renderSpineNode).join("\n  ");
  return `<div class="roadmap">
  ${renderHeader(r)}
  <div class="spine-container">
    ${nodeRows}
  </div>
  ${renderFooter(r)}
</div>`;
}

export function renderRoadmapFragment(r: RoadmapJSON): string {
  return `<style>${CSS}</style>${renderBody(r)}`;
}

export function renderRoadmapHTML(r: RoadmapJSON): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(r.roadmap_title)} — 100x Engineers</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
${renderBody(r)}
</body>
</html>`;
}
