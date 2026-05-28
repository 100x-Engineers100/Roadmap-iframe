'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { FunnelShell, funnelStyles } from '@/components/screens/FunnelShell';
import { getDisplayTasks } from '@/lib/api/onet-utils.mjs';
import type { AiFamiliarity, OnetTask, TaskWeight } from '@/types';

const WEIGHT_MAP: Record<number, TaskWeight> = { 0: 'low', 1: 'medium', 2: 'high' };
const IDX_MAP: Record<TaskWeight, number> = { low: 0, medium: 1, high: 2 };

// Q2: label → cluster IDs confirmed
const AI_SKILLS: { label: string; clusterIds: string[] }[] = [
  { label: 'Write and manage AI prompts for consistent output', clusterIds: ['C2A'] },
  { label: 'Connect AI to existing software or workflows', clusterIds: ['C2B'] },
  { label: 'Build knowledge bases or AI search from documents', clusterIds: ['C2C'] },
  { label: 'Build autonomous AI agents or automations', clusterIds: ['C3A', 'C3B'] },
  { label: 'Create AI-generated images, video, or brand content', clusterIds: ['C1A'] },
];

const Q1_OPTIONS: { value: AiFamiliarity; label: string }[] = [
  { value: 'none', label: "Not yet — I'm getting started" },
  { value: 'basic', label: '1–6 months — using tools like ChatGPT' },
  { value: 'intermediate', label: '6+ months — building AI into my work' },
  { value: 'advanced', label: '1+ year — building AI systems or agents' },
];

// ── Shared style tokens ──────────────────────────────────────────────────────

const card: CSSProperties = {
  border: '1px solid rgba(226, 191, 183, 0.78)',
  borderRadius: 8,
  background: 'rgba(255, 255, 255, 0.86)',
  boxShadow: '2px 2px 0 rgba(226, 191, 183, 0.3)',
  padding: '14px 16px',
};

const sectionLabel: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#ff6343',
  marginBottom: 10,
};

const questionLabel: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: '#1a1c1c',
  marginBottom: 10,
};

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  cursor: 'pointer',
};

const controlStyle: CSSProperties = {
  accentColor: '#ff6343',
  width: 16,
  height: 16,
  flexShrink: 0,
  cursor: 'pointer',
};

const bodyText = (muted = false): CSSProperties => ({
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: muted ? '#5a413b' : '#1a1c1c',
});

// ── TaskSliderItem ───────────────────────────────────────────────────────────

function TaskSliderItem({ task, value, onChange }: {
  task: OnetTask;
  value: TaskWeight;
  onChange: (id: string, weight: TaskWeight) => void;
}) {
  const idx = IDX_MAP[value];
  const fillPct = idx * 50;

  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: '#1a1c1c', lineHeight: 1.4 }}>
        {task.description}
      </span>

      <div style={{ position: 'relative', paddingTop: 7 }}>
        <div style={{ position: 'relative', height: 5, background: '#e2e2e2', borderRadius: 9999, pointerEvents: 'none' }}>
          <motion.div
            style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: '#ff6343', borderRadius: 9999 }}
            animate={{ width: `${fillPct}%` }}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            style={{ position: 'absolute', top: '50%', translateY: '-50%', width: 20, height: 20, borderRadius: 9999, border: '2px solid #ff6343', background: '#fff', marginLeft: -9 }}
            animate={{ left: `${fillPct}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>
        <input
          type="range"
          min={0} max={2} step={1}
          value={idx}
          onChange={(e) => onChange(task.id, WEIGHT_MAP[parseInt(e.target.value, 10)])}
          aria-label={`Weight for: ${task.description}`}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {(['LOW', 'MED', 'HIGH'] as const).map((label, i) => (
          <span key={label} style={{ fontFamily: 'var(--font-heading)', fontSize: 10, fontWeight: 500, letterSpacing: '0.05em', color: i === idx ? '#ff6343' : '#5a413b', textTransform: 'uppercase' }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  tasks: OnetTask[];
  weights: Record<string, TaskWeight>;
  onBack: () => void;
  onSubmit: (weights: Record<string, TaskWeight>, confirmedClusterIds: string[], aiFamiliarity: AiFamiliarity) => void;
}

export function TaskSliders({ tasks, weights, onBack, onSubmit }: Props) {
  const [localWeights, setLocalWeights] = useState<Record<string, TaskWeight>>(weights);
  const [aiFamiliarity, setAiFamiliarity] = useState<AiFamiliarity>('none');
  const [confirmedClusterIds, setConfirmedClusterIds] = useState<string[]>([]);

  const displayTasks = getDisplayTasks(tasks);

  function toggleCluster(clusterIds: string[]) {
    setConfirmedClusterIds(prev => {
      const allPresent = clusterIds.every(id => prev.includes(id));
      if (allPresent) return prev.filter(id => !clusterIds.includes(id));
      return [...new Set([...prev, ...clusterIds])];
    });
  }

  return (
    <FunnelShell
      current={2}
      stepLabel="Step 2 of 5"
      title="How do you actually spend your time?"
      subtitle="Share your AI background and calibrate task weights to match your real workday."
      onBack={onBack}
      width="wide"
      surface={false}
      footer={(
        <button
          type="button"
          onClick={() => onSubmit(localWeights, confirmedClusterIds, aiFamiliarity)}
          className={funnelStyles.primaryButton}
        >
          Analyse my risk →
        </button>
      )}
    >
      {/* ── Section: AI profile ── */}
      <p style={sectionLabel}>Your AI profile</p>

      {/* Q1 — familiarity radio */}
      <div style={card}>
        <p style={questionLabel}>How long have you been using AI at work?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Q1_OPTIONS.map(({ value, label }) => (
            <label key={value} style={rowStyle}>
              <input
                type="radio"
                name="aiFamiliarity"
                value={value}
                checked={aiFamiliarity === value}
                onChange={() => setAiFamiliarity(value)}
                style={controlStyle}
              />
              <span style={bodyText()}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Q2 — confirmed clusters checkboxes */}
      <div style={{ ...card, marginTop: 12 }}>
        <p style={questionLabel}>
          Which of these have you done at work?{' '}
          <span style={{ color: '#5a413b', fontWeight: 400 }}>(select all that apply)</span>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {AI_SKILLS.map(({ label, clusterIds }) => {
            const checked = clusterIds.every(id => confirmedClusterIds.includes(id));
            return (
              <label key={label} style={rowStyle}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCluster(clusterIds)}
                  style={controlStyle}
                />
                <span style={bodyText()}>{label}</span>
              </label>
            );
          })}
          <label style={rowStyle}>
            <input
              type="checkbox"
              checked={confirmedClusterIds.length === 0}
              onChange={() => setConfirmedClusterIds([])}
              style={controlStyle}
            />
            <span style={bodyText(true)}>None of the above yet</span>
          </label>
        </div>
      </div>

      {/* ── Section: Daily work ── */}
      <p style={{ ...sectionLabel, marginTop: 24 }}>Your daily work</p>

      <motion.div
        style={{ display: 'grid', gap: 12 }}
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      >
        {displayTasks.map((task) => (
          <motion.div
            key={task.id}
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 22 } },
            }}
          >
            <TaskSliderItem
              task={task}
              value={localWeights[task.id] ?? 'medium'}
              onChange={(id, w) => setLocalWeights(prev => ({ ...prev, [id]: w }))}
            />
          </motion.div>
        ))}
      </motion.div>
    </FunnelShell>
  );
}
