'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { ProgressDots } from '@/components/ui/ProgressDots';
import type { OnetTask, TaskWeight } from '@/types';

interface TaskSliderProps {
  task: OnetTask;
  value: TaskWeight;
  onChange: (id: string, weight: TaskWeight) => void;
}

const WEIGHT_MAP: Record<number, TaskWeight> = { 0: 'low', 1: 'medium', 2: 'high' };
const IDX_MAP: Record<TaskWeight, number> = { low: 0, medium: 1, high: 2 };

function TaskSliderItem({ task, value, onChange }: TaskSliderProps) {
  const idx = IDX_MAP[value];
  const fillPct = idx * 50; // 0%, 50%, 100%

  return (
    <div
      className="flex flex-col gap-3 py-6"
      style={{ borderBottom: '1px solid #e2e2e2' }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          fontWeight: 500,
          color: '#1a1c1c',
          lineHeight: 1.4,
        }}
      >
        {task.description}
      </span>

      {/* Slider track */}
      <div className="relative" style={{ paddingTop: 12, paddingBottom: 4 }}>
        {/* Visual: track + fill + thumb */}
        <div
          className="relative pointer-events-none rounded-full"
          style={{ height: 4, background: '#e2e2e2' }}
        >
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ background: '#b22c11' }}
            animate={{ width: `${fillPct}%` }}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{
              width: 20,
              height: 20,
              border: '2px solid #b22c11',
              marginLeft: -10,
            }}
            animate={{ left: `${fillPct}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>

        {/* Invisible range input for interaction */}
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={idx}
          onChange={(e) => onChange(task.id, WEIGHT_MAP[parseInt(e.target.value, 10)])}
          aria-label={`Weight for: ${task.description}`}
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
          style={{ height: '100%' }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        {(['LOW', 'MED', 'HIGH'] as const).map((label, i) => (
          <span
            key={label}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.05em',
              color: i === idx ? '#b22c11' : '#5a413b',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

interface Props {
  tasks: OnetTask[];
  weights: Record<string, TaskWeight>;
  onBack: () => void;
  onSubmit: (weights: Record<string, TaskWeight>) => void;
}

export function TaskSliders({ tasks, weights, onBack, onSubmit }: Props) {
  const [localWeights, setLocalWeights] = useState<Record<string, TaskWeight>>(weights);

  const handleChange = (id: string, weight: TaskWeight) => {
    setLocalWeights((prev) => ({ ...prev, [id]: weight }));
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <div className="flex-1 flex flex-col items-center px-6 pt-12 pb-28">
        <div className="w-full max-w-[560px]">
          {/* Progress dots */}
          <div className="mb-8">
            <ProgressDots total={5} current={2} />
          </div>

          {/* Back arrow */}
          <button
            onClick={onBack}
            aria-label="Go back"
            className="flex items-center gap-2 mb-6 transition-colors"
            style={{ color: '#5a413b', fontFamily: 'var(--font-body)', fontSize: 14 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1c1c')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#5a413b')}
          >
            <ArrowLeft size={16} />
          </button>

          {/* Header */}
          <p
            className="uppercase mb-6"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.05em',
              color: '#5a413b',
            }}
          >
            Step 2 of 5
          </p>
          <h1
            className="mb-4"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 40,
              fontWeight: 700,
              color: '#1a1c1c',
              lineHeight: 1.2,
            }}
          >
            How do you actually spend your time?
          </h1>
          <p
            className="mb-8"
            style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: '#5a413b' }}
          >
            Adjust these to reflect your real workday. Pre-filled from your role data.
          </p>

          {/* Task list */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          >
            {tasks.slice(0, 8).map((task) => (
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
                  onChange={handleChange}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          height: 80,
          background: 'white',
          borderTop: '1px solid #e2e2e2',
        }}
      >
        {/* Gradient mask above */}
        <div
          className="absolute -top-8 left-0 right-0 pointer-events-none"
          style={{
            height: 32,
            background: 'linear-gradient(to bottom, transparent, var(--color-bg))',
          }}
        />
        <div className="h-full flex items-center justify-center px-6">
          <motion.button
            onClick={() => onSubmit(localWeights)}
            className="w-full max-w-[560px] h-[52px] rounded-[4px]"
            style={{
              background: '#ff6343',
              color: 'white',
              fontFamily: 'var(--font-heading)',
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              transition: 'background 0.15s',
              willChange: 'transform',
            }}
            whileTap={{ scale: 0.96 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#e5432a')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ff6343')}
          >
            Analyse My Risk →
          </motion.button>
        </div>
      </div>
    </div>
  );
}
