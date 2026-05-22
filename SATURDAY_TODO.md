# Saturday TODO - Roadmap UI Cleanup

Date: 2026-05-23

## Goal

Finish the roadmap architecture cleanup without changing the locked product behavior.

Locked behavior:
- Main roadmap canvas shows 3 phases with 2-3 clickable top-level nodes each.
- Main nodes render as orange circles plus compact label tiles, like the reference image.
- Project checkpoints appear only inside the clicked node panel.
- Subnodes appear only inside the clicked node panel as a static mini-spine.
- Subnodes are static explanations, not clickable.

## Stage 1 - Split Roadmap Components

- [ ] Create `web/components/roadmap/RoadmapCanvas.tsx`
- [ ] Create `web/components/roadmap/RoadmapNodeTile.tsx`
- [ ] Create `web/components/roadmap/RoadmapSidePanel.tsx`
- [ ] Create `web/components/roadmap/NodePanel.tsx`
- [ ] Create `web/components/roadmap/SubnodeSpine.tsx`
- [ ] Keep `web/components/screens/RoadmapView.tsx` as a thin composer only

Test:
- [ ] `npm run typecheck`
- [ ] `npm run lint`

## Stage 2 - Move Styles Out

- [ ] Move roadmap inline `<style>` block into a scoped CSS file or stable component stylesheet
- [ ] Keep exact current behavior and layout
- [ ] Preserve mobile drawer behavior
- [ ] Preserve reduced-motion behavior

Test:
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] Check desktop roadmap at 1280px
- [ ] Check mobile roadmap at 375px

## Stage 3 - Update MASTER_SPEC

- [ ] Update Screen 8 spec to match the pivot
- [ ] Remove main-canvas checkpoint nodes from spec
- [ ] Add `RoadmapNode.subnodes`
- [ ] Document: checkpoint lives inside selected node panel
- [ ] Document: side panel subnode spine is static

Test:
- [ ] Re-read `MASTER_SPEC.md`
- [ ] Confirm no old straight-spine or main-checkpoint contradiction remains

## Stage 4 - Visual QA

- [ ] Compare main roadmap against the reference image
- [ ] Check tile sizing, dot size, path spacing, labels
- [ ] Check side panel readability
- [ ] Check no horizontal overflow
- [ ] Check all tap targets are 44px or larger

## Known Current State

- [OK] Roadmap behavior pivot is implemented in code.
- [OK] `npm run typecheck` passes.
- [OK] `npm run lint` passes.
- [WARN] Architecture still violates `MASTER_SPEC.md` because roadmap pieces are not yet split into `components/roadmap/*`.
