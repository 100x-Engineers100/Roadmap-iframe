'use client';

import type { RoadmapNode } from '@/types';

export function SubnodeSpine({ node }: { node: RoadmapNode }) {
  return (
    <div className="subnode-spine" aria-label={`${node.name_plain} subnodes`}>
      <div className="subnode-line" />
      {node.subnodes.map((subnode, index) => (
        <div className="subnode-row" key={subnode.id}>
          <div className="subnode-marker">{index + 1}</div>
          <div className="subnode-card">
            <h4>{subnode.title}</h4>
            <p>{subnode.description}</p>
            <span>{subnode.outcome}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
