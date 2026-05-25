'use client';

import { RoadmapNodeTile } from './RoadmapNodeTile';
import {
  buildPath,
  getCanvasHeight,
  getDesktopLayout,
  getMobilePoints,
  buildRoundedOrthogonalPath,
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
  const canvasHeight = getCanvasHeight(points);
  const stamp = isMobile ? null : desktopLayout.stamp;

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

      {stamp && (
        <div
          className="roadmap-finish-stamp"
          style={{ left: stamp.x, top: stamp.y }}
          aria-label="AI-updated completion stamp"
        >
          AI-updated
        </div>
      )}
    </div>
  );
}
