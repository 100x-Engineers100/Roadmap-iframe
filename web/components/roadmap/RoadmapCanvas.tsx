'use client';

import { PartyPopper } from 'lucide-react';
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
}

export function RoadmapCanvas({ items, selectedId, isMobile, onSelect }: RoadmapCanvasProps) {
  const desktopLayout = getDesktopLayout(items.length);
  const points = isMobile ? getMobilePoints(items.length) : desktopLayout.points;
  const path = isMobile ? buildPath(points) : buildRoundedOrthogonalPath(desktopLayout.route);
  const finishStamp = !isMobile && items.length
    ? (() => {
        const finalIndex = items.length - 1;
        const finalPoint = points[finalIndex];
        if (!finalPoint) return null;

        const maxTileBottom = points.reduce((maxY, point, index) => {
          const tile = getTilePlacement(index, point, false);
          return Math.max(maxY, tile.top + 80);
        }, 0);

        const finalTile = getTilePlacement(finalIndex, finalPoint, false);
        return {
          x: finalTile.left + 107,
          y: maxTileBottom + 48,
        };
      })()
    : null;
  const canvasHeight = Math.max(getCanvasHeight(points), finishStamp ? finishStamp.y + 60 : 0);

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
            <PartyPopper size={21} strokeWidth={2.4} />
          </span>
          <span className="roadmap-finish-copy">
            <strong>You are now <em>100x</em> better.</strong>
          </span>
        </div>
      )}
    </div>
  );
}
