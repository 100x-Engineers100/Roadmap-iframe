# Session Memory — Roadmap Builder
_Last updated: 2026-05-28 (Phase 7 session)_

---

## Pipeline State

Full pipeline E2E working: Role Input → O*NET → Task Sliders → Score → Blueprint → Enrich → Validate → DB → UI
Active phase: PHASE 7 (UI rendering) — partially complete
North star: "Non-technical person reads roadmap and thinks: I can do this. I will be AI-native in my role."

---

## Phase 7 — What Was Built This Session

### NodeExpansionMap.tsx
- `ROW_Y` hardcoded → `getRowY(count)` = `Array.from({length: count}, (_, i) => 24 + i * 42)`
- `buildBranchPath` now takes `rowY: number[]` param
- Removed `.slice(0, 5)` cap + hardcoded 5-item arrays
- Pills rendered from actual arrays with inline `gridTemplateRows` style
- Supports 3, 4, or 5 pills per side

### NodePanel.tsx
- Deleted entire dead analogy section (lens_name, concept_mappings, base/role_skin/bridge_line)
- Replaced with global `journey_analogy` section (frame + 3 phase meanings)
- `checkpoint.done_when` → `<ul><li>` list (was `.join(' ')`)
- `checkpoint.confidence_check` rendered
- `journeyAnalogy?: JourneyAnalogy` prop added

### RoadmapSidePanel.tsx
- Added inline `ProjectPanel` component
- `node_kind === 'project'` → renders ProjectPanel (scenario, tasks, success criteria, deliverable, confidence check, tools)
- No NodeExpansionMap for project nodes
- `journeyAnalogy?: JourneyAnalogy` threaded through

### types/index.ts
- `journey_analogy?: JourneyAnalogy` added to `Roadmap` interface

### dev-roadmap/page.tsx
- `blueprintToRoadmap()` passes `journey_analogy`
- Fixture path updated: `phase7-generated-roadmaps/` → `pipeline-e2e/` (stale fixtures had no `journey_analogy`)
- Role mapping: `marketer→marketer-none`, `engineer→engineer-advanced`, etc.

### RoadmapView.tsx
- Passes `journeyAnalogy={roadmap.journey_analogy}` to RoadmapSidePanel

---

## NEXT SESSION — Phase 7 Remaining

### Glossary node on spine (highest priority)
User explicitly wants: glossary = spine node (not trigger button), click → opens side panel with terms listed.
User explicitly DOES NOT want: NodeExpansionMap pills style for glossary.

Implementation plan:
1. Add `'glossary'` to `RoadmapNodeKind` in `types/index.ts`
2. `buildGlossaryNodeItem(terms)` in `roadmapUtils.ts` — synthetic RoadmapNodeItem with fake step stub
3. `RoadmapView.tsx`: append glossary node to items, special-case click handler → `setIsGlossaryOpen(true)`, remove glossary trigger button from `roadmap-utility-row`
4. `RoadmapNodeTile.tsx`: `isGlossary = node_kind === 'glossary'`, show `BookOpen` icon + neutral badge color
5. No NodePanel/NodeExpansionMap for glossary nodes — click goes straight to RoadmapGlossaryPanel (existing)

Circular dependency to avoid: `glossaryTerms` depends on `baseItems`, so append glossary node AFTER computing terms.

---

## Key Architecture Facts

- `panel-blueprint.mjs`: "No per-node analogy — analogy is now global (journey_analogy)" — Vishal's intentional decision
- `journey_analogy` comes from gap_inference, is role-specific, NOT enriched by LLM
- `RoadmapBlueprint.journey_analogy` is required field — always present in current pipeline output
- Old `phase7-generated-roadmaps/` fixtures are STALE — use `pipeline-e2e/` fixtures for dev preview
- Project nodes on spine use `node_kind: 'project'` (RoadmapNodeKind), NOT 'mini_project'/'capstone'
- `ProjectNode` type in types/index.ts is a future type — not yet in current data pipeline
- `buildUserWorkProfile()` takes single destructured object — NEVER positional args

## Test Infrastructure State

- `test output/pipeline-e2e/*.json` — 6 enriched fixtures from latest run (structure: `{id, pass, failures, enriched: RoadmapBlueprint}`)
- `test output/g14-results.json` — last G14 judge results
- `test output/pipeline-e2e-report.json` — last E2E gate results

## Verified This Session (Playwright, marketer-none fixture)

- Journey analogy renders: "Going from hand-crafting every campaign to running a content engine..."
- done_when renders as 6 list items (4 steps + 2 criteria)
- Confidence check renders as `<p>` with "Confidence check:" prefix
- Dead analogy fields absent (lens_name, bridge_line not in panel HTML)
- Project panel: scenario + tasks + success criteria + deliverable + confidence check + tools visible

## G14 Semantic Quality (Pre-Phase 7 context)

Current scores (stable): 3/6 pass
- PASS: marketer (6/6), pm (5/6), student (6/6)
- FAIL: designer (3/6), sales (4/6), engineer (4/6)
- Remaining failures: S1 title framing, S4 journey analogy tool-names vs work-behavior
- Not blocking Phase 7 completion — content quality issue, not structural
