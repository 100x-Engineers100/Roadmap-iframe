'use client';

import { Hammer, PartyPopper } from 'lucide-react';
import { RoadmapNodeTile } from './RoadmapNodeTile';
import {
  buildPath,
  getCanvasHeight,
  getDesktopLayout,
  getMobilePoints,
  buildRoundedOrthogonalPath,
  getTilePlacement,
  type RoadmapNodeItem,
} from './roadmapUtils';

interface RoadmapCanvasProps {
  items: RoadmapNodeItem[];
  selectedId: string | null;
  isMobile: boolean;
  onSelect: (item: RoadmapNodeItem) => void;
  projectIconIndices?: number[];
}

export function RoadmapCanvas({ items, selectedId, isMobile, onSelect, projectIconIndices = [] }: RoadmapCanvasProps) {
  const desktopLayout = getDesktopLayout(items.length);
  const points = isMobile ? getMobilePoints(items.length) : desktopLayout.points;
  const path = isMobile ? buildPath(points) : buildRoundedOrthogonalPath(desktopLayout.route);
  const finishStamp = !isMobile && items.length
    ? (() => {
        const finalIndex = items.length - 1;
        const finalPoint = points[finalIndex];
        if (!finalPoint) return null;

        const finalTile = getTilePlacement(finalIndex, finalPoint, false);
        const tileCenterX = finalTile.left + 107;
        const tileBottom = finalTile.top + 84;

        return {
          x: Math.max(112, Math.min(tileCenterX, 968)),
          y: tileBottom + 62,
        };
      })()
    : null;
  const canvasHeight = Math.max(getCanvasHeight(points), finishStamp ? finishStamp.y + 70 : 0);

  return (
    <div className="roadmap-canvas" style={{ height: canvasHeight }}>
      <svg className="roadmap-path" viewBox={`0 0 ${isMobile ? 390 : 1080} ${canvasHeight}`} aria-hidden="true">
        <path className="roadmap-path-band-shadow" d={path} />
        <path className="roadmap-path-band" d={path} />
        <path className="roadmap-path-stroke" d={path} />
      </svg>

      {items.map((item, index) => (
        <RoadmapNodeTile
          key={item.node.id}
          item={item}
          point={points[index]}
          index={index}
          isActive={selectedId === item.node.id}
          isMobile={isMobile}
          onOpen={() => onSelect(item)}
        />
      ))}

      {!isMobile && projectIconIndices.map(idx => {
        const p1 = points[idx];
        const p2 = points[idx + 1];
        if (!p1 || !p2) return null;
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        return (
          <div
            key={idx}
            className="project-spine-icon"
            style={{ left: mx, top: my }}
            aria-hidden="true"
          >
            <Hammer size={14} strokeWidth={2.2} />
          </div>
        );
      })}

      {finishStamp && (
        <div
          className="roadmap-finish-stamp"
          style={{ left: finishStamp.x, top: finishStamp.y }}
          aria-label="Roadmap completion celebration"
        >
          <span className="roadmap-finish-confetti" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="roadmap-finish-medal" aria-hidden="true">
            <PartyPopper size={16} strokeWidth={2.4} />
          </span>
          <span className="roadmap-finish-copy">
            <strong>You are now <em>100x</em> better.</strong>
          </span>
        </div>
      )}
    </div>
  );
}
