import type {
  Roadmap,
  RoleCategory,
  JourneyAnalogy,
  ProjectCheckpoint,
  RoadmapGlossaryTerm,
} from '@/types';
import type { RoadmapNodeItem, Point } from '@/lib/roadmap/layoutHelpers';
import {
  getRoadmapItems,
  getGlossaryTerms,
  getDesktopLayout,
  buildRoundedOrthogonalPath,
  getTilePlacement,
  getCanvasHeight,
  ROLE_DISPLAY,
  DEPTH_STYLE,
} from '@/lib/roadmap/layoutHelpers';
import { OFFLINE_CSS } from './offlineStyles';

// ── SVG icon strings ──────────────────────────────────────────────────────────

const SVG_HAMMER = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 5.6a5.009 5.009 0 0 0-6.22.23L6 8h7l2.25 2.25.94.44"/></svg>`;

const SVG_HAMMER_SMALL = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 5.6a5.009 5.009 0 0 0-6.22.23L6 8h7l2.25 2.25.94.44"/></svg>`;

const SVG_PARTY = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2z"/></svg>`;

const SVG_BOOK = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;

const SVG_EXTERNAL = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`;

const SVG_X = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

// ── Security ──────────────────────────────────────────────────────────────────

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Text renderers (mirror React components exactly) ──────────────────────────

function renderExplanationText(text: string): string {
  if (!text?.includes('•')) return `<p>${escapeHtml(text)}</p>`;

  const parts = text.split(/\s*•\s*/);
  const opening = parts[0]?.trim();
  const rest = parts.slice(1);
  const twistIdx = rest.findIndex(p => /^the twist:/i.test(p.trim()));
  const bullets = twistIdx >= 0 ? rest.slice(0, twistIdx) : rest;
  const twist = twistIdx >= 0 ? rest[twistIdx]?.trim() : null;

  const bulletsHtml = bullets.length > 0
    ? `<ul class="explanation-bullets">${bullets.map(b => `<li>${escapeHtml(b.trim())}</li>`).join('')}</ul>`
    : '';
  const twistHtml = twist
    ? `<p class="explanation-twist"><strong>The Twist:</strong> ${escapeHtml(twist.replace(/^the twist:\s*/i, ''))}</p>`
    : '';

  return `<div class="explanation-body">
    ${opening ? `<p class="explanation-opener">${escapeHtml(opening)}</p>` : ''}
    ${bulletsHtml}
    ${twistHtml}
  </div>`;
}

function renderGlossaryDefinition(text: string): string {
  const trimmed = text.trim();
  const isBulletList = /^[-•]\s/.test(trimmed) || /\n\s*[-•]\s/.test(trimmed);
  if (isBulletList) {
    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    return `<ul class="glossary-def-list">${lines.map(line => `<li>${escapeHtml(line.replace(/^[-•]\s+/, ''))}</li>`).join('')}</ul>`;
  }
  return `<p>${escapeHtml(text)}</p>`;
}

const FILE_SPLIT_RE = /(\b[\w-]+\.(?:py|ts|js|json|md|txt|yaml|yml|sh|env)\b)/g;
const FILE_TEST_RE = /^\b[\w-]+\.(?:py|ts|js|json|md|txt|yaml|yml|sh|env)\b$/;

function highlightFilenames(text: string): string {
  const parts = text.split(FILE_SPLIT_RE);
  if (parts.length === 1) return escapeHtml(text);
  return parts
    .map(p => FILE_TEST_RE.test(p) ? `<em class="task-filename">${escapeHtml(p)}</em>` : escapeHtml(p))
    .join('');
}

function renderInlineCode(text: string): string {
  const parts: string[] = [];
  const re = /`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(highlightFilenames(text.slice(last, m.index)));
    parts.push(`<code class="task-inline-code">${escapeHtml(m[1])}</code>`);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(highlightFilenames(text.slice(last)));
  return parts.join('');
}

const SHELL_RE = /^(pip install|pip3 install|npm install|npx |pnpm |yarn |python |python3 |pytest |curl |node |bash |sh |export |mkdir |cd |touch |docker )/i;

