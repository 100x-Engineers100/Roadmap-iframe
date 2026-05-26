# Saturday TODO - Roadmap UI Cleanup

Date: 2026-05-23

## Goal

Finish the roadmap architecture cleanup without changing the locked product behavior.

Locked behavior:
- Main roadmap canvas shows 3 phases with 2-3 clickable top-level nodes each.
- Main nodes render as orange circles plus compact label tiles, like the reference image.
- Top-level nodes can be concept nodes or project nodes.
- Project nodes appear on the main roadmap with distinct visual treatment.
- Step-level checkpoint details appear only inside the clicked node panel.
- Subnodes appear only inside the clicked node panel as a static mini-spine.
- Subnodes are static explanations, not clickable.
- Glossary/key terms are triggered from the roadmap screen, not from a main-canvas node.

## Stage 1 - Split Roadmap Components

- [x] Create `web/components/roadmap/RoadmapCanvas.tsx`
- [x] Create `web/components/roadmap/RoadmapNodeTile.tsx`
- [x] Create `web/components/roadmap/RoadmapSidePanel.tsx`
- [x] Create `web/components/roadmap/NodePanel.tsx`
- [x] Create `web/components/roadmap/SubnodeSpine.tsx`
- [x] Keep `web/components/screens/RoadmapView.tsx` as a thin composer only

Test:
- [x] `npm run typecheck`
- [x] `npm run lint`

## Stage 2 - Move Styles Out

- [x] Move roadmap inline `<style>` block into a scoped CSS file or stable component stylesheet
- [x] Keep exact current behavior and layout
- [x] Preserve mobile drawer behavior
- [x] Preserve reduced-motion behavior

Test:
- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] Check desktop route health at 1280px
- [ ] Check mobile roadmap at 375px

## Stage 3 - Update MASTER_SPEC

- [ ] Update Screen 8 spec to match the pivot
- [ ] Remove main-canvas checkpoint nodes from spec
- [ ] Add visible project-node treatment to spec
- [ ] Add roadmap glossary trigger to spec
- [ ] Add `RoadmapNode.subnodes`
- [ ] Document: checkpoint lives inside selected node panel
- [ ] Document: side panel subnode spine is static

Test:
- [ ] Re-read `MASTER_SPEC.md`
- [ ] Confirm no old straight-spine or main-checkpoint contradiction remains

## Stage 4 - Visual QA

- [x] Compare main roadmap against the reference image
- [x] Check tile sizing, dot size, path spacing, labels
- [x] Check side panel readability
- [x] Check no horizontal overflow
- [x] Check all tap targets are 44px or larger

## Known Current State

- [OK] Roadmap behavior pivot is implemented in code.
- [OK] `npm run typecheck` passes.
- [OK] `npm run lint` passes.
- [OK] Roadmap pieces are split into `components/roadmap/*`.
- [OK] Roadmap styles are moved into `web/components/roadmap/RoadmapView.module.css`.
- [OK] Stage 3 correction pass adds attached side-panel concept map, glossary drawer, visible project-node styling, and specific `/dev-roadmap` fixture content.
- [OK] Stage 3 feedback pass rounds/sleeks the topbar CTA, moves the glossary trigger left with curved styling, makes project dots coral, and strengthens the roadmap page background grid/elements.
- [OK] Latest Stage 3 feedback pass aligns node 1 tile spacing with the other side tiles, strengthens leader lines, boldens node numbers, and keeps the glossary trigger fully rounded.
- [OK] Stage 4 funnel shell pass applies the roadmap theme to the assessment flow screens with shared topbar, progress, grid background, surfaces, and primary CTA treatment.
- [WARN] `MASTER_SPEC.md` still needs the Stage 3 cleanup to match the pivot and side-panel rules.
- [OK] Global typography conflict resolved by user: Space Grotesk is the 100x theme font for this product.
