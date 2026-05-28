'use client';

import type { JourneyAnalogy } from '@/types';
import { DEPTH_STYLE, type RoadmapNodeItem } from './roadmapUtils';
import { NodeExpansionMap } from './NodeExpansionMap';

interface NodePanelProps {
  item: RoadmapNodeItem;
  total: number;
  journeyAnalogy?: JourneyAnalogy;
}

export function NodePanel({ item, total, journeyAnalogy }: NodePanelProps) {
  const depth = DEPTH_STYLE[item.node.depth];
  const leftAtoms = item.node.panel?.expansion?.left_items ?? [];
  const rightAtoms = item.node.panel?.expansion?.right_items ?? [];
  const atoms = [...leftAtoms, ...rightAtoms].sort((a, b) => a.order - b.order);
  const checkpoint = item.node.panel?.checkpoint;

  return (
    <div className="panel-body">
      <NodeExpansionMap item={item} total={total} />

      <section className="panel-section subtopic-details">
        <div className="section-title">Node atoms</div>
        <div className="subtopic-detail-grid">
          {atoms.map((atom) => (
            <article className="subtopic-detail-card" key={atom.id}>
              <h4>{atom.order}. {atom.label}</h4>
              <p>{atom.explanation}</p>
              <p>{atom.learner_action}</p>
              <span>{atom.output}</span>
              <div className="subnode-meta">
                <div className="tool-pills">
                  <span className="tool-pill">{atom.depth_level}</span>
                </div>
                {atom.tools && atom.tools.length > 0 && (
                  <div className="tool-pills">
                    {atom.tools.map(t => <span className="tool-pill" key={t}>{t}</span>)}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {journeyAnalogy && (
        <section className="panel-section">
          <div className="section-title">Your journey</div>
          <div className="analogy-box">
            <p><strong>{journeyAnalogy.frame}</strong></p>
            <p>Phase 1 — {journeyAnalogy.phase_1_meaning}</p>
            <p>Phase 2 — {journeyAnalogy.phase_2_meaning}</p>
            <p>Phase 3 — {journeyAnalogy.phase_3_meaning}</p>
          </div>
        </section>
      )}

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
        {checkpoint ? (
          <>
            <h4>{checkpoint.title}</h4>
            <p>{checkpoint.scenario}</p>
            <p><strong>Artifact:</strong> {checkpoint.artifact_to_create}</p>
            <ul>
              {checkpoint.steps.map((step, index) => (
                <li key={`${checkpoint.title}-${index}`}>{step}</li>
              ))}
            </ul>
            <ul>
              {checkpoint.done_when.map((criterion, index) => (
                <li key={`done-${index}`}>{criterion}</li>
              ))}
            </ul>
            {checkpoint.confidence_check && (
              <p><strong>Confidence check:</strong> {checkpoint.confidence_check}</p>
            )}
          </>
        ) : (
          <>
            <h4>{item.step.checkpoint.title}</h4>
            <p>{item.step.checkpoint.problem_statement}</p>
            <ul>
              {item.step.checkpoint.concepts.map((concept) => (
                <li key={concept}>{concept}</li>
              ))}
            </ul>
            <span>{item.step.checkpoint.done_criteria}</span>
          </>
        )}
      </section>
    </div>
  );
}
