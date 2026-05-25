'use client';

import { useSyncExternalStore } from 'react';
import type { Roadmap, RoadmapGlossaryTerm, RoadmapNode, RoadmapStep, RoleCategory } from '@/types';

export interface RoadmapNodeItem {
  node: RoadmapNode;
  step: RoadmapStep;
  stepNum: number;
  nodeNum: number;
}

export interface Point {
  x: number;
  y: number;
}

export type TileAnchor = 'left' | 'right' | 'top' | 'bottom';

export interface TilePlacement {
  left: number;
  top: number;
  anchor: TileAnchor;
}

const GLOSSARY_DEFINITIONS: Record<string, string> = {
  'Acceptance gates': 'Clear pass or fail checks before AI-assisted work reaches a teammate, user, or customer.',
  'Agent loop': 'A repeatable cycle where AI plans, acts, observes the result, and decides the next step.',
  'Baseline metric': 'The before number used to prove whether an AI workflow improved speed, quality, or cost.',
  'Decision log': 'A short record of key tradeoffs, assumptions, and review decisions made while building the workflow.',
  'Failure path': 'The fallback route for cases where automation gets bad input, missing context, or unsafe output.',
  'Human review': 'A deliberate checkpoint where a person verifies judgment, facts, risk, or final quality.',
  'Input map': 'A list of source documents, data, examples, and constraints needed before AI can produce useful work.',
  'Output contract': 'A fixed format and quality bar that makes AI output easier to inspect and reuse.',
  'Prompt contract': 'A reusable instruction pattern that defines role, context, constraints, examples, and output format.',
  'Retrieval set': 'The trusted source material AI should use when answering or drafting work.',
  'Review rubric': 'A scoring guide for judging AI output against accuracy, structure, tone, and usefulness.',
  'Tool handoff': 'The structured transfer of data or work from one app, API, or workflow step to the next.',
};

export const ROLE_DISPLAY: Record<RoleCategory, string> = {
  pm: 'Product Manager',
  designer: 'Designer',
  marketer: 'Marketer',
  sales: 'Sales Professional',
  engineer: 'Engineer',
  student: 'Student',
};

export const DEPTH_STYLE: Record<RoadmapNode['depth'], { label: string; color: string; bg: string }> = {
  foundational: { label: 'Foundation', color: '#166534', bg: '#dcfce7' },
  intermediate: { label: 'Workflow', color: '#92400e', bg: '#fef3c7' },
  advanced: { label: 'Project', color: '#b22c11', bg: '#fce8e6' },
};

export const DESKTOP_POINTS: Point[] = [
  { x: 180, y: 150 },
  { x: 540, y: 150 },
  { x: 900, y: 150 },
  { x: 900, y: 375 },
  { x: 540, y: 375 },
  { x: 180, y: 375 },
  { x: 180, y: 615 },
  { x: 540, y: 615 },
  { x: 900, y: 615 },
];

export const DESKTOP_ROUTE_POINTS: Point[] = [
  { x: 180, y: 150 },
  { x: 900, y: 150 },
  { x: 900, y: 375 },
  { x: 180, y: 375 },
  { x: 180, y: 615 },
  { x: 900, y: 615 },
];

export function getDesktopLayout(total: number): { points: Point[]; route: Point[]; stamp: Point | null } {
  const count = Math.max(0, Math.min(total, DESKTOP_POINTS.length));
  const points = DESKTOP_POINTS.slice(0, count);

  if (points.length < 2) {
    return { points, route: points, stamp: points[0] ? { x: points[0].x + 112, y: points[0].y } : null };
  }

  const routeByCount: Record<number, number[]> = {
    2: [0, 1],
    3: [0, 2],
    4: [0, 2, 3],
    5: [0, 2, 3, 4],
    6: [0, 2, 3, 5],
    7: [0, 2, 3, 5, 6],
    8: [0, 2, 3, 5, 6, 7],
    9: [0, 2, 3, 5, 6, 8],
  };
  const route = (routeByCount[count] ?? Array.from({ length: count }, (_, index) => index))
    .map((index) => DESKTOP_POINTS[index])
    .filter((point): point is Point => Boolean(point));

  const last = points[points.length - 1];
  const beforeLast = route.length > 1 ? route[route.length - 2] : points[points.length - 2];
  const dx = Math.sign(last.x - beforeLast.x);
  const dy = Math.sign(last.y - beforeLast.y);
  const stamp = {
    x: last.x + (dx === 0 ? 0 : dx * 132),
    y: last.y + (dy === 0 ? 0 : dy * 112),
  };

  return { points, route, stamp };
}

const MOBILE_X = 42;
const MOBILE_START_Y = 86;
const MOBILE_GAP = 148;

