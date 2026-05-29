// Pre-processed CSS for offline HTML export.
// Source: components/roadmap/RoadmapView.module.css
// Transforms applied: :global() wrappers stripped, CSS vars resolved in :root, panel transitions added.

export const OFFLINE_CSS = `
:root {
  --color-primary: #ff6343;
  --color-primary-vivid: #ff6343;
  --color-bg: #fbf9f8;
  --color-surface: #ffffff;
  --color-surface-low: #f5f3f3;
  --color-text: #1a1c1c;
  --color-muted: #5a413b;
  --color-border: #e2e2e2;
  --color-border-warm: #e2bfb7;
  --color-coral-soft: #ffdad3;
  --color-coral-wash: #fff3f0;
  --color-coral-shadow: #8d1700;
  --color-dark: #1a1c1c;
  --font-heading: "Space Grotesk", system-ui, -apple-system, sans-serif;
  --font-body: "Space Grotesk", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "Cascadia Code", Menlo, monospace;
  --radius-brand-sm: 4px;
  --radius-brand-md: 6px;
  --radius-brand-lg: 8px;
  --bg-100x-grid:
    radial-gradient(circle at 18% 10%, rgba(255, 99, 67, 0.08), transparent 22%),
    linear-gradient(90deg, rgba(255, 99, 67, 0.045) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255, 99, 67, 0.045) 1px, transparent 1px),
    #fbf9f8;
  --bg-100x-grid-size: auto, 44px 44px, 44px 44px, auto;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

.roadmap-page {
  position: relative;
  min-height: 100vh;
  overflow-x: clip;
  background:
    linear-gradient(135deg, rgba(255, 99, 67, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(26, 28, 28, 0.032) 1px, transparent 1px),
    linear-gradient(0deg, rgba(26, 28, 28, 0.032) 1px, transparent 1px),
    var(--bg-100x-grid);
  background-size: 72px 72px, 36px 36px, 36px 36px, var(--bg-100x-grid-size);
  color: var(--color-text);
}

.roadmap-page::before,
.roadmap-page::after {
  content: '';
  position: fixed;
  z-index: 0;
  pointer-events: none;
}

.roadmap-page::before {
  inset: 68px 0 0;
  background:
    repeating-linear-gradient(90deg, transparent 0 138px, rgba(255, 99, 67, 0.05) 138px 139px, transparent 139px 276px),
    repeating-linear-gradient(0deg, transparent 0 138px, rgba(255, 99, 67, 0.04) 138px 139px, transparent 139px 276px);
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.72), transparent 72%);
}

.roadmap-page::after {
  top: 130px;
  right: -120px;
  width: 480px;
  height: 480px;
  border: 1px solid rgba(226, 191, 183, 0.7);
  background:
    repeating-linear-gradient(135deg, rgba(255, 99, 67, 0.08) 0 1px, transparent 1px 18px),
    rgba(255, 248, 246, 0.54);
  clip-path: polygon(18% 0, 100% 14%, 82% 100%, 0 82%);
}

/* ── Topbar ────────────────────────────────────────────────────────────────── */

.roadmap-topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 28px;
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid rgba(226, 191, 183, 0.65);
  backdrop-filter: blur(12px);
}

.roadmap-title h2 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 21px;
  line-height: 1.15;
}

.roadmap-title p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--color-muted);
}

.roadmap-cta {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(26, 28, 28, 0.9);
  border-radius: 999px;
  padding: 0 10px 0 16px;
  background:
    linear-gradient(135deg, rgba(255, 99, 67, 0.2), transparent 42%),
    var(--color-dark);
  color: #ffffff;
  font-family: var(--font-heading);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 0 0 4px rgba(255, 99, 67, 0.08), 3px 3px 0 rgba(255, 99, 67, 0.24);
  transition: background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.roadmap-cta svg {
  display: grid;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: var(--color-primary-vivid);
  color: #ffffff;
  padding: 7px;
}

.roadmap-cta:hover {
  background:
    linear-gradient(135deg, rgba(255, 99, 67, 0.28), transparent 42%),
    #101111;
  box-shadow: 0 0 0 5px rgba(255, 99, 67, 0.1), 4px 4px 0 rgba(255, 99, 67, 0.3);
  transform: translateY(-1px);
}

/* ── Shell ─────────────────────────────────────────────────────────────────── */

.roadmap-shell {
  position: relative;
  z-index: 1;
  max-width: 1180px;
  margin: 0 auto;
  padding: 42px 24px 120px;
}

.roadmap-heading {
  text-align: center;
  margin-bottom: 18px;
}

.roadmap-heading span {
  display: inline-flex;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  padding: 8px 22px;
  color: var(--color-muted);
  font-family: var(--font-heading);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.roadmap-heading h1 {
  margin: 18px auto 0;
  max-width: 860px;
  font-family: var(--font-heading);
  font-size: clamp(40px, 5.2vw, 62px);
  letter-spacing: -0.015em;
  line-height: 0.98;
}

.roadmap-heading strong {
  color: var(--color-primary-vivid);
}

.roadmap-utility-row {
  display: flex;
  max-width: 1080px;
  justify-content: flex-start;
  margin: 14px auto 6px;
}

/* ── Glossary trigger ──────────────────────────────────────────────────────── */

.glossary-trigger {
  display: inline-grid;
  position: relative;
  min-height: 46px;
  grid-template-columns: 15px auto auto;
  align-items: center;
  gap: 9px;
  overflow: hidden;
  border: 1px solid rgba(255, 99, 67, 0.22);
  border-radius: 999px;
  background:
    linear-gradient(135deg, rgba(255, 218, 211, 0.86), rgba(255, 255, 255, 0.9) 58%),
    #ffffff;
  box-shadow: 3px 3px 0 rgba(226, 191, 183, 0.44), 0 10px 20px rgba(26, 28, 28, 0.04);
  color: var(--color-text);
  cursor: pointer;
  font-family: var(--font-mono);
  padding: 0 14px 0 15px;
  transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.glossary-trigger::before {
  content: '';
  position: absolute;
  right: -28px;
  bottom: -30px;
  width: 94px;
  height: 62px;
  border: 1px solid rgba(255, 99, 67, 0.34);
  border-radius: 999px 999px 0 999px;
  transform: rotate(-12deg);
}

.glossary-trigger svg {
  position: relative;
  color: var(--color-primary);
}

.glossary-trigger span {
  position: relative;
  font-family: var(--font-heading);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.glossary-trigger small {
  position: relative;
  border-left: 1px solid rgba(226, 191, 183, 0.9);
  color: var(--color-muted);
  font-size: 10px;
  line-height: 1;
  padding-left: 8px;
}

.glossary-trigger:hover {
  border-color: rgba(255, 99, 67, 0.34);
  background: #ffffff;
  box-shadow: 4px 4px 0 rgba(255, 99, 67, 0.22), 0 14px 24px rgba(26, 28, 28, 0.06);
  transform: translateY(-1px);
}

/* ── Canvas ────────────────────────────────────────────────────────────────── */

.roadmap-canvas {
  position: relative;
  max-width: 1080px;
  margin: 0 auto;
  isolation: isolate;
}

.roadmap-path {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.roadmap-path-band-shadow,
.roadmap-path-band,
.roadmap-path-stroke {
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.roadmap-path-band-shadow {
  stroke: rgba(255, 99, 67, 0.08);
  stroke-width: 50;
  filter: blur(2px);
}

.roadmap-path-band {
  stroke: rgba(255, 255, 255, 0.78);
  stroke-width: 40;
}

.roadmap-path-stroke {
  stroke: rgba(26, 28, 28, 0.42);
  stroke-width: 2;
  stroke-dasharray: 12 14;
}

/* ── Node ──────────────────────────────────────────────────────────────────── */

.roadmap-node {
  position: absolute;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  animation: roadmapNodeIn 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--node-index, 0) * 45ms);
}

.roadmap-leader {
  position: absolute;
  z-index: 2;
  background: var(--color-primary-vivid);
  opacity: 0.95;
  pointer-events: none;
}

.roadmap-leader-right {
  width: var(--roadmap-leader-length, 48px);
  height: 3px;
}

.roadmap-leader-left {
  width: var(--roadmap-leader-length, 48px);
  height: 3px;
  transform: translateX(calc(var(--roadmap-leader-length, 48px) * -1));
}

.roadmap-leader-top {
  width: 3px;
  height: var(--roadmap-leader-vertical, 32px);
  transform: translateY(calc(var(--roadmap-leader-vertical, 32px) * -1));
}

.roadmap-leader-bottom {
  width: 3px;
  height: var(--roadmap-leader-vertical, 32px);
}

.roadmap-dot {
  position: absolute;
  z-index: 3;
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: 4px solid #fff8f6;
  background: var(--color-primary-vivid);
  box-shadow:
    0 0 0 18px rgba(255, 99, 67, 0.12),
    0 7px 18px rgba(255, 99, 67, 0.22),
    inset 0 -3px 0 rgba(97, 12, 0, 0.16);
  color: #ffffff;
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0;
  font-variant-numeric: tabular-nums;
  transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
}

.roadmap-dot-active {
  transform: scale(1.12);
  box-shadow:
    0 0 0 21px rgba(255, 99, 67, 0.19),
    0 10px 26px rgba(255, 99, 67, 0.3),
    inset 0 -3px 0 rgba(97, 12, 0, 0.18);
}

.roadmap-dot-project {
  border-radius: 14px;
  border-color: #fff8f6;
  background:
    linear-gradient(135deg, var(--color-primary-vivid), var(--color-primary));
  box-shadow:
    0 0 0 9px rgba(26, 28, 28, 0.06),
    0 0 0 19px rgba(255, 99, 67, 0.14),
    0 9px 18px rgba(255, 99, 67, 0.24),
    inset 0 -3px 0 rgba(97, 12, 0, 0.2);
}

.roadmap-dot-project svg { color: #ffffff; }

.roadmap-dot-project.roadmap-dot-active {
  box-shadow:
    0 0 0 10px rgba(26, 28, 28, 0.07),
    0 0 0 24px rgba(255, 99, 67, 0.18),
    0 12px 24px rgba(255, 99, 67, 0.3),
    inset 0 -3px 0 rgba(97, 12, 0, 0.22);
}

/* ── Tile ──────────────────────────────────────────────────────────────────── */

.roadmap-tile {
  position: absolute;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 44px;
  width: 214px;
  min-height: 64px;
  overflow: hidden;
  border: 1px solid rgba(226, 191, 183, 0.72);
  border-radius: var(--radius-brand-md);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(245, 243, 243, 0.94)),
    #ffffff;
  box-shadow: 3px 3px 0 rgba(226, 191, 183, 0.45), 0 10px 20px rgba(26, 28, 28, 0.05);
  transition: border-color 180ms ease, transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

.roadmap-node:hover .roadmap-tile,
.roadmap-tile-active {
  border-color: rgba(255, 99, 67, 0.35);
  background: #ffffff;
  box-shadow: 4px 4px 0 rgba(255, 99, 67, 0.22), 0 14px 24px rgba(26, 28, 28, 0.08);
  transform: translateY(-2px);
}

.roadmap-node-project .roadmap-leader {
  background: var(--color-primary);
  opacity: 0.88;
}

.roadmap-tile-project {
  grid-template-columns: minmax(0, 1fr) 52px;
  border-color: rgba(26, 28, 28, 0.18);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 243, 240, 0.94)),
    #ffffff;
  box-shadow: 3px 3px 0 rgba(26, 28, 28, 0.14), 0 10px 20px rgba(26, 28, 28, 0.06);
}

.roadmap-tile-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  padding: 10px 11px;
}

.roadmap-tile-copy strong {
  font-family: var(--font-heading);
  font-size: 12.5px;
  line-height: 1.2;
  color: var(--color-text);
}

.roadmap-tile-copy small {
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-muted);
  font-size: 10.5px;
  line-height: 1.2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.roadmap-tile-date {
  display: grid;
  place-items: center;
  border-left: 1px solid rgba(226, 191, 183, 0.8);
  background: rgba(255, 218, 211, 0.34);
  color: var(--color-text);
  font-family: var(--font-mono);
  text-align: center;
}

.roadmap-tile-project .roadmap-tile-date {
  border-left-color: rgba(26, 28, 28, 0.16);
  background:
    linear-gradient(135deg, rgba(26, 28, 28, 0.06) 25%, transparent 25%, transparent 50%, rgba(26, 28, 28, 0.06) 50%, rgba(26, 28, 28, 0.06) 75%, transparent 75%),
    #ffdad3;
  background-size: 8px 8px;
}

.roadmap-tile-project-icon svg {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background:
    linear-gradient(135deg, var(--color-primary-vivid), var(--color-primary));
  color: #ffffff;
  padding: 7px;
  box-shadow: 0 0 0 5px rgba(255, 99, 67, 0.12);
}

.roadmap-tile-date strong {
  font-size: 18px;
  line-height: 1;
}

/* ── Panels ────────────────────────────────────────────────────────────────── */

.roadmap-backdrop {
  position: fixed;
  inset: 68px 0 0;
  z-index: 50;
  background: rgba(26, 28, 28, 0.18);
  backdrop-filter: blur(3px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease;
}

.roadmap-backdrop.panel-open {
  opacity: 1;
  pointer-events: auto;
}

.roadmap-panel {
  position: fixed;
  top: 68px;
  right: 0;
  bottom: 0;
  z-index: 60;
  width: min(680px, 56vw);
  overflow-y: auto;
  border-left: 1px solid var(--color-border-warm);
  background:
    radial-gradient(circle at 90% 4%, rgba(255, 99, 67, 0.09), transparent 28%),
    linear-gradient(90deg, rgba(255, 99, 67, 0.035) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255, 99, 67, 0.035) 1px, transparent 1px),
    #ffffff;
  background-size: auto, 34px 34px, 34px 34px, auto;
  box-shadow: -22px 0 46px rgba(26, 28, 28, 0.13);
  padding: 28px 30px 46px;
  transform: translateX(100%);
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.roadmap-panel.panel-open {
  transform: translateX(0);
}

.glossary-backdrop {
  position: fixed;
  inset: 68px 0 0;
  z-index: 52;
  background: rgba(26, 28, 28, 0.16);
  backdrop-filter: blur(3px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.16s ease;
}

.glossary-backdrop.panel-open {
  opacity: 1;
  pointer-events: auto;
}

.glossary-panel {
  position: fixed;
  top: 68px;
  right: 0;
  bottom: 0;
  z-index: 62;
  width: min(560px, 44vw);
  overflow-y: auto;
  border-left: 1px solid var(--color-border-warm);
  background:
    linear-gradient(90deg, rgba(255, 99, 67, 0.035) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255, 99, 67, 0.035) 1px, transparent 1px),
    #ffffff;
  background-size: 34px 34px, 34px 34px, auto;
  box-shadow: -18px 0 40px rgba(26, 28, 28, 0.12);
  padding: 28px 28px 44px;
  transform: translateX(100%);
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.glossary-panel.panel-open {
  transform: translateX(0);
}

.panel-close {
  position: sticky;
  top: 0;
  margin-left: auto;
  z-index: 2;
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: var(--color-surface-low);
  color: var(--color-muted);
  cursor: pointer;
}

/* ── Panel body ────────────────────────────────────────────────────────────── */

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-kicker,
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8e706a;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.panel-body h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 28px;
  line-height: 1.08;
}

.depth-pill {
  width: fit-content;
  border-radius: 999px;
  padding: 5px 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.panel-lede,
.panel-section p,
.checkpoint-box p {
  margin: 0;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.62;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel-explanation {
  border: 1px solid rgba(226, 191, 183, 0.75);
  border-radius: var(--radius-brand-lg);
  background: rgba(255, 255, 255, 0.86);
  padding: 18px;
}

.panel-outcome {
  border-left: 3px solid var(--color-primary-vivid);
  background: var(--color-coral-wash);
  padding: 12px 14px;
}

.panel-outcome span {
  display: block;
  margin-bottom: 5px;
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* ── Node map (expansion) ──────────────────────────────────────────────────── */

.node-map {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  border: 1px solid rgba(226, 191, 183, 0.82);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 248, 246, 0.88)),
    #fff8f6;
  box-shadow: 5px 5px 0 rgba(226, 191, 183, 0.42);
  padding: 18px 20px 20px;
  overflow: hidden;
}

.node-map::before {
  content: '';
  position: absolute;
  inset: -60px auto auto 50%;
  width: 220px;
  height: 220px;
  border-radius: 999px;
  background: rgba(255, 99, 67, 0.08);
  transform: translateX(-50%);
}

.node-map-titlebar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px dashed rgba(226, 191, 183, 0.9);
  padding-bottom: 10px;
}

.node-map-titlebar span {
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.node-map-titlebar strong {
  min-width: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 13px;
  line-height: 1.2;
  text-align: right;
  text-wrap: balance;
}

.node-map-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(148px, 1fr) 78px 122px 78px minmax(148px, 1fr);
  grid-template-rows: auto auto;
  column-gap: 0;
  row-gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 236px;
  max-width: 574px;
  margin: 0 auto;
}

.node-map-column {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 236px;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
}

.node-map-cluster-label {
  display: block;
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.node-map-cluster-label-left { grid-column: 1; grid-row: 1; text-align: right; }
.node-map-cluster-label-right { grid-column: 5; grid-row: 1; text-align: left; }
.node-map-column-left { grid-column: 1; grid-row: 2; text-align: right; }
.node-map-column-right { grid-column: 5; grid-row: 2; text-align: left; }

.node-map-pills {
  position: relative;
  display: flex;
  min-height: var(--node-map-stack-height, 202px);
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.node-map-pill-slot {
  position: relative;
  display: flex;
  min-width: 0;
  height: 34px;
  align-items: center;
}

.node-map-column-left .node-map-pill-slot { justify-content: flex-end; }
.node-map-column-right .node-map-pill-slot { justify-content: flex-start; }

.node-map-pill {
  position: relative;
  z-index: 1;
  display: inline-flex;
  width: min(100%, 156px);
  min-height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-brand-md);
  padding: 7px 10px;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.15;
  text-wrap: balance;
}

.node-map-pill-left {
  border: 1.5px solid var(--color-border-warm);
  background: #ffffff;
  box-shadow: 2px 2px 0 #f0e0dc;
  color: #3e0500;
  text-align: right;
}

.node-map-pill-right {
  border: 1.5px solid #d6d4d4;
  background: #ffffff;
  box-shadow: 2px 2px 0 #ebebeb;
  color: var(--color-text);
}

.node-map-branch {
  position: relative;
  z-index: 0;
  display: flex;
  min-height: var(--node-map-stack-height, 202px);
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.node-map-branch::before {
  content: '';
  position: absolute;
  top: 17px;
  bottom: 17px;
  width: 2.5px;
  border-radius: 999px;
  pointer-events: none;
}

.node-map-branch::after {
  content: '';
  position: absolute;
  top: 50%;
  height: 2px;
  pointer-events: none;
  transform: translateY(-50%);
}

.node-map-branch-left { grid-column: 2; grid-row: 2; }
.node-map-branch-left::before { left: 24px; background: #d69b91; }
.node-map-branch-left::after { left: 24px; right: 0; background: #d69b91; }
.node-map-branch-right { grid-column: 4; grid-row: 2; }
.node-map-branch-right::before { right: 24px; background: #d3cfcd; }
.node-map-branch-right::after { left: 0; right: 24px; background: #d3cfcd; }

.node-map-branch-row {
  position: relative;
  display: block;
  height: 34px;
}

.node-map-branch-row::before {
  content: '';
  position: absolute;
  top: 50%;
  width: 24px;
  height: 2px;
  border-radius: 999px;
  pointer-events: none;
  transform: translateY(-50%);
}

.node-map-branch-left .node-map-branch-row::before { left: 0; background: #d69b91; }
.node-map-branch-right .node-map-branch-row::before { right: 0; background: #d3cfcd; }

.node-map-center {
  position: relative;
  z-index: 2;
  display: flex;
  grid-column: 3;
  grid-row: 1 / span 2;
  align-items: center;
  justify-content: center;
  min-height: 236px;
}

.node-map-center::before,
.node-map-center::after {
  content: '';
  position: absolute;
  top: 50%;
  z-index: 0;
  height: 2px;
  pointer-events: none;
  transform: translateY(-50%);
}

.node-map-center::before { left: 0; width: 16px; background: #d69b91; }
.node-map-center::after { right: 0; width: 16px; background: #d3cfcd; }

.node-map-line {
  position: absolute;
  top: 0; bottom: 0; left: 50%;
  width: 2px;
  background: repeating-linear-gradient(to bottom, var(--color-border-warm) 0 7px, transparent 7px 13px);
  transform: translateX(-50%);
}

.node-map-badge {
  position: relative;
  z-index: 1;
  display: flex;
  width: 122px;
  min-height: 66px;
  flex-direction: column;
  justify-content: center;
  border-radius: 10px;
  background: var(--color-primary);
  box-shadow: 3px 3px 0 #8d1700;
  color: #ffffff;
  padding: 11px 10px;
  text-align: center;
}

.node-map-badge strong {
  font-size: 12px;
  line-height: 1.12;
  text-wrap: balance;
}

/* ── Subtopic detail (atoms) ───────────────────────────────────────────────── */

.subtopic-details {
  border: 1px solid rgba(226, 191, 183, 0.75);
  border-radius: var(--radius-brand-lg);
  background: rgba(255, 255, 255, 0.82);
  padding: 16px;
}

.subtopic-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.subtopic-detail-card {
  display: flex;
  min-width: 0;
  overflow: hidden;
  flex-direction: column;
  gap: 6px;
  border: 1px solid rgba(226, 191, 183, 0.7);
  border-radius: var(--radius-brand-md);
  background: #fff8f6;
  box-shadow: 2px 2px 0 rgba(226, 191, 183, 0.32);
  padding: 11px;
}

.subtopic-detail-card h4 {
  margin: 0;
  color: var(--color-text);
  font-size: 12px;
  line-height: 1.2;
}

.subtopic-detail-card p {
  margin: 0;
  color: var(--color-muted);
  font-size: 11px;
  line-height: 1.35;
  overflow-wrap: break-word;
  word-break: break-word;
}

.subtopic-detail-card > span {
  margin-top: auto;
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.3;
  text-transform: uppercase;
}

/* ── Explanation text ──────────────────────────────────────────────────────── */

.explanation-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.explanation-opener {
  margin: 0;
  color: var(--color-muted);
  font-size: 11px;
  line-height: 1.35;
  overflow-wrap: break-word;
  word-break: break-word;
}

.explanation-bullets {
  margin: 0;
  padding-left: 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  list-style: disc;
}

.explanation-bullets li {
  color: var(--color-muted);
  font-size: 11px;
  line-height: 1.35;
  padding-left: 2px;
  overflow-wrap: break-word;
  word-break: break-word;
}

.explanation-twist {
  margin: 2px 0 0;
  color: var(--color-text);
  font-size: 10.5px;
  line-height: 1.35;
  border-left: 2px solid var(--color-primary);
  padding-left: 7px;
  overflow-wrap: break-word;
  word-break: break-word;
}

/* ── Tool pills ────────────────────────────────────────────────────────────── */

.subnode-meta { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
.tool-pills { display: flex; flex-wrap: wrap; gap: 4px; }

.tool-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(255, 99, 67, 0.07);
  border: 1px solid rgba(255, 99, 67, 0.18);
  color: #ff6343;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.03em;
}

/* ── Analogy + checkpoint boxes ────────────────────────────────────────────── */

.analogy-box,
.checkpoint-box {
  border: 1px solid var(--color-border-warm);
  border-radius: var(--radius-brand-lg);
  background: rgba(255, 248, 246, 0.94);
  padding: 15px;
}

.analogy-box { display: flex; flex-direction: column; gap: 9px; }

.checkpoint-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-left: 4px solid var(--color-primary-vivid);
}

.checkpoint-box h4,
.subnode-card h4 {
  margin: 0 0 6px;
  font-family: var(--font-heading);
  font-size: 14px;
  line-height: 1.3;
}

.checkpoint-box ul {
  margin: 0;
  padding-left: 18px;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.55;
}

/* ── Glossary ──────────────────────────────────────────────────────────────── */

.glossary-body { display: flex; flex-direction: column; gap: 18px; }

.glossary-heading {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-bottom: 1px dashed rgba(226, 191, 183, 0.9);
  padding-bottom: 16px;
}

.glossary-heading span {
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.glossary-heading h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 28px;
  line-height: 1.08;
}

.glossary-heading p {
  margin: 0;
  max-width: 440px;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.5;
}

.glossary-list { display: grid; gap: 10px; }

.glossary-term {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 14px;
  border: 1px solid rgba(226, 191, 183, 0.72);
  border-radius: var(--radius-brand-md);
  background: rgba(255, 248, 246, 0.82);
  box-shadow: 2px 2px 0 rgba(226, 191, 183, 0.34);
  padding: 12px;
}

.glossary-term h4 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 13px;
  line-height: 1.18;
}

.glossary-term > div > span {
  display: block;
  margin-top: 5px;
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: 8.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1.25;
  text-transform: uppercase;
}

.glossary-term p {
  margin: 0;
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.45;
}

.glossary-def-list {
  list-style: none;
  margin: 0; padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.glossary-def-list li {
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.45;
  padding-left: 14px;
  position: relative;
}

.glossary-def-list li::before {
  content: '\\2014';
  position: absolute;
  left: 0;
  color: var(--color-primary);
  font-size: 10px;
  line-height: 1.45;
}

/* ── Checkpoint strip ──────────────────────────────────────────────────────── */

.checkpoint-strip {
  max-width: 1080px;
  margin: 12px auto 18px;
  border: 1px solid rgba(226, 191, 183, 0.78);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 4px 4px 0 rgba(226, 191, 183, 0.32);
  padding: 14px;
}

.primer-strip-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px dashed rgba(226, 191, 183, 0.9);
  padding-bottom: 8px;
}

.primer-strip-head span {
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.primer-strip-head strong {
  font-family: var(--font-heading);
  font-size: 13px;
  color: var(--color-text);
}

.checkpoint-strip-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.checkpoint-card { border-radius: 10px; overflow: hidden; }

.checkpoint-card-mini {
  border: 1.5px solid rgba(226, 191, 183, 0.85);
  background: #fff8f6;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkpoint-card-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--color-primary);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  width: fit-content;
}

.checkpoint-card-tag-capstone { background: #1a1c1c; }

.checkpoint-card-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.checkpoint-card-goal {
  margin: 0;
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.45;
}

.checkpoint-card-tools { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }

.checkpoint-card-capstone {
  border: 1.5px solid rgba(26, 28, 28, 0.2);
  background: #1a1c1c;
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.checkpoint-capstone-header {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.checkpoint-card-capstone .checkpoint-card-title { color: #ffffff; font-size: 16px; }
.checkpoint-card-capstone .checkpoint-card-goal { color: rgba(255, 255, 255, 0.6); }

.checkpoint-capstone-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkpoint-capstone-criteria span {
  display: block;
  font-family: var(--font-mono);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 6px;
}

.checkpoint-capstone-criteria ul {
  margin: 0; padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.checkpoint-capstone-criteria li {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.4;
  padding-left: 14px;
  position: relative;
}

.checkpoint-capstone-criteria li::before {
  content: '';
  position: absolute;
  left: 0; top: 7px;
  width: 5px; height: 5px;
  border-radius: 999px;
  background: var(--color-primary);
}

.checkpoint-card-capstone .checkpoint-card-tools { margin-top: auto; }
.checkpoint-card-capstone .tool-pill {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
}

.checkpoint-card[data-clickable] {
  cursor: pointer;
  transition: box-shadow 160ms ease, transform 160ms ease;
}

.checkpoint-card[data-clickable]:hover {
  box-shadow: 0 4px 18px rgba(255, 99, 67, 0.18);
  transform: translateY(-2px);
}

/* ── Project side panel ────────────────────────────────────────────────────── */

.project-tasks-section {
  background: rgba(255, 248, 246, 0.8);
  border: 1px solid rgba(255, 99, 67, 0.28);
  border-radius: var(--radius-brand-lg);
  padding: 18px;
  gap: 16px;
}

.project-tasks-list {
  list-style: none;
  margin: 0; padding: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.project-task-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  line-height: 1.65;
  color: var(--color-text);
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.project-task-item:last-child { border-bottom: none; padding-bottom: 0; }

.project-task-num {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 24px; height: 24px;
  border-radius: 999px;
  background: var(--color-primary);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  margin-top: 1px;
}

.task-body { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; }

.task-desc {
  font-size: 14px;
  line-height: 1.55;
  color: var(--color-text);
  overflow-wrap: break-word;
  word-break: break-word;
}

.task-filename { font-style: italic; color: var(--color-primary); font-weight: 500; }

.task-inline-code {
  font-family: var(--font-mono);
  font-size: 12px;
  background: rgba(255, 99, 67, 0.08);
  color: var(--color-primary);
  border-radius: 3px;
  padding: 1px 4px;
  overflow-wrap: break-word;
  word-break: break-all;
}

.task-verify-block {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: rgba(0, 0, 0, 0.04);
  border-left: 2px solid var(--color-primary);
  border-radius: 0 4px 4px 0;
  padding: 5px 8px;
  margin-top: 2px;
}

.task-verify-label {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-primary);
  margin-top: 2px;
}

.task-run-block { border-left-color: #6366f1; }
.task-run-block .task-verify-label { color: #6366f1; }

.task-verify-code {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.5;
  color: var(--color-text);
  overflow-wrap: break-word;
  word-break: break-all;
}

.core-filename {
  font-family: var(--font-mono);
  font-size: 12px;
  background: rgba(255, 99, 67, 0.08);
  color: var(--color-primary);
  border-radius: 3px;
  padding: 0 3px;
}

.project-bullet-list {
  list-style: none;
  margin: 0; padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--color-muted);
}

.project-bullet-list li { padding-left: 16px; position: relative; }
.project-bullet-list li::before {
  content: '\\2014';
  position: absolute;
  left: 0;
  color: var(--color-primary);
  font-size: 12px;
  line-height: 1.55;
}

.project-spec-list {
  list-style: none;
  margin: 0; padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-muted);
}

.project-spec-list li { padding-left: 16px; position: relative; font-family: var(--font-mono); }
.project-spec-list li::before {
  content: '\\2192';
  position: absolute;
  left: 0;
  color: var(--color-primary);
}

.project-criteria-list {
  list-style: none;
  margin: 0; padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.project-criteria-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--color-muted);
}

.project-criteria-check { flex-shrink: 0; color: var(--color-primary); font-weight: 700; font-size: 13px; margin-top: 2px; }

/* ── Finish stamp ──────────────────────────────────────────────────────────── */

.roadmap-finish-stamp {
  position: absolute;
  z-index: 7;
  display: inline-flex;
  min-width: 166px;
  min-height: 42px;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 99, 67, 0.52);
  border-radius: 999px;
  background:
    radial-gradient(circle at 18% 20%, rgba(255, 255, 255, 0.96) 0 12px, transparent 13px),
    linear-gradient(135deg, rgba(255, 99, 67, 0.2), rgba(255, 248, 246, 0.96) 46%),
    #fff8f6;
  box-shadow:
    0 0 0 7px rgba(255, 99, 67, 0.08),
    5px 5px 0 rgba(255, 99, 67, 0.18),
    0 16px 28px rgba(26, 28, 28, 0.08);
  color: var(--color-text);
  font-family: var(--font-heading);
  font-weight: 900;
  padding: 7px 12px 7px 7px;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.roadmap-finish-stamp::before,
.roadmap-finish-stamp::after {
  content: '';
  position: absolute;
  z-index: -1;
  width: 22px; height: 28px;
  border-radius: 5px;
  background: linear-gradient(180deg, #ff6343, #c94025);
  bottom: -11px;
}

.roadmap-finish-stamp::before { left: 28px; transform: rotate(16deg); }
.roadmap-finish-stamp::after {
  left: 48px;
  background: linear-gradient(180deg, #1a1c1c, #3a2824);
  transform: rotate(-12deg);
}

.roadmap-finish-confetti {
  position: absolute;
  inset: -13px -8px auto auto;
  width: 42px; height: 30px;
  pointer-events: none;
}

.roadmap-finish-confetti::before,
.roadmap-finish-confetti::after,
.roadmap-finish-confetti span {
  content: '';
  position: absolute;
  width: 7px; height: 13px;
  border-radius: 3px;
  background: var(--color-primary-vivid);
  transform: rotate(18deg);
}

.roadmap-finish-confetti::before { top: 17px; right: 2px; }
.roadmap-finish-confetti::after {
  top: 1px; right: 20px;
  width: 6px; height: 6px;
  border-radius: 999px;
  background: #1a1c1c;
}

.roadmap-finish-confetti span:nth-child(1) { top: 8px; right: 38px; height: 10px; background: #ffb29f; transform: rotate(-24deg); }
.roadmap-finish-confetti span:nth-child(2) { top: 24px; right: 27px; width: 8px; height: 8px; border-radius: 999px; background: #ff6343; }
.roadmap-finish-confetti span:nth-child(3) { top: 2px; right: 3px; height: 11px; background: #ffd9d0; transform: rotate(42deg); }

.roadmap-finish-medal {
  display: grid;
  width: 30px; height: 30px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 999px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent 42%),
    var(--color-primary-vivid);
  box-shadow:
    inset 0 -3px 0 rgba(97, 12, 0, 0.18),
    0 0 0 5px rgba(255, 99, 67, 0.12);
  color: #ffffff;
}

.roadmap-finish-copy { display: flex; min-width: 0; flex-direction: column; justify-content: center; }
.roadmap-finish-copy strong { color: var(--color-text); font-size: 11.5px; line-height: 1.05; }
.roadmap-finish-copy em { color: var(--color-primary-vivid); font-style: normal; }
.roadmap-finish-copy small {
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
}

/* ── Project spine icon ────────────────────────────────────────────────────── */

.project-spine-icon {
  position: absolute;
  width: 38px; height: 38px;
  border: 2px solid #fff8f6;
  border-radius: 12px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.24), transparent 42%),
    repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0 2px, transparent 2px 7px),
    var(--color-primary);
  color: #fff;
  display: grid;
  place-items: center;
  z-index: 5;
  transform: translate(-50%, -50%) rotate(-4deg);
  box-shadow:
    0 0 0 7px rgba(255, 99, 67, 0.12),
    0 8px 18px rgba(255, 99, 67, 0.26),
    inset 0 -3px 0 rgba(97, 12, 0, 0.16);
  pointer-events: none;
}

.project-spine-icon::before {
  content: '';
  position: absolute;
  inset: -7px;
  border: 1px dashed rgba(255, 99, 67, 0.42);
  border-radius: 16px;
}

.project-spine-icon::after {
  content: 'BUILD';
  position: absolute;
  top: -22px; left: 50%;
  border: 1px solid rgba(255, 99, 67, 0.24);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 2px 2px 0 rgba(226, 191, 183, 0.42);
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: 7px;
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: 1;
  padding: 4px 6px;
  transform: translateX(-50%);
}

.project-spine-icon svg { width: 17px; height: 17px; filter: drop-shadow(0 1px 0 rgba(97, 12, 0, 0.2)); }

/* ── Animations ────────────────────────────────────────────────────────────── */

@keyframes roadmapNodeIn {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .roadmap-dot, .roadmap-tile, .roadmap-node, .roadmap-path-stroke {
    transition: none;
    animation: none;
  }
}
`;
