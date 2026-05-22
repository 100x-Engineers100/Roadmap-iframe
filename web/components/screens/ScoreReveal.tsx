'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountUp } from '@/hooks/useCountUp';
import type { ScoreBand, RoleCategory } from '@/types';

interface ScoreRevealProps {
  score: number;
  band: ScoreBand;
  roleCategory: RoleCategory;
  fallbackUsed: boolean;
  onAdvance: () => void;
}

const BAND: Record<ScoreBand, { color: string; bg: string; textColor: string; label: string; glow: string }> = {
  LOW:      { color: '#16a34a', bg: '#dcfce7', textColor: '#16a34a', label: 'LOW RISK',      glow: 'rgba(22,163,74,0.20)' },
  MODERATE: { color: '#d97706', bg: '#fef3c7', textColor: '#d97706', label: 'MODERATE RISK', glow: 'rgba(217,119,6,0.20)' },
  HIGH:     { color: '#ff6343', bg: '#fff3f0', textColor: '#ff6343', label: 'HIGH RISK',      glow: 'rgba(255,99,67,0.20)' },
  CRITICAL: { color: '#b22c11', bg: '#fce8e6', textColor: '#b22c11', label: 'CRITICAL RISK', glow: 'rgba(178,44,17,0.22)' },
};

const ROLE_DISPLAY: Record<RoleCategory, string> = {
  pm: 'Product Manager', designer: 'Designer', marketer: 'Marketer',
  sales: 'Sales Professional', engineer: 'Engineer', student: 'Student',
};

const ROLE_COPY: Record<RoleCategory, [string, string]> = {
  pm:       ['AI can now draft PRDs, write user stories, and run retrospectives.', 'But strategy, stakeholder trust, and judgment? Still yours.'],
  designer: ['AI generates layouts, assets, and variations in seconds.', 'The AI-native designer directs the machine and owns the brief.'],
  marketer: ['AI writes copy, runs A/B tests, and segments audiences automatically.', 'Performance instincts and brand judgment remain your edge.'],
  sales:    ["AI handles outreach, scoring, and follow-up sequences autonomously.", "Consultative selling and relationship building can't be scripted."],
  engineer: ['AI writes, reviews, and deploys code at junior-to-mid level today.', 'System thinking, architecture, and AI-native tooling define the new floor.'],
  student:  ["AI accelerates learning but replaces entry-level tasks you'd grow from.", 'Becoming AI-native before graduation is no longer optional.'],
};

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

const ARC_SIZE = 220;
const R = 96;
const CX = ARC_SIZE / 2;
const CY = ARC_SIZE / 2;
const ARC_START = -135;
const ARC_END = 135;
const ARC_SWEEP = 270;
// Correct: use actual arc path length (not full circumference)
const PATH_LENGTH = 2 * Math.PI * R * (ARC_SWEEP / 360);

const SPRING = { type: 'spring' as const, stiffness: 240, damping: 22, bounce: 0 };

