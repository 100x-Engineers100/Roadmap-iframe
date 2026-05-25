'use client';

import { DEPTH_STYLE, type RoadmapNodeItem } from './roadmapUtils';
import { NodeExpansionMap } from './NodeExpansionMap';

interface NodePanelProps {
  item: RoadmapNodeItem;
  total: number;
}

export function NodePanel({ item, total }: NodePanelProps) {
  const depth = DEPTH_STYLE[item.node.depth];

  return (
    <div className="panel-body">
      <NodeExpansionMap item={item} total={total} />

      <section className="panel-section subtopic-details">
        <div className="section-title">Subtopic details</div>
        <div className="subtopic-detail-grid">
          {item.node.subnodes.map((subnode) => (
            <article className="subtopic-detail-card" key={subnode.id}>
              <h4>{subnode.title}</h4>
              <p>{subnode.description}</p>
              <span>{subnode.outcome}</span>
              <div className="subnode-meta">
                {subnode.tools && subnode.tools.length > 0 && (
                  <div className="tool-pills">
                    {subnode.tools.map(t => <span className="tool-pill" key={t}>{t}</span>)}
                  </div>
                )}
                {subnode.time_est && (
                  <div className="time-badge">{subnode.time_est}</div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-section">
        <div className="section-title">Analogy</div>
        <div className="analogy-box">
          <p><strong>Base idea:</strong> {item.node.analogy.base}</p>
          <p><strong>In your role:</strong> {item.node.analogy.role_skin}</p>
          <p>{item.node.analogy.bridge_line}</p>
        </div>
      </section>

      <section className="panel-section panel-explanation">
        <div className="panel-section-header">
          <div>
            <div className="section-title">Explanation</div>
            <h3>{item.node.name_plain}</h3>
          </div>
          <span className="depth-pill" style={{ color: depth.color, background: depth.bg }}>
            {depth.label}
          </span>
        </div>
        <p className="panel-lede">{item.node.what_covers}</p>
        <div className="panel-outcome">
          <span>After this node</span>
          <p>{item.node.what_do_after}</p>
        </div>
      </section>

      <section className="checkpoint-box">
        <div className="section-title">Project checkpoint</div>
        <h4>{item.step.checkpoint.title}</h4>
        <p>{item.step.checkpoint.problem_statement}</p>
        <ul>
          {item.step.checkpoint.concepts.map((concept) => (
            <li key={concept}>{concept}</li>
          ))}
        </ul>
        <span>{item.step.checkpoint.done_criteria}</span>
      </section>
    </div>
  );
}
