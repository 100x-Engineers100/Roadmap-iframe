'use client';

import type { CSSProperties } from 'react';
import type { RoadmapNodeItem } from './roadmapUtils';

function fallbackPills(item: RoadmapNodeItem, side: 'left' | 'right'): string[] {
  const titles = item.node.subnodes.map((subnode) => subnode.title).filter(Boolean);
  const midpoint = Math.ceil(titles.length / 2);
  return side === 'left' ? titles.slice(0, midpoint) : titles.slice(midpoint);
}

function getPills(item: RoadmapNodeItem, side: 'left' | 'right'): string[] {
  const panelItems = side === 'left'
    ? item.node.panel?.expansion?.left_items?.map((atom) => atom.label) ?? []
    : item.node.panel?.expansion?.right_items?.map((atom) => atom.label) ?? [];
  if (panelItems.length > 0) return panelItems;

  const source = side === 'left' ? item.node.concepts_left : item.node.concepts_right;
  const fallback = fallbackPills(item, side);
  return (source?.length ? source : fallback).filter(Boolean);
}

function BranchRows({ items, side }: { items: string[]; side: 'left' | 'right' }) {
  return (
    <div className={`node-map-branch node-map-branch-${side}`} aria-hidden="true">
      {items.map((_, index) => (
        <span className="node-map-branch-row" key={`${side}-branch-${index}`} />
      ))}
    </div>
  );
}

export function NodeExpansionMap({ item }: { item: RoadmapNodeItem }) {
  const left = getPills(item, 'left');
  const right = getPills(item, 'right');
  const rowCount = Math.max(left.length, right.length, 1);
  const stackHeight = rowCount * 42 - 8;
  const mapStyle = { '--node-map-stack-height': `${stackHeight}px` } as CSSProperties;

  return (
    <section className="node-map" aria-label={`${item.node.name_plain} expanded subtopics`}>
      <div className="node-map-titlebar">
        <span>Selected node map</span>
        <strong>{item.node.name_plain}</strong>
      </div>

      <div className="node-map-grid" style={mapStyle}>
        <span className="node-map-cluster-label node-map-cluster-label-left">Concepts</span>
        <span className="node-map-cluster-label node-map-cluster-label-right">Applied</span>

        <div className="node-map-column node-map-column-left">
          <div className="node-map-pills node-map-pills-left">
            {left.map((pill, index) => (
              <span className="node-map-pill-slot" key={`left-${index}`}>
                <span className="node-map-pill node-map-pill-left" title={pill}>
                  {pill}
                </span>
              </span>
            ))}
          </div>
        </div>

        <BranchRows items={left} side="left" />

        <div className="node-map-center">
          <div className="node-map-line" aria-hidden="true" />
          <div className="node-map-badge">
            <strong>{item.node.name_plain}</strong>
          </div>
        </div>

        <BranchRows items={right} side="right" />

        <div className="node-map-column node-map-column-right">
          <div className="node-map-pills node-map-pills-right">
            {right.map((pill, index) => (
              <span className="node-map-pill-slot" key={`right-${index}`}>
                <span className="node-map-pill node-map-pill-right" title={pill}>
                  {pill}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
