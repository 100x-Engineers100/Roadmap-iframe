'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle, ExternalLink, Target, X } from 'lucide-react';
import type { Roadmap, RoadmapNode, RoadmapStep, RoleCategory } from '@/types';

interface Props {
  roadmap: Roadmap;
  roleCategory: RoleCategory;
  socTitle: string;
}

interface RoadmapNodeItem {
  node: RoadmapNode;
  step: RoadmapStep;
  stepNum: number;
  nodeNum: number;
}

interface Point {
  x: number;
  y: number;
}

const ROLE_DISPLAY: Record<RoleCategory, string> = {
  pm: 'Product Manager',
  designer: 'Designer',
  marketer: 'Marketer',
  sales: 'Sales Professional',
  engineer: 'Engineer',
  student: 'Student',
};

const DEPTH_STYLE: Record<RoadmapNode['depth'], { label: string; color: string; bg: string }> = {
  foundational: { label: 'Foundation', color: '#166534', bg: '#dcfce7' },
  intermediate: { label: 'Workflow', color: '#92400e', bg: '#fef3c7' },
  advanced: { label: 'Project', color: '#b22c11', bg: '#fce8e6' },
};

const DESKTOP_POINTS: Point[] = [
  { x: 120, y: 130 },
  { x: 470, y: 130 },
  { x: 820, y: 150 },
  { x: 820, y: 380 },
  { x: 470, y: 400 },
  { x: 120, y: 420 },
  { x: 120, y: 650 },
  { x: 470, y: 650 },
  { x: 820, y: 650 },
];

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

function useIsMobile(): boolean {
  return useSyncExternalStore(subscribeToResize, getMobileSnapshot, getServerMobileSnapshot);
}

function getRoadmapItems(roadmap: Roadmap): RoadmapNodeItem[] {
  const steps = [roadmap.step1, roadmap.step2, roadmap.step3];
  let nodeNum = 0;
  return steps.flatMap((step, stepIndex) =>
    step.nodes.map((node) => {
      nodeNum += 1;
      return { node, step, stepNum: stepIndex + 1, nodeNum };
    })
  );
}

function getMobilePoints(total: number): Point[] {
  return Array.from({ length: total }, (_, index) => ({
    x: MOBILE_X,
    y: MOBILE_START_Y + index * MOBILE_GAP,
  }));
}

