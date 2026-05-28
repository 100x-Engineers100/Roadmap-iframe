# Project: 100x AI Roadmap Builder

## MANDATORY SESSION START PROTOCOL

Do this in order before touching any code:

1. Read `graphify-out/GRAPH_REPORT.md` — full project knowledge graph. This tells you what every file does, how they connect, and what the critical nodes are.
2. Read `memory.md` if it exists — session history, pipeline state, open flags.
3. Identify the active phase from memory.md or the build doc.

**Never read individual source files until you have confirmed the graph does not answer your question.**

## How to Use the Graph Instead of Reading Files

Before reading any file, ask: "does the graph already tell me what this file does?"

- To understand what a file does: check its node in `graphify-out/GRAPH_REPORT.md`
- To find what calls a function: use the edges in `graphify-out/graph.json`
- To understand a subsystem: find its community in the report
- Only read the actual file when you need the exact implementation detail

God nodes (touch these = cascade effects everywhere):
- `RoleCategory` — 27 edges, bridges entire pipeline
- `buildUserWorkProfile()` — 19 edges
- `validateRoadmap()` — 18 edges
- `buildRoadmapBlueprint()` — 14 edges
- `RoadmapNodeItem` — 13 edges

Before editing any god node: trace ALL communities it connects to first.

## Project Architecture

Full pipeline: Role Input → O*NET SOC Match → Task Sliders → Score API → Blueprint → Enrich → Validate → DB → Roadmap UI

Key community map:
- Roadmap UI Components → `web/components/roadmap/`
- Score & Skill API Routes → `web/app/api/`
- O*NET API Integration → `web/lib/api/onet.ts`
- FO Score Model → `web/data/fo-scores.ts`
- Capability Matrix → `web/lib/roadmap/capability-matrix.mjs`
- Blueprint Builder → `web/lib/roadmap/blueprint.mjs`
- Roadmap Validation → `web/lib/roadmap/validate.mjs`
- Panel Copy & Delta → `web/lib/llm/panel-copy.ts`
- Core TypeScript Interfaces → `web/types/index.ts`

## Graph Refresh

When files change significantly, run:
```
/graphify . --update
```
This re-extracts only changed files, preserving cache.