function subscribeToResize(callback: () => void): () => void {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function getMobileSnapshot(): boolean {
  return window.innerWidth < 768;
}

function getServerMobileSnapshot(): boolean {
  return false;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribeToResize, getMobileSnapshot, getServerMobileSnapshot);
}

export function getRoadmapItems(roadmap: Roadmap): RoadmapNodeItem[] {
  const steps = [roadmap.step1, roadmap.step2, roadmap.step3];
  let nodeNum = 0;
  return steps.flatMap((step, stepIndex) =>
    step.nodes.map((node) => {
      nodeNum += 1;
      return { node, step, stepNum: stepIndex + 1, nodeNum };
    })
  );
}

function sentenceForTerm(term: string): string {
  return GLOSSARY_DEFINITIONS[term] ?? `${term} as used in this roadmap, with enough context to apply it in real work.`;
}

export function getGlossaryTerms(roadmap: Roadmap, items: RoadmapNodeItem[]): RoadmapGlossaryTerm[] {
  if (roadmap.glossary?.length) {
    return roadmap.glossary.slice(0, 18);
  }

  const seen = new Set<string>();
  const terms: RoadmapGlossaryTerm[] = [];

  for (const item of items) {
    const candidates = [
      ...item.node.concepts_left,
      ...item.node.concepts_right,
      ...item.node.subnodes.map((subnode) => subnode.title),
    ];

    for (const candidate of candidates) {
      const term = candidate.trim();
      const key = term.toLowerCase();
      if (!term || seen.has(key)) continue;

      seen.add(key);
      terms.push({
        term,
        definition: sentenceForTerm(term),
        source_node_id: item.node.id,
        group: item.node.name_plain,
      });

      if (terms.length >= 12) return terms;
    }
  }

  return terms;
}

export function getMobilePoints(total: number): Point[] {
  return Array.from({ length: total }, (_, index) => ({
    x: MOBILE_X,
    y: MOBILE_START_Y + index * MOBILE_GAP,
  }));
}

export function buildPath(points: Point[]): string {
  if (points.length < 2) return '';
  const [first, ...rest] = points;
  return rest.reduce((path, point, index) => {
    const prev = points[index];
    const midX = (prev.x + point.x) / 2;
    return `${path} C ${midX} ${prev.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${first.x} ${first.y}`);
}

export function buildRoundedOrthogonalPath(points: Point[], radius = 58): string {
  if (points.length < 2) return '';

  const commands = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 1; index < points.length - 1; index += 1) {
    const prev = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const inDistance = Math.hypot(current.x - prev.x, current.y - prev.y);
    const outDistance = Math.hypot(next.x - current.x, next.y - current.y);
    const cornerRadius = Math.min(radius, inDistance / 2, outDistance / 2);
    const inDirection = {
      x: (current.x - prev.x) / inDistance,
      y: (current.y - prev.y) / inDistance,
    };
    const outDirection = {
      x: (next.x - current.x) / outDistance,
      y: (next.y - current.y) / outDistance,
    };
    const beforeCorner = {
      x: current.x - inDirection.x * cornerRadius,
      y: current.y - inDirection.y * cornerRadius,
    };
    const afterCorner = {
      x: current.x + outDirection.x * cornerRadius,
      y: current.y + outDirection.y * cornerRadius,
    };

    commands.push(`L ${beforeCorner.x} ${beforeCorner.y}`);
    commands.push(`Q ${current.x} ${current.y} ${afterCorner.x} ${afterCorner.y}`);
  }

  const last = points[points.length - 1];
  commands.push(`L ${last.x} ${last.y}`);
  return commands.join(' ');
}

export function getCanvasHeight(points: Point[]): number {
  const last = points[points.length - 1];
  return Math.max(520, last ? last.y + 150 : 520);
}

export function getTileSide(index: number, isMobile: boolean): 'right' | 'left' {
  if (isMobile) return 'right';
  return index % 2 === 0 ? 'right' : 'left';
}

export function getTilePlacement(index: number, point: Point, isMobile: boolean): TilePlacement {
  if (isMobile) {
    return { left: point.x + 32, top: point.y - 35, anchor: 'right' };
  }

  const desktopPlacements: TilePlacement[] = [
    { left: -82, top: 118, anchor: 'left' },
    { left: 432, top: 42, anchor: 'top' },
    { left: 946, top: 118, anchor: 'right' },
    { left: 946, top: 342, anchor: 'right' },
    { left: 432, top: 422, anchor: 'bottom' },
    { left: -92, top: 318, anchor: 'left' },
    { left: -92, top: 582, anchor: 'left' },
    { left: 432, top: 654, anchor: 'bottom' },
    { left: 946, top: 582, anchor: 'right' },
  ];

  return desktopPlacements[index] ?? {
    left: Math.max(0, Math.min(point.x + 28, 818)),
    top: point.y - 40,
    anchor: 'right',
  };
}