function buildPath(points: Point[]): string {
  if (points.length < 2) return '';
  const [first, ...rest] = points;
  return rest.reduce((path, point, index) => {
    const prev = points[index];
    const midX = (prev.x + point.x) / 2;
    return `${path} C ${midX} ${prev.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${first.x} ${first.y}`);
}

function getCanvasHeight(points: Point[]): number {
  const last = points[points.length - 1];
  return Math.max(760, last ? last.y + 150 : 760);
}

function getTileSide(index: number, isMobile: boolean): 'right' | 'left' {
  if (isMobile) return 'right';
  return index % 2 === 0 ? 'right' : 'left';
}

function NodeTile({
  item,
  point,
  index,
  isActive,
  isMobile,
  onOpen,
}: {
  item: RoadmapNodeItem;
  point: Point;
  index: number;
  isActive: boolean;
  isMobile: boolean;
  onOpen: () => void;
}) {
  const side = getTileSide(index, isMobile);
  const tileLeft = isMobile ? point.x + 32 : side === 'right' ? point.x + 22 : point.x - 246;
  const tileTop = isMobile ? point.y - 35 : point.y - 38;
  const dotSize = isMobile ? 32 : 38;

  return (
    <button
      type="button"
      className="roadmap-node"
      onClick={onOpen}
      style={{
        left: 0,
        top: 0,
        width: isMobile ? '100%' : 1000,
        height: 1,
      }}
      aria-label={`Open ${item.node.name_plain}`}
    >
      <span
        className={isActive ? 'roadmap-dot roadmap-dot-active' : 'roadmap-dot'}
        style={{
          left: point.x - dotSize / 2,
          top: point.y - dotSize / 2,
          width: dotSize,
          height: dotSize,
        }}
      >
        <span>{item.nodeNum}</span>
      </span>
      <span
        className={isActive ? 'roadmap-tile roadmap-tile-active' : 'roadmap-tile'}
        style={{
          left: tileLeft,
          top: tileTop,
        }}
      >
        <span className="roadmap-tile-copy">
          <strong>{item.node.name_plain}</strong>
          <small>{item.node.one_line_desc}</small>
        </span>
        <span className="roadmap-tile-date">
          <strong>{item.stepNum}</strong>
          <small>PHASE</small>
        </span>
      </span>
    </button>
  );
}

function SubnodeSpine({ node }: { node: RoadmapNode }) {
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

function NodePanel({
  item,
  total,
}: {
  item: RoadmapNodeItem;
  total: number;
}) {
  const depth = DEPTH_STYLE[item.node.depth];

  return (
    <div className="panel-body">
      <div className="panel-kicker">Node {item.nodeNum} of {total} / Phase {item.stepNum}</div>
      <h3>{item.node.name_plain}</h3>
      <span className="depth-pill" style={{ color: depth.color, background: depth.bg }}>
        {depth.label}
      </span>
      <p className="panel-lede">{item.node.what_covers}</p>

      <section className="panel-section">
        <div className="section-title">
          <Target size={14} />
          What you can do after
        </div>
        <p>{item.node.what_do_after}</p>
      </section>

      <section className="panel-section">
        <div className="section-title">
          <CheckCircle size={14} />
          Node spine
        </div>
        <SubnodeSpine node={item.node} />
      </section>

      <section className="panel-section">
        <div className="section-title">Static explanation</div>
        <div className="analogy-box">
          <p><strong>Base idea:</strong> {item.node.analogy.base}</p>
          <p><strong>In your role:</strong> {item.node.analogy.role_skin}</p>
          <p>{item.node.analogy.bridge_line}</p>
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

export function RoadmapView({ roadmap, roleCategory, socTitle }: Props) {
  const [selected, setSelected] = useState<RoadmapNodeItem | null>(null);
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const roleName = ROLE_DISPLAY[roleCategory];
  const items = useMemo(() => getRoadmapItems(roadmap), [roadmap]);
  const points = isMobile ? getMobilePoints(items.length) : DESKTOP_POINTS.slice(0, items.length);
  const path = buildPath(points);
  const canvasHeight = getCanvasHeight(points);

  return (
    <div className="roadmap-page">
      <style>{`
        .roadmap-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 18% 10%, rgba(255, 99, 67, 0.08), transparent 22%),
            linear-gradient(90deg, rgba(178, 44, 17, 0.045) 1px, transparent 1px),
            linear-gradient(0deg, rgba(178, 44, 17, 0.045) 1px, transparent 1px),
            #fbf9f8;
          background-size: auto, 44px 44px, 44px 44px, auto;
          color: #1a1c1c;
        }
        .roadmap-topbar {
          position: sticky;
          top: 0;
          z-index: 40;
          min-height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 12px 28px;
          background: rgba(255, 255, 255, 0.9);
          border-bottom: 1px solid #e2e2e2;
          backdrop-filter: blur(12px);
        }
        .roadmap-title h2 {
          margin: 0;
          font-family: var(--font-heading);
          font-size: 21px;
          line-height: 1.15;
        }
        .roadmap-title p {
          margin: 4px 0 0;
          font-size: 12px;
          color: #5a413b;
        }
        .roadmap-cta {
          display: inline-flex;
          min-height: 40px;
          align-items: center;
          gap: 8px;
          border: 1.5px solid #b22c11;
          border-radius: 4px;
          padding: 0 14px;
          color: #b22c11;
          font-family: var(--font-heading);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-decoration: none;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .roadmap-shell {
          max-width: 1120px;
          margin: 0 auto;
          padding: 38px 24px 120px;
        }
        .roadmap-heading {
          text-align: center;
          margin-bottom: 18px;
        }
        .roadmap-heading span {
          display: inline-flex;
          border: 1px solid #e2e2e2;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          padding: 8px 22px;
          color: #8e706a;
          font-family: var(--font-heading);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .roadmap-heading h1 {
          margin: 18px auto 0;
          max-width: 820px;
          font-family: var(--font-heading);
          font-size: clamp(34px, 5vw, 58px);
          line-height: 1;
        }
        .roadmap-heading strong {
          color: #ff6343;
        }
        .roadmap-canvas {
          position: relative;
          max-width: 1000px;
          margin: 0 auto;
        }
        .roadmap-path {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
          pointer-events: none;
        }
        .roadmap-path-stroke {
          stroke: rgba(26, 28, 28, 0.42);
          stroke-width: 2;
          stroke-dasharray: 12 12;
          stroke-linecap: round;
          fill: none;
        }
        .roadmap-node {
          position: absolute;
          border: 0;
          padding: 0;
          background: transparent;
          cursor: pointer;
          text-align: left;
        }
        .roadmap-dot {
          position: absolute;
          z-index: 3;
          display: grid;
          place-items: center;
          border-radius: 999px;
          border: 3px solid #fbf9f8;
          background: #ff6343;
          box-shadow: 0 0 0 20px rgba(255, 99, 67, 0.12), 0 7px 18px rgba(178, 44, 17, 0.22);
          color: #ffffff;
          font-family: var(--font-heading);
          font-size: 12px;
          font-weight: 700;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .roadmap-dot-active {
          transform: scale(1.12);
          box-shadow: 0 0 0 24px rgba(255, 99, 67, 0.18), 0 9px 22px rgba(178, 44, 17, 0.28);
        }
        .roadmap-tile {
          position: absolute;
          z-index: 2;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 58px;
          width: 224px;
          min-height: 74px;
          overflow: hidden;
          border: 1px solid rgba(226, 226, 226, 0.9);
          border-radius: 6px;
          background: rgba(245, 243, 243, 0.92);
          box-shadow: 0 10px 24px rgba(26, 28, 28, 0.05);
          transition: border-color 180ms ease, transform 180ms ease, background 180ms ease;
        }
        .roadmap-node:hover .roadmap-tile,
        .roadmap-tile-active {
          border-color: rgba(178, 44, 17, 0.35);
          background: #ffffff;
          transform: translateY(-2px);
        }
        .roadmap-tile-copy {
          display: flex;
          min-width: 0;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
          padding: 12px 12px;
        }
        .roadmap-tile-copy strong {
          font-family: var(--font-heading);
          font-size: 13px;
          line-height: 1.2;
          color: #1a1c1c;
        }
        .roadmap-tile-copy small {
          display: -webkit-box;
          overflow: hidden;
          color: #5a413b;
          font-size: 11px;
          line-height: 1.25;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .roadmap-tile-date {
          display: grid;
          place-items: center;
          border-left: 1px solid #d6d1cf;
          color: #1a1c1c;
          font-family: var(--font-heading);
          text-align: center;
        }
        .roadmap-tile-date strong {
          font-size: 20px;
          line-height: 1;
        }
        .roadmap-tile-date small {
          font-size: 9px;
          letter-spacing: 0.16em;
        }
        .roadmap-backdrop {
          position: fixed;
          inset: 68px 0 0;
          z-index: 50;
          background: rgba(26, 28, 28, 0.16);
          backdrop-filter: blur(3px);
        }
        .roadmap-panel {
          position: fixed;
          top: 68px;
          right: 0;
          bottom: 0;
          z-index: 60;
          width: min(520px, 48vw);
          overflow-y: auto;
          border-left: 1px solid #e2e2e2;
          background: #ffffff;
          box-shadow: -16px 0 40px rgba(26, 28, 28, 0.1);
          padding: 34px 30px 46px;
        }
        .panel-close {
          position: sticky;
          top: 0;
          margin-left: auto;
          z-index: 2;
          display: grid;
          width: 36px;
          height: 36px;
          place-items: center;
          border: 0;
          border-radius: 999px;
          background: #f3f3f3;
          color: #5a413b;
          cursor: pointer;
        }
        .panel-body {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        .panel-kicker,
        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #8e706a;
          font-family: var(--font-heading);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .panel-body h3 {
          margin: 0;
          font-family: var(--font-heading);
          font-size: 30px;
          line-height: 1.08;
        }
        .depth-pill {
          width: fit-content;
          border-radius: 999px;
          padding: 5px 10px;
          font-family: var(--font-heading);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .panel-lede,
        .panel-section p,
        .checkpoint-box p {
          margin: 0;
          color: #5a413b;
          font-size: 14px;
          line-height: 1.62;
        }
        .panel-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .subnode-spine {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding-left: 16px;
        }
        .subnode-line {
          position: absolute;
          top: 18px;
          bottom: 18px;
          left: 30px;
          width: 2px;
          background: repeating-linear-gradient(to bottom, #d7d2d0 0 8px, transparent 8px 14px);
        }
        .subnode-row {
          position: relative;
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr);
          gap: 12px;
          align-items: start;
        }
        .subnode-marker {
          z-index: 1;
          display: grid;
          width: 30px;
          height: 30px;
          place-items: center;
          border-radius: 999px;
          border: 2px solid #ffffff;
          background: #ff6343;
          color: #ffffff;
          font-family: var(--font-heading);
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 0 0 8px rgba(255, 99, 67, 0.08);
        }
        .subnode-card {
          border: 1px solid #e2e2e2;
          border-radius: 6px;
          background: #fbf9f8;
          padding: 12px 14px;
        }
        .subnode-card h4,
        .checkpoint-box h4 {
          margin: 0 0 6px;
          font-family: var(--font-heading);
          font-size: 14px;
          line-height: 1.3;
        }
        .subnode-card p {
          margin: 0 0 8px;
          color: #5a413b;
          font-size: 13px;
          line-height: 1.48;
        }
        .subnode-card span,
        .checkpoint-box span {
          display: block;
          color: #b22c11;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.45;
        }
        .analogy-box,
        .checkpoint-box {
          border: 1px solid #e2bfb7;
          border-radius: 8px;
          background: #fff8f6;
          padding: 15px;
        }
        .analogy-box {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .checkpoint-box {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-left: 4px solid #ff6343;
        }
        .checkpoint-box ul {
          margin: 0;
          padding-left: 18px;
          color: #5a413b;
          font-size: 13px;
          line-height: 1.55;
        }
        @media (max-width: 767px) {
          .roadmap-topbar {
            align-items: flex-start;
            padding: 12px 16px;
          }
          .roadmap-title h2 {
            font-size: 17px;
          }
          .roadmap-title p {
            max-width: 210px;
          }
          .roadmap-cta {
            min-width: 40px;
            width: 40px;
            justify-content: center;
            padding: 0;
          }
          .roadmap-cta span {
            display: none;
          }
          .roadmap-shell {
            padding: 28px 16px 90px;
          }
          .roadmap-heading h1 {
            font-size: 34px;
          }
          .roadmap-canvas {
            max-width: 390px;
          }
          .roadmap-tile {
            width: calc(100vw - 96px);
            min-height: 72px;
          }
          .roadmap-panel {
            top: 0;
            width: 100vw;
            padding: 22px 20px 40px;
            border-left: 0;
          }
          .roadmap-backdrop {
            inset: 0;
          }
          .panel-body h3 {
            font-size: 26px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .roadmap-dot,
          .roadmap-tile {
            transition: none;
          }
        }
      `}</style>

      <header className="roadmap-topbar">
        <div className="roadmap-title">
          <h2>Your AI-Native {roleName} Roadmap</h2>
          <p>{socTitle}</p>
        </div>
        <a className="roadmap-cta" href="https://www.100xengineers.com/" target="_blank" rel="noopener noreferrer">
          <span>Learn how 100x trains this</span>
          <ExternalLink size={14} />
        </a>
      </header>

      <main className="roadmap-shell">
        <div className="roadmap-heading">
          <span>90-day roadmap</span>
          <h1>How your <strong>{roleName}</strong> role upgrades</h1>
        </div>

        <div className="roadmap-canvas" style={{ height: canvasHeight }}>
          <svg className="roadmap-path" viewBox={`0 0 ${isMobile ? 390 : 1000} ${canvasHeight}`} aria-hidden="true">
            <path className="roadmap-path-stroke" d={path} />
          </svg>

          {items.map((item, index) => (
            <NodeTile
              key={item.node.id}
              item={item}
              point={points[index]}
              index={index}
              isActive={selected?.node.id === item.node.id}
              isMobile={isMobile}
              onOpen={() => setSelected(item)}
            />
          ))}
        </div>
      </main>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className="roadmap-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
              onClick={() => setSelected(null)}
            />
            <motion.aside
              className="roadmap-panel"
              initial={isMobile ? { y: '100%' } : { x: '100%' }}
              animate={isMobile ? { y: 0 } : { x: 0 }}
              exit={isMobile ? { y: '100%' } : { x: '100%' }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
              aria-modal="true"
              role="dialog"
            >
              <button className="panel-close" type="button" aria-label="Close panel" onClick={() => setSelected(null)}>
                <X size={17} />
              </button>
              <NodePanel item={selected} total={items.length} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
