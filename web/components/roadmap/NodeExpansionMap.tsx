'use client';

import type { RoadmapNodeItem } from './roadmapUtils';

function fallbackPills(item: RoadmapNodeItem, side: 'left' | 'right'): string[] {
  const titles = item.node.subnodes.map((subnode) => subnode.title).filter(Boolean);
  const midpoint = Math.ceil(titles.length / 2);
  return side === 'left' ? titles.slice(0, midpoint) : titles.slice(midpoint);
}

function getPills(item: RoadmapNodeItem, side: 'left' | 'right'): string[] {
  const source = side === 'left' ? item.node.concepts_left : item.node.concepts_right;
  const fallback = fallbackPills(item, side);
  const values = (source?.length ? source : fallback).filter(Boolean);
  return values.slice(0, 6);
}

const ROW_Y = [42, 102, 162];

function buildBranchPath(side: 'left' | 'right', visibleRows: number[]): string {
  if (visibleRows.length === 0) return '';

  const rowYs = visibleRows.map((row) => ROW_Y[row]);
  const minY = Math.min(102, ...rowYs);
  const maxY = Math.max(102, ...rowYs);
  const rowBranches = visibleRows
    .map((row) => {
      const y = ROW_Y[row];
      return side === 'left' ? `M 188 ${y} H 172` : `M 372 ${y} H 388`;
    })
    .join(' ');

  if (side === 'left') {
    return `M 219 102 H 188 M 188 ${minY} V ${maxY} ${rowBranches}`;
  }

  return `M 341 102 H 372 M 372 ${minY} V ${maxY} ${rowBranches}`;
}

export function NodeExpansionMap({ item, total }: { item: RoadmapNodeItem; total: number }) {
  const left = getPills(item, 'left');
  const right = getPills(item, 'right');
  const leftRows = [left[0], left[1], left[2]];
  const rightRows = [right[0], right[1], right[2]];
  const leftVisibleRows = leftRows.flatMap((pill, index) => (pill ? [index] : []));
  const rightVisibleRows = rightRows.flatMap((pill, index) => (pill ? [index] : []));

  return (
    <section className="node-map" aria-label={`${item.node.name_plain} expanded subtopics`}>
      <div className="node-map-titlebar">
        <span>Selected node map</span>
        <strong>{item.node.name_plain}</strong>
      </div>

      <div className="node-map-grid">
        <svg className="node-map-branches" viewBox="0 0 560 204" preserveAspectRatio="none" aria-hidden="true">
          <path className="node-map-branch node-map-branch-left" d={buildBranchPath('left', leftVisibleRows)} />
          <path className="node-map-branch node-map-branch-right" d={buildBranchPath('right', rightVisibleRows)} />
        </svg>

        <div className="node-map-column node-map-column-left">
          <span className="node-map-cluster-label">Concepts</span>
          <div className="node-map-pills">
            {leftRows.map((pill, index) => (
              <span className="node-map-pill-slot" key={`left-${index}`}>
                {pill && (
                  <span className="node-map-pill node-map-pill-left" title={pill}>
                    {pill}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="node-map-center">
          <div className="node-map-line" aria-hidden="true" />
          <div className="node-map-badge">
            <span>Node {String(item.nodeNum).padStart(2, '0')} / {total}</span>
            <strong>{item.node.name_plain}</strong>
            <small>Phase {item.stepNum}</small>
          </div>
        </div>

        <div className="node-map-column node-map-column-right">
          <span className="node-map-cluster-label">Applied</span>
          <div className="node-map-pills">
            {rightRows.map((pill, index) => (
              <span className="node-map-pill-slot" key={`right-${index}`}>
                {pill && (
                  <span className="node-map-pill node-map-pill-right" title={pill}>
                    {pill}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
