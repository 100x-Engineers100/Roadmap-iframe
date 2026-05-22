'use client';

import { motion } from 'framer-motion';
import type { SkillGapResult, RoleCategory } from '@/types';

interface GapViewProps {
  skillGap: SkillGapResult;
  roleCategory: RoleCategory;
  onAdvance: () => void;
}

const ROLE_DISPLAY: Record<RoleCategory, string> = {
  pm: 'Product Manager', designer: 'Designer', marketer: 'Marketer',
  sales: 'Sales Professional', engineer: 'Engineer', student: 'Student',
};

const SPRING = { type: 'spring' as const, stiffness: 240, damping: 22, bounce: 0 };

export function GapView({ skillGap, roleCategory, onAdvance }: GapViewProps) {
  const roleName = ROLE_DISPLAY[roleCategory];
  const green = skillGap.green.slice(0, 3);
  const red = skillGap.red.slice(0, 5);
  const rows = [...green, ...red];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16"
      style={{ background: 'linear-gradient(160deg, #f9f9f9 0%, #f0ece8 100%)' }}
    >
      <div className="w-full max-w-[680px]">

        {/* Step label */}
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 11,
            letterSpacing: '0.1em', color: '#ff6343', textTransform: 'uppercase',
            marginBottom: 20,
          }}
        >
          STEP 3 OF 5
        </motion.p>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700,
            fontSize: 'clamp(30px, 5vw, 42px)', color: '#1a1c1c',
            marginBottom: 14, lineHeight: 1.15,
            textWrap: 'balance',
          } as React.CSSProperties}
        >
          You&apos;re closer than you think.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          style={{
            fontFamily: 'var(--font-body)', fontSize: 17, color: '#5a413b',
            marginBottom: 40, lineHeight: 1.6,
          }}
        >
          These are the skills that change your score.
        </motion.p>

        {/* Column headers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex justify-between mb-4 px-5"
          style={{
            fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 11,
            letterSpacing: '0.08em', color: '#8e706a', textTransform: 'uppercase',
          }}
        >
          <span>YOU TODAY</span>
          <span>AI-NATIVE {roleName.toUpperCase()}</span>
        </motion.div>

        {/* Skills card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          style={{
            background: '#fff', borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
            overflow: 'hidden', marginBottom: 32,
          }}
        >
          {rows.map((skill, i) => {
            const isGreen = i < green.length;
            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.22 + i * 0.05 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 20px', height: 72,
                  borderBottom: i < rows.length - 1 ? '1px solid #f3f3f3' : 'none',
                  background: isGreen ? 'rgba(22,163,74,0.025)' : 'transparent',
                }}
              >
                {/* Skill name */}
                <div className="flex items-center gap-3">
                  {isGreen ? (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      backgroundColor: 'rgba(22,163,74,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3.5 3.5L13 5" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ) : (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      backgroundColor: 'rgba(255,99,67,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ff6343' }} />
                    </div>
                  )}
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15, color: '#1a1c1c' }}>
                    {skill.name_display}
                  </span>
                </div>

                {/* Status */}
                {isGreen ? (
                  <div className="flex items-center gap-3 shrink-0">
                    <motion.div
                      style={{ height: 5, borderRadius: 3, backgroundColor: '#16a34a' }}
                      initial={{ width: 0 }}
                      animate={{ width: 100 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 + i * 0.05 }}
                    />
                    <span style={{
                      fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11,
                      color: '#16a34a', letterSpacing: '0.05em',
                    }}>HAVE IT</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 shrink-0">
                    <div style={{ width: 100, height: 5, borderRadius: 3, backgroundColor: '#f0ede9' }} />
                    <span style={{
                      fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11,
                      letterSpacing: '0.04em', padding: '4px 10px', borderRadius: 5,
                      backgroundColor: '#fff3f0', color: '#b22c11',
                    }}>LEARN THIS</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Insight callout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22 + rows.length * 0.05 + 0.1 }}
          style={{
            padding: '18px 24px', borderRadius: 10,
            background: 'rgba(255,99,67,0.04)', border: '1px solid rgba(255,99,67,0.15)',
            marginBottom: 32,
          }}
        >
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#5a413b', lineHeight: 1.65 }}>
            <strong style={{ color: '#b22c11' }}>{red.length} skill{red.length !== 1 ? 's' : ''}</strong>{' '}
            stand between your current profile and the AI-native {roleName}.
            {' '}A focused 90-day plan closes this gap.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.22 + rows.length * 0.05 + 0.2 }}
        >
          <button
            onClick={onAdvance}
            className="w-full active:scale-[0.96]"
            style={{
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
              letterSpacing: '0.05em', backgroundColor: '#ff6343',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '20px 24px', cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(255,99,67,0.36)',
              transition: 'background-color 0.15s, box-shadow 0.2s, transform 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e8502e';
              e.currentTarget.style.boxShadow = '0 6px 28px rgba(255,99,67,0.46)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ff6343';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(255,99,67,0.36)';
            }}
          >
            SEE MY PERSONALISED ROADMAP →
          </button>
        </motion.div>
      </div>
    </div>
  );
}
