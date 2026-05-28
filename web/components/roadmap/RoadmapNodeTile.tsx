'use client';

import type { CSSProperties } from 'react';
import { Hammer } from 'lucide-react';
import type { Point, RoadmapNodeItem } from './roadmapUtils';
import { getTilePlacement } from './roadmapUtils';

interface RoadmapNodeTileProps {
  item: RoadmapNodeItem;
  point: Point;
  index: number;
  isActive: boolean;
  isMobile: boolean;
  onOpen: () => void;
}

export function RoadmapNodeTile({
  item,
  point,
  index,
  isActive,
  isMobile,
  onOpen,
}: RoadmapNodeTileProps) {
  const placement = getTilePlacement(index, point, isMobile);
  const isProject = item.node.node_kind === 'project';
  const dotSize = isMobile ? 32 : isProject ? 46 : 44;
  const halo = isMobile ? 18 : isProject ? 18 : 22;
  const tileWidth = isMobile ? 320 : 214;
  const tileHeight = isMobile ? 72 : 64;
  const leaderLength = Math.abs(
    placement.anchor === 'left'
      ? point.x - (placement.left + tileWidth)
      : placement.anchor === 'right'
        ? placement.left - point.x
        : isMobile
          ? 34
          : 48
  );
  const leaderVertical = Math.abs(
    placement.anchor === 'top'
      ? point.y - (placement.top + tileHeight)
      : placement.anchor === 'bottom'
        ? placement.top - point.y
        : isMobile
          ? 36
          : 32
  );
  const leaderMinX = placement.anchor === 'left' ? point.x - leaderLength : point.x;
  const leaderMaxX = placement.anchor === 'right' ? point.x + leaderLength : point.x;
  const leaderMinY = placement.anchor === 'top' ? point.y - leaderVertical : point.y;
  const leaderMaxY = placement.anchor === 'bottom' ? point.y + leaderVertical : point.y;
  const boundsLeft = Math.min(point.x - dotSize / 2 - halo, placement.left, leaderMinX) - 4;
  const boundsTop = Math.min(point.y - dotSize / 2 - halo, placement.top, leaderMinY) - 4;
  const boundsRight = Math.max(point.x + dotSize / 2 + halo, placement.left + tileWidth, leaderMaxX) + 4;
  const boundsBottom = Math.max(point.y + dotSize / 2 + halo, placement.top + tileHeight, leaderMaxY) + 4;
  const nodeStyle = {
    left: boundsLeft,
    top: boundsTop,
    width: boundsRight - boundsLeft,
    height: boundsBottom - boundsTop,
    '--node-index': index,
  } as CSSProperties;
  const leaderStyle = {
    left: point.x - boundsLeft,
    top: point.y - boundsTop,
    '--roadmap-leader-length': `${leaderLength}px`,
    '--roadmap-leader-vertical': `${leaderVertical}px`,
  } as CSSProperties;

  return (
    <button
      type="button"
      className={isProject ? 'roadmap-node roadmap-node-project' : 'roadmap-node'}
      onClick={onOpen}
      style={nodeStyle}
      aria-label={`Open ${isProject ? 'project node' : 'roadmap node'} ${item.node.name_plain}`}
    >
      <span
        className={`roadmap-leader roadmap-leader-${placement.anchor}`}
        style={leaderStyle}
        aria-hidden="true"
      />
      <span
        className={[
          'roadmap-dot',
          isProject ? 'roadmap-dot-project' : '',
          isActive ? 'roadmap-dot-active' : '',
        ].filter(Boolean).join(' ')}
        style={{
          left: point.x - boundsLeft - dotSize / 2,
          top: point.y - boundsTop - dotSize / 2,
          width: dotSize,
          height: dotSize,
        }}
      >
        <span>{item.nodeNum}</span>
      </span>
      <span
        className={[
          'roadmap-tile',
          isProject ? 'roadmap-tile-project' : '',
          isActive ? 'roadmap-tile-active' : '',
        ].filter(Boolean).join(' ')}
        style={{
          left: placement.left - boundsLeft,
          top: placement.top - boundsTop,
        }}
      >
        <span className="roadmap-tile-copy">
          <strong>{item.node.name_plain}</strong>
          <small>{item.node.one_line_desc}</small>
        </span>
        <span className={isProject ? 'roadmap-tile-date roadmap-tile-project-icon' : 'roadmap-tile-date'}>
          {isProject ? <Hammer size={17} strokeWidth={2.35} aria-hidden="true" /> : <strong>{item.stepNum}</strong>}
        </span>
      </span>
    </button>
  );
}