function splitTaskParts(task: string): { label: string; cmd: string | null; verify: string | null } {
  const verifyM = task.match(/^([\s\S]+?)\s+—\s+verify(?:\s+with)?:?\s+([\s\S]+)$/i);
  const body = verifyM ? verifyM[1] : task;
  const verify = verifyM ? verifyM[2] : null;

  const colonIdx = body.indexOf(': ');
  if (colonIdx !== -1) {
    const after = body.slice(colonIdx + 2).trim();
    if (SHELL_RE.test(after)) {
      return { label: body.slice(0, colonIdx), cmd: after, verify };
    }
  }
  return { label: body, cmd: null, verify };
}

function renderTaskItem(task: string, index: number): string {
  const { label, cmd, verify } = splitTaskParts(task);
  const cmdBlock = cmd
    ? `<div class="task-verify-block task-run-block"><span class="task-verify-label">run</span><code class="task-verify-code">${escapeHtml(cmd)}</code></div>`
    : '';
  const verifyBlock = verify
    ? `<div class="task-verify-block"><span class="task-verify-label">verify</span><code class="task-verify-code">${escapeHtml(verify)}</code></div>`
    : '';
  return `<li class="project-task-item">
    <span class="project-task-num">${index + 1}</span>
    <div class="task-body">
      <div class="task-desc">${renderInlineCode(label)}</div>
      ${cmdBlock}
      ${verifyBlock}
    </div>
  </li>`;
}

function renderCoreItem(text: string): string {
  const parts = text.split(FILE_SPLIT_RE);
  if (parts.length === 1) return `<li>${escapeHtml(text)}</li>`;
  const inner = parts
    .map(p => FILE_TEST_RE.test(p) ? `<code class="core-filename">${escapeHtml(p)}</code>` : escapeHtml(p))
    .join('');
  return `<li>${inner}</li>`;
}

// ── Component renderers ───────────────────────────────────────────────────────

function renderNodeExpansionMap(item: RoadmapNodeItem): string {
  const leftItems = item.node.panel?.expansion?.left_items ?? [];
  const rightItems = item.node.panel?.expansion?.right_items ?? [];

  const left = leftItems.length > 0
    ? leftItems.map(a => a.label)
    : (item.node.concepts_left?.length ? item.node.concepts_left : item.node.subnodes.slice(0, Math.ceil(item.node.subnodes.length / 2)).map(s => s.title));

  const right = rightItems.length > 0
    ? rightItems.map(a => a.label)
    : (item.node.concepts_right?.length ? item.node.concepts_right : item.node.subnodes.slice(Math.ceil(item.node.subnodes.length / 2)).map(s => s.title));

  const rowCount = Math.max(left.length, right.length, 1);
  const stackHeight = rowCount * 42 - 8;

  const leftPills = left.map(pill => `
    <span class="node-map-pill-slot">
      <span class="node-map-pill node-map-pill-left" title="${escapeHtml(pill)}">${escapeHtml(pill)}</span>
    </span>`).join('');

  const rightPills = right.map(pill => `
    <span class="node-map-pill-slot">
      <span class="node-map-pill node-map-pill-right" title="${escapeHtml(pill)}">${escapeHtml(pill)}</span>
    </span>`).join('');

  const leftBranches = left.map(() => `<span class="node-map-branch-row"></span>`).join('');
  const rightBranches = right.map(() => `<span class="node-map-branch-row"></span>`).join('');

  return `<section class="node-map" aria-label="${escapeHtml(item.node.name_plain)} expanded subtopics">
    <div class="node-map-titlebar">
      <span>Selected node map</span>
      <strong>${escapeHtml(item.node.name_plain)}</strong>
    </div>
    <div class="node-map-grid" style="--node-map-stack-height: ${stackHeight}px">
      <span class="node-map-cluster-label node-map-cluster-label-left">Concepts</span>
      <span class="node-map-cluster-label node-map-cluster-label-right">Applied</span>
      <div class="node-map-column node-map-column-left">
        <div class="node-map-pills">${leftPills}</div>
      </div>
      <div class="node-map-branch node-map-branch-left" aria-hidden="true">${leftBranches}</div>
      <div class="node-map-center">
        <div class="node-map-line" aria-hidden="true"></div>
        <div class="node-map-badge"><strong>${escapeHtml(item.node.name_plain)}</strong></div>
      </div>
      <div class="node-map-branch node-map-branch-right" aria-hidden="true">${rightBranches}</div>
      <div class="node-map-column node-map-column-right">
        <div class="node-map-pills">${rightPills}</div>
      </div>
    </div>
  </section>`;
}