export function ScoreReveal({ score, band, roleCategory, fallbackUsed, onAdvance }: ScoreRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const [countEnabled, setCountEnabled] = useState(false);
  const displayed = useCountUp(score, 2200, countEnabled);
  const b = BAND[band];
  const [line1, line2] = ROLE_COPY[roleCategory];
  const roleName = ROLE_DISPLAY[roleCategory];
  const countDone = displayed >= score;

  useEffect(() => {
    // Cinematic: dark curtain first, then reveal content, then count
    const t1 = setTimeout(() => setRevealed(true), 350);
    const t2 = setTimeout(() => setCountEnabled(true), 950);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <>
      {/* Cinematic dark curtain — fades out to reveal */}
      <AnimatePresence>
        {!revealed && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'fixed', inset: 0, backgroundColor: '#1a1c1c', zIndex: 100, pointerEvents: 'none' }}
          />
        )}
      </AnimatePresence>

      <div
        className="min-h-screen flex items-center justify-center px-6 py-12"
        style={{ background: 'linear-gradient(160deg, #f9f9f9 0%, #f0ece8 100%)' }}
      >
        {/* Subtle noise texture */}
        <div
          aria-hidden
          style={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        <div className="w-full max-w-[540px] relative z-10">

          {/* Arc gauge — explodes in */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, scale: 0.65 }}
            animate={{ opacity: revealed ? 1 : 0, scale: revealed ? 1 : 0.65 }}
            transition={{ ...SPRING, delay: 0.05 }}
          >
            <div style={{ position: 'relative', width: ARC_SIZE, height: ARC_SIZE }}>
              <svg width={ARC_SIZE} height={ARC_SIZE} style={{ overflow: 'visible' }}>
                <defs>
                  <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="7" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Track */}
                <path
                  d={describeArc(CX, CY, R, ARC_START, ARC_END)}
                  fill="none"
                  stroke="#e2e2e2"
                  strokeWidth={12}
                  strokeLinecap="round"
                />
                {/* Fill arc — FIXED: PATH_LENGTH = actual arc length, not full circle */}
                <motion.path
                  d={describeArc(CX, CY, R, ARC_START, ARC_END)}
                  fill="none"
                  stroke={b.color}
                  strokeWidth={12}
                  strokeLinecap="round"
                  filter="url(#arcGlow)"
                  strokeDasharray={PATH_LENGTH}
                  initial={{ strokeDashoffset: PATH_LENGTH }}
                  animate={{
                    strokeDashoffset: countDone
                      ? PATH_LENGTH * (1 - score / 100)
                      : PATH_LENGTH,
                  }}
                  transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                />
              </svg>

              {/* Score number inside arc */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                  <span style={{
                    fontFamily: 'var(--font-heading)', fontWeight: 700,
                    fontSize: 68, lineHeight: 1, color: b.color,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {displayed}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-heading)', fontWeight: 700,
                    fontSize: 34, lineHeight: 1.25, color: b.color,
                  }}>
                    %
                  </span>
                </div>
                {fallbackUsed && (
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#8e706a', marginTop: 4 }}>
                    estimated
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Band badge — spring pop */}
          <motion.div
            className="flex justify-center mb-7"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: countDone ? 1 : 0, scale: countDone ? 1 : 0.5 }}
            transition={{ ...SPRING, delay: 0.08 }}
          >
            <span style={{
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13,
              letterSpacing: '0.08em', padding: '7px 20px', borderRadius: 5,
              backgroundColor: b.bg, color: b.textColor,
              boxShadow: `0 0 0 1.5px ${b.color}44, 0 6px 20px ${b.glow}`,
            }}>
              {b.label}
            </span>
          </motion.div>

          {/* Role insight — staggered lines */}
          <motion.div
            className="text-center mb-8 px-2"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: countDone ? 1 : 0, y: countDone ? 0 : 14 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
          >
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: '#1a1c1c', lineHeight: 1.7, marginBottom: 6 }}>
              {line1}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: '#1a1c1c', lineHeight: 1.7 }}>
              {line2}
            </p>
          </motion.div>

          {/* Stacked exposure bar */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: countDone ? 1 : 0, y: countDone ? 0 : 10 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          >
            <div style={{
              width: '100%', height: 52, borderRadius: 8,
              overflow: 'hidden', display: 'flex',
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
            }}>
              <motion.div
                style={{ height: '100%', backgroundColor: b.color, flexShrink: 0 }}
                initial={{ width: '0%' }}
                animate={{ width: countDone ? `${score}%` : '0%' }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
              />
              <div style={{ flex: 1, height: '100%', backgroundColor: '#e2bfb7' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#5a413b', fontVariantNumeric: 'tabular-nums' }}>
                Exposed to AI ({score}%)
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#5a413b', fontVariantNumeric: 'tabular-nums' }}>
                Resilient ({100 - score}%)
              </span>
            </div>
          </motion.div>

          {/* Framing copy */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: countDone ? 1 : 0, y: countDone ? 0 : 10 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.58 }}
            style={{
              textAlign: 'center', marginBottom: 32, padding: '24px 28px',
              borderRadius: 10, border: '1px solid #e8e2df',
              background: '#ffffff',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)',
            }}
          >
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: '#5a413b', fontStyle: 'italic', lineHeight: 1.8 }}>
              But here&apos;s what most risk calculators don&apos;t show you.<br />
              The AI-Native{' '}
              <strong style={{ fontStyle: 'normal', color: b.color }}>{roleName}</strong>{' '}
              is a different job.<br />
              One that&apos;s not at risk — it&apos;s in demand.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: countDone ? 1 : 0, y: countDone ? 0 : 14 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.74 }}
          >
            <button
              onClick={onAdvance}
              className="w-full active:scale-[0.96]"
              style={{
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
                letterSpacing: '0.05em', backgroundColor: '#ff6343',
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '20px 24px', cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(255,99,67,0.38)',
                transition: 'background-color 0.15s, box-shadow 0.2s, transform 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e8502e';
                e.currentTarget.style.boxShadow = '0 6px 28px rgba(255,99,67,0.48)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ff6343';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(255,99,67,0.38)';
              }}
            >
              SEE WHAT THAT ROLE LOOKS LIKE →
            </button>
          </motion.div>

        </div>
      </div>
    </>
  );
}
