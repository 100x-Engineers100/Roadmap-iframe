'use client';

import { useSyncExternalStore } from 'react';

export type {
  RoadmapNodeItem,
  Point,
  TileAnchor,
  TilePlacement,
} from '@/lib/roadmap/layoutHelpers';

export {
  ROLE_DISPLAY,
  DEPTH_STYLE,
  DESKTOP_POINTS,
  DESKTOP_ROUTE_POINTS,
  getRoadmapItems,
  getGlossaryTerms,
  getDesktopLayout,
  buildRoundedOrthogonalPath,
  getCanvasHeight,
  getTilePlacement,
} from '@/lib/roadmap/layoutHelpers';

import type { Point } from '@/lib/roadmap/layoutHelpers';

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

export function getTileSide(index: number, isMobile: boolean): 'right' | 'left' {
  if (isMobile) return 'right';
  return index % 2 === 0 ? 'right' : 'left';
}