function renderNodePanelContent(item: RoadmapNodeItem, journeyAnalogy?: JourneyAnalogy): string {
  const depth = DEPTH_STYLE[item.node.depth];
  const leftAtoms = item.node.panel?.expansion?.left_items ?? [];
  const rightAtoms = item.node.panel?.expansion?.right_items ?? [];
  const atoms = [...leftAtoms, ...rightAtoms].sort((a, b) => a.order - b.order);
  const checkpoint = item.node.panel?.checkpoint;

  const atomsGrid = atoms.map(atom => `
    <article class="subtopic-detail-card">
      <h4>${escapeHtml(String(atom.order))}. ${escapeHtml(atom.label)}</h4>
      ${renderExplanationText(atom.explanation)}
      <p>${escapeHtml(atom.learner_action)}</p>
      <span>${escapeHtml(atom.output)}</span>
      <div class="subnode-meta">
        <div class="tool-pills"><span class="tool-pill">${escapeHtml(atom.depth_level)}</span></div>
        ${atom.tools?.length ? `<div class="tool-pills">${atom.tools.map(t => `<span class="tool-pill">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
      </div>
    </article>`).join('');

  const analogySection = journeyAnalogy ? `
    <section class="panel-section">
      <div class="section-title">Your journey</div>
      <div class="analogy-box">
        <p><strong>${escapeHtml(journeyAnalogy.frame)}</strong></p>
        <p>Phase 1 — ${escapeHtml(journeyAnalogy.phase_1_meaning)}</p>
        <p>Phase 2 — ${escapeHtml(journeyAnalogy.phase_2_meaning)}</p>
        <p>Phase 3 — ${escapeHtml(journeyAnalogy.phase_3_meaning)}</p>
      </div>
    </section>` : '';

  const checkpointSection = checkpoint ? `
    <section class="checkpoint-box">
      <div class="section-title">Project checkpoint</div>
      <h4>${escapeHtml(checkpoint.title)}</h4>
      <p>${escapeHtml(checkpoint.scenario)}</p>
      <p><strong>Artifact:</strong> ${escapeHtml(checkpoint.artifact_to_create)}</p>
      <ul>${checkpoint.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
      <ul>${checkpoint.done_when.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
      ${checkpoint.confidence_check ? `<p><strong>Confidence check:</strong> ${escapeHtml(checkpoint.confidence_check)}</p>` : ''}
    </section>` : `
    <section class="checkpoint-box">
      <div class="section-title">Project checkpoint</div>
      <h4>${escapeHtml(item.step.checkpoint.title)}</h4>
      <p>${escapeHtml(item.step.checkpoint.problem_statement)}</p>
      <ul>${item.step.checkpoint.concepts.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
      <span>${escapeHtml(item.step.checkpoint.done_criteria)}</span>
    </section>`;

  return `<div class="panel-body">
    ${renderNodeExpansionMap(item)}
    <section class="panel-section subtopic-details">
      <div class="section-title">Node atoms</div>
      <div class="subtopic-detail-grid">${atomsGrid}</div>
    </section>
    ${analogySection}
    <section class="panel-section panel-explanation">
      <div class="panel-section-header">
        <div>
          <div class="section-title">Explanation</div>
          <h3>${escapeHtml(item.node.name_plain)}</h3>
        </div>
        <span class="depth-pill" style="color: ${depth.color}; background: ${depth.bg}">${escapeHtml(depth.label)}</span>
      </div>
      <p class="panel-lede">${escapeHtml(item.node.what_covers)}</p>
      <div class="panel-outcome">
        <span>After this node</span>
        <p>${escapeHtml(item.node.what_do_after)}</p>
      </div>
    </section>
    ${checkpointSection}
  </div>`;
}

function renderProjectNodeContent(item: RoadmapNodeItem): string {
  const depth = DEPTH_STYLE[item.node.depth];
  const checkpoint = item.node.panel?.checkpoint;

  const checkpointSections = checkpoint ? `
    <section class="panel-section">
      <div class="section-title">Scenario</div>
      <p class="panel-lede">${escapeHtml(checkpoint.scenario)}</p>
    </section>
    <section class="checkpoint-box">
      <div class="section-title">Tasks</div>
      <ul>${checkpoint.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
    </section>
    <section class="panel-section">
      <div class="section-title">Success criteria</div>
      <ul style="margin:0;padding-left:18px;color:var(--color-muted);font-size:13px;line-height:1.55">
        ${checkpoint.done_when.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
      </ul>
    </section>
    <section class="panel-section">
      <div class="section-title">Deliverable</div>
      <p class="panel-lede">${escapeHtml(checkpoint.artifact_to_create)}</p>
    </section>
    ${checkpoint.confidence_check ? `<section class="panel-section"><div class="section-title">Confidence check</div><p class="panel-lede">${escapeHtml(checkpoint.confidence_check)}</p></section>` : ''}
    ${checkpoint.tools?.length ? `<div class="tool-pills">${checkpoint.tools.map(t => `<span class="tool-pill">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
  ` : '';

  return `<div class="panel-body">
    <section class="panel-section panel-explanation">
      <div class="panel-section-header">
        <div>
          <div class="section-title">Project</div>
          <h3>${escapeHtml(item.node.name_plain)}</h3>
        </div>
        <span class="depth-pill" style="color: ${depth.color}; background: ${depth.bg}">${escapeHtml(depth.label)}</span>
      </div>
      <p class="panel-lede">${escapeHtml(item.node.one_line_desc)}</p>
    </section>
    ${checkpointSections}
  </div>`;
}

function renderProjectCheckpointContent(cp: ProjectCheckpoint): string {
  const tasksSection = cp.tasks.length > 0 ? `
    <section class="panel-section project-tasks-section">
      <div class="section-title">Tasks</div>
      <ol class="project-tasks-list">${cp.tasks.map((t, i) => renderTaskItem(t, i)).join('')}</ol>
    </section>` : '';

  const learnSection = cp.what_youll_learn.length > 0 ? `
    <section class="panel-section">
      <div class="section-title">What You&apos;ll Learn</div>
      <ul class="project-bullet-list">${cp.what_youll_learn.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
    </section>` : '';

  const coreSection = cp.core_components.length > 0 ? `
    <section class="panel-section">
      <div class="section-title">Core Components</div>
      <ul class="project-spec-list">${cp.core_components.map(i => renderCoreItem(i)).join('')}</ul>
    </section>` : '';

  const criteriaSection = cp.success_criteria.length > 0 ? `
    <section class="panel-section">
      <div class="section-title">Success Criteria</div>
      <ul class="project-criteria-list">${cp.success_criteria.map(i => `
        <li><span class="project-criteria-check" aria-hidden="true">&#10003;</span><span>${renderInlineCode(i)}</span></li>`).join('')}
      </ul>
    </section>` : '';

  const delivSection = cp.deliverables.length > 0 ? `
    <section class="panel-section">
      <div class="section-title">Deliverables</div>
      <ul class="project-spec-list">${cp.deliverables.map(i => renderCoreItem(i)).join('')}</ul>
    </section>` : '';

  const bonusSection = cp.bonus_challenges?.length ? `
    <section class="panel-section">
      <div class="section-title">Bonus Challenges</div>
      <ul class="project-bullet-list">${cp.bonus_challenges.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
    </section>` : '';

  const reflectSection = cp.reflection_questions?.length ? `
    <section class="panel-section">
      <div class="section-title">Reflection Questions</div>
      <ul class="project-bullet-list">${cp.reflection_questions.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
    </section>` : '';

  const toolsSection = cp.tools.length > 0
    ? `<div class="tool-pills">${cp.tools.map(t => `<span class="tool-pill">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  const typeLabel = cp.type === 'mini_project' ? 'Mini Build' : 'Capstone';

  return `<div class="panel-body">
    <section class="panel-section panel-explanation">
      <div class="section-title">${SVG_HAMMER_SMALL} ${typeLabel}</div>
      <h3>${escapeHtml(cp.title)}</h3>
    </section>
    ${cp.objective ? `<section class="panel-section"><div class="section-title">Objective</div><p class="panel-lede">${escapeHtml(cp.objective)}</p></section>` : ''}
    ${cp.scenario ? `<section class="panel-section"><div class="section-title">Scenario</div><p class="panel-lede">${escapeHtml(cp.scenario)}</p></section>` : ''}
    ${tasksSection}
    ${learnSection}
    ${coreSection}
    ${criteriaSection}
    ${delivSection}
    ${bonusSection}
    ${reflectSection}
    ${toolsSection}
  </div>`;
}

function renderGlossaryContent(terms: RoadmapGlossaryTerm[]): string {
  const termRows = terms.map(term => `
    <article class="glossary-term">
      <div>
        <h4>${escapeHtml(term.term)}</h4>
        ${term.group ? `<span>${escapeHtml(term.group)}</span>` : ''}
      </div>
      ${renderGlossaryDefinition(term.definition)}
    </article>`).join('');

  return `<div class="glossary-body">
    <div class="glossary-heading">
      <span>Key terms</span>
      <h3>Roadmap glossary</h3>
      <p>Short definitions for the AI workflow language used across this roadmap.</p>
    </div>
    <div class="glossary-list">${termRows}</div>
  </div>`;
}

// ── Canvas renderer ───────────────────────────────────────────────────────────

function renderNodeTile(item: RoadmapNodeItem, point: Point, index: number): string {
  const placement = getTilePlacement(index, point, false);
  const isProject = item.node.node_kind === 'project';
  const dotSize = isProject ? 46 : 44;
  const halo = isProject ? 18 : 22;
  const tileWidth = 214;
  const tileHeight = 64;

  const leaderLength = Math.abs(
    placement.anchor === 'left'
      ? point.x - (placement.left + tileWidth)
      : placement.anchor === 'right'
        ? placement.left - point.x
        : 48
  );
  const leaderVertical = Math.abs(
    placement.anchor === 'top'
      ? point.y - (placement.top + tileHeight)
      : placement.anchor === 'bottom'
        ? placement.top - point.y
        : 32
  );

  const leaderMinX = placement.anchor === 'left' ? point.x - leaderLength : point.x;
  const leaderMaxX = placement.anchor === 'right' ? point.x + leaderLength : point.x;
  const leaderMinY = placement.anchor === 'top' ? point.y - leaderVertical : point.y;
  const leaderMaxY = placement.anchor === 'bottom' ? point.y + leaderVertical : point.y;

  const boundsLeft   = Math.min(point.x - dotSize / 2 - halo, placement.left, leaderMinX) - 4;
  const boundsTop    = Math.min(point.y - dotSize / 2 - halo, placement.top, leaderMinY) - 4;
  const boundsRight  = Math.max(point.x + dotSize / 2 + halo, placement.left + tileWidth, leaderMaxX) + 4;
  const boundsBottom = Math.max(point.y + dotSize / 2 + halo, placement.top + tileHeight, leaderMaxY) + 4;

  const nodeId = item.node.id;
  const nodeClass = isProject ? 'roadmap-node roadmap-node-project' : 'roadmap-node';
  const nodeStyle = [
    `left: ${boundsLeft}px`,
    `top: ${boundsTop}px`,
    `width: ${boundsRight - boundsLeft}px`,
    `height: ${boundsBottom - boundsTop}px`,
    `--node-index: ${index}`,
  ].join('; ');

  const leaderStyle = [
    `left: ${point.x - boundsLeft}px`,
    `top: ${point.y - boundsTop}px`,
    `--roadmap-leader-length: ${leaderLength}px`,
    `--roadmap-leader-vertical: ${leaderVertical}px`,
  ].join('; ');

  const dotLeft = point.x - boundsLeft - dotSize / 2;
  const dotTop  = point.y - boundsTop  - dotSize / 2;
  const dotClass = [
    'roadmap-dot',
    isProject ? 'roadmap-dot-project' : '',
  ].filter(Boolean).join(' ');
  const dotStyle = `left: ${dotLeft}px; top: ${dotTop}px; width: ${dotSize}px; height: ${dotSize}px`;

  const tileLeft = placement.left - boundsLeft;
  const tileTop  = placement.top  - boundsTop;
  const tileClass = ['roadmap-tile', isProject ? 'roadmap-tile-project' : ''].filter(Boolean).join(' ');
  const tileStyle = `left: ${tileLeft}px; top: ${tileTop}px`;

  const tileIcon = isProject
    ? `<span class="roadmap-tile-date roadmap-tile-project-icon">${SVG_HAMMER}</span>`
    : `<span class="roadmap-tile-date"><strong>${item.stepNum}</strong></span>`;

  return `<button
    type="button"
    class="${nodeClass}"
    onclick="openNodePanel('${escapeHtml(nodeId)}')"
    style="${nodeStyle}"
    aria-label="Open ${isProject ? 'project node' : 'roadmap node'} ${escapeHtml(item.node.name_plain)}"
  >
    <span class="roadmap-leader roadmap-leader-${placement.anchor}" style="${leaderStyle}" aria-hidden="true"></span>
    <span id="dot-${escapeHtml(nodeId)}" class="${dotClass}" style="${dotStyle}">
      <span>${item.nodeNum}</span>
    </span>
    <span id="tile-${escapeHtml(nodeId)}" class="${tileClass}" style="${tileStyle}">
      <span class="roadmap-tile-copy">
        <strong>${escapeHtml(item.node.name_plain)}</strong>
      </span>
      ${tileIcon}
    </span>
  </button>`;
}

function renderCanvas(items: RoadmapNodeItem[], projectIconIndices: number[]): string {
  if (!items.length) return '';

  const desktopLayout = getDesktopLayout(items.length);
  const points = desktopLayout.points;
  const path = buildRoundedOrthogonalPath(desktopLayout.route);

  // Finish stamp position
  const finalIndex = items.length - 1;
  const finalPoint = points[finalIndex];
  let finishStamp = '';
  if (finalPoint) {
    const finalTile = getTilePlacement(finalIndex, finalPoint, false);
    const tileCenterX = finalTile.left + 107;
    const tileBottom = finalTile.top + 84;
    const stampX = Math.max(112, Math.min(tileCenterX, 968));
    const stampY = tileBottom + 62;

    finishStamp = `<div class="roadmap-finish-stamp" style="left: ${stampX}px; top: ${stampY}px;" aria-label="Roadmap completion celebration">
      <span class="roadmap-finish-confetti" aria-hidden="true"><span></span><span></span><span></span></span>
      <span class="roadmap-finish-medal" aria-hidden="true">${SVG_PARTY}</span>
      <span class="roadmap-finish-copy">
        <strong>You are now <em>100x</em> better.</strong>
      </span>
    </div>`;
  }

  const canvasHeight = Math.max(
    getCanvasHeight(points),
    finalPoint ? (getTilePlacement(finalIndex, finalPoint, false).top + 84 + 62 + 70) : 0
  );

  const spineIcons = projectIconIndices.map(idx => {
    const p1 = points[idx];
    const p2 = points[idx + 1];
    if (!p1 || !p2) return '';
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    return `<div class="project-spine-icon" style="left: ${mx}px; top: ${my}px;" aria-hidden="true">${SVG_HAMMER}</div>`;
  }).join('');

  const nodeTiles = items.map((item, index) => {
    const point = points[index];
    if (!point) return '';
    return renderNodeTile(item, point, index);
  }).join('');

  return `<div class="roadmap-canvas" style="height: ${canvasHeight}px">
    <svg class="roadmap-path" viewBox="0 0 1080 ${canvasHeight}" aria-hidden="true">
      <path class="roadmap-path-band-shadow" d="${escapeHtml(path)}" />
      <path class="roadmap-path-band" d="${escapeHtml(path)}" />
      <path class="roadmap-path-stroke" d="${escapeHtml(path)}" />
    </svg>
    ${nodeTiles}
    ${spineIcons}
    ${finishStamp}
  </div>`;
}

// ── Checkpoint strip ──────────────────────────────────────────────────────────

function renderCheckpointStrip(checkpoints: ProjectCheckpoint[]): string {
  if (!checkpoints?.length) return '';

  const miniProjects = checkpoints.filter(c => c.type === 'mini_project');
  const capstones = checkpoints.filter(c => c.type === 'final_project');

  const miniCards = miniProjects.map((cp, i) => `
    <article
      class="checkpoint-card checkpoint-card-mini"
      data-clickable=""
      role="button"
      tabindex="0"
      onclick="openProjectPanel('${escapeHtml(cp.id)}')"
      onkeydown="if(event.key==='Enter'||event.key===' ')openProjectPanel('${escapeHtml(cp.id)}')"
    >
      <div class="checkpoint-card-tag">Mini Build ${i + 1}</div>
      <h3 class="checkpoint-card-title">${escapeHtml(cp.title)}</h3>
      <p class="checkpoint-card-goal">${escapeHtml(cp.objective)}</p>
      ${cp.tools?.length ? `<div class="checkpoint-card-tools">${cp.tools.map(t => `<span class="tool-pill">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
    </article>`).join('');

  const capstoneCards = capstones.map(cp => `
    <article
      class="checkpoint-card checkpoint-card-capstone"
      data-clickable=""
      role="button"
      tabindex="0"
      onclick="openProjectPanel('${escapeHtml(cp.id)}')"
      onkeydown="if(event.key==='Enter'||event.key===' ')openProjectPanel('${escapeHtml(cp.id)}')"
    >
      <div class="checkpoint-capstone-header">
        <div class="checkpoint-card-tag checkpoint-card-tag-capstone">Capstone</div>
        <h3 class="checkpoint-card-title">${escapeHtml(cp.title)}</h3>
        <p class="checkpoint-card-goal">${escapeHtml(cp.objective)}</p>
      </div>
      <div class="checkpoint-capstone-body">
        ${cp.success_criteria?.length ? `
        <div class="checkpoint-capstone-criteria">
          <span>Done when</span>
          <ul>${cp.success_criteria.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
        </div>` : ''}
        ${cp.tools?.length ? `<div class="checkpoint-card-tools">${cp.tools.map(t => `<span class="tool-pill">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
      </div>
    </article>`).join('');

  return `<section class="checkpoint-strip" aria-label="Project checkpoints">
    <div class="primer-strip-head">
      <span>Project cadence</span>
      <strong>Build things. Prove you can do it.</strong>
    </div>
    <div class="checkpoint-strip-grid">${miniCards}</div>
    ${capstoneCards}
  </section>`;
}

// ── JS ────────────────────────────────────────────────────────────────────────

function getOfflineJs(
  nodePanels: Record<string, string>,
  projectPanels: Record<string, string>,
  glossaryHtml: string
): string {
  // Safely embed HTML content inside a JS object — use JSON.stringify on each value
  const nodePanelsJson = Object.entries(nodePanels)
    .map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(',\n');
  const projectPanelsJson = Object.entries(projectPanels)
    .map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(',\n');

  return `
(function () {
  var NODE_PANELS = { ${nodePanelsJson} };
  var PROJECT_PANELS = { ${projectPanelsJson} };
  var _activeNodeId = null;

  function setActiveNode(id) {
    if (!id) return;
    var dot = document.getElementById('dot-' + id);
    var tile = document.getElementById('tile-' + id);
    if (dot) dot.classList.add('roadmap-dot-active');
    if (tile) tile.classList.add('roadmap-tile-active');
  }

  function clearActiveNode(id) {
    if (!id) return;
    var dot = document.getElementById('dot-' + id);
    var tile = document.getElementById('tile-' + id);
    if (dot) dot.classList.remove('roadmap-dot-active');
    if (tile) tile.classList.remove('roadmap-tile-active');
  }

  window.openNodePanel = function (nodeId) {
    clearActiveNode(_activeNodeId);
    _activeNodeId = nodeId;
    setActiveNode(nodeId);
    var body = document.getElementById('offline-panel-body');
    if (body) body.innerHTML = NODE_PANELS[nodeId] || '';
    document.getElementById('offline-backdrop').classList.add('panel-open');
    document.getElementById('offline-panel').classList.add('panel-open');
  };

  window.openProjectPanel = function (checkpointId) {
    clearActiveNode(_activeNodeId);
    _activeNodeId = null;
    var body = document.getElementById('offline-panel-body');
    if (body) body.innerHTML = PROJECT_PANELS[checkpointId] || '';
    document.getElementById('offline-backdrop').classList.add('panel-open');
    document.getElementById('offline-panel').classList.add('panel-open');
  };

  window.openGlossary = function () {
    document.getElementById('offline-glossary-backdrop').classList.add('panel-open');
    document.getElementById('offline-glossary').classList.add('panel-open');
  };

  window.closePanel = function () {
    clearActiveNode(_activeNodeId);
    _activeNodeId = null;
    document.getElementById('offline-backdrop').classList.remove('panel-open');
    document.getElementById('offline-panel').classList.remove('panel-open');
  };

  window.closeGlossary = function () {
    document.getElementById('offline-glossary-backdrop').classList.remove('panel-open');
    document.getElementById('offline-glossary').classList.remove('panel-open');
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { window.closePanel(); window.closeGlossary(); }
  });

  // Inject pre-rendered glossary content
  var gb = document.getElementById('offline-glossary-body');
  if (gb) gb.innerHTML = ${JSON.stringify(glossaryHtml)};
}());
`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateOfflineHTML(
  roadmap: Roadmap,
  roleCategory: RoleCategory,
  socTitle: string
): string {
  const items = getRoadmapItems(roadmap);
  const glossaryTerms = getGlossaryTerms(roadmap, items);
  const roleName = ROLE_DISPLAY[roleCategory];

  // Project icon indices (mirrors RoadmapView logic)
  const n = items.length;
  const projectIconIndices: number[] = [];
  if (n >= 3) {
    projectIconIndices.push(1);
    if (n >= 7) projectIconIndices.push(4);
    else if (n >= 5) projectIconIndices.push(3);
  }

  // Pre-render all panel content
  const nodePanels: Record<string, string> = {};
  for (const item of items) {
    if (item.node.node_kind === 'project') {
      nodePanels[item.node.id] = renderProjectNodeContent(item);
    } else {
      nodePanels[item.node.id] = renderNodePanelContent(item, roadmap.journey_analogy);
    }
  }

  const projectPanels: Record<string, string> = {};
  for (const cp of roadmap.project_checkpoints ?? []) {
    projectPanels[cp.id] = renderProjectCheckpointContent(cp);
  }

  const glossaryHtml = renderGlossaryContent(glossaryTerms);
  const canvasHtml = renderCanvas(items, projectIconIndices);
  const checkpointHtml = renderCheckpointStrip(roadmap.project_checkpoints ?? []);
  const js = getOfflineJs(nodePanels, projectPanels, glossaryHtml);

  const title = `AI-Native ${roleName} Roadmap`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;900&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
  <style>${OFFLINE_CSS}</style>
</head>
<body class="roadmap-page">

  <header class="roadmap-topbar">
    <div class="roadmap-title">
      <h2>Your AI-Native ${escapeHtml(roleName)} Roadmap</h2>
      <p>${escapeHtml(socTitle)}</p>
    </div>
    <a class="roadmap-cta" href="https://www.100xengineers.com/" target="_blank" rel="noopener noreferrer">
      <span>Train with 100x</span>
      ${SVG_EXTERNAL}
    </a>
  </header>

  <main class="roadmap-shell">
    <div class="roadmap-heading">
      <span>90-day roadmap</span>
      <h1>How your <strong>${escapeHtml(roleName)}</strong> role upgrades</h1>
    </div>

    <div class="roadmap-utility-row">
      <button class="glossary-trigger" type="button" onclick="openGlossary()">
        ${SVG_BOOK}
        <span>Glossary</span>
        <small>${glossaryTerms.length} key terms</small>
      </button>
    </div>

    ${canvasHtml}
    ${checkpointHtml}
  </main>

  <div id="offline-backdrop" class="roadmap-backdrop" onclick="closePanel()"></div>
  <div id="offline-glossary-backdrop" class="glossary-backdrop" onclick="closeGlossary()"></div>

  <aside id="offline-panel" class="roadmap-panel" role="dialog" aria-modal="true">
    <button class="panel-close" type="button" aria-label="Close panel" onclick="closePanel()">${SVG_X}</button>
    <div id="offline-panel-body"></div>
  </aside>

  <aside id="offline-glossary" class="glossary-panel" role="dialog" aria-modal="true">
    <button class="panel-close" type="button" aria-label="Close glossary" onclick="closeGlossary()">${SVG_X}</button>
    <div id="offline-glossary-body"></div>
  </aside>

  <script>${js}</script>
</body>
</html>`;
}
