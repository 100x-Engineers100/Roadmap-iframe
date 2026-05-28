'use client';

import { motion } from 'framer-motion';
import { FunnelShell, funnelStyles } from '@/components/screens/FunnelShell';
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
  const red = skillGap.red.slice(0, 6);

  return (
    <FunnelShell
      current={4}
      stepLabel="Step 4 of 5"
      title="You are closer than you think."
      subtitle="These are the AI-native skills that change your score and become the backbone of the 90-day roadmap."
      width="wide"
      surface={false}
    >
      <div className="mx-auto w-full max-w-[940px]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 112px minmax(0, 1fr)',
            gap: 20,
            alignItems: 'stretch',
            marginBottom: 22,
          }}
        >
          <div style={{
            border: '1px solid rgba(22, 163, 74, 0.2)',
            borderRadius: 22,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(240,253,244,0.45))',
            boxShadow: '4px 4px 0 rgba(187, 247, 208, 0.34), 0 18px 38px rgba(26, 28, 28, 0.045)',
            padding: 22,
          }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 900, letterSpacing: '0.08em', color: '#15803d', textTransform: 'uppercase', marginBottom: 16 }}>
              You today
            </p>
            <div className="grid gap-3">
              {green.map((skill, i) => (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.22 + i * 0.05 }}
                style={{
                  display: 'flex',
                  minHeight: 48,
                  alignItems: 'center',
                  gap: 12,
                  border: '1px solid rgba(22, 163, 74, 0.14)',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.72)',
                  padding: '10px 12px',
                }}
              >
                <span style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', color: '#16a34a', flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#1a1c1c' }}>{skill.name}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#5a7a61', lineHeight: 1.4 }}>{skill.can_do}</span>
                </span>
              </motion.div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', placeItems: 'center', alignSelf: 'stretch' }}>
            <div style={{ position: 'relative', width: 72, height: '100%', minHeight: 250, display: 'grid', placeItems: 'center' }}>
              <span style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, background: 'linear-gradient(180deg, #16a34a, #ff6343)', transform: 'translateX(-50%)' }} />
              <span style={{
                position: 'relative',
                display: 'grid',
                placeItems: 'center',
                width: 72,
                height: 72,
                borderRadius: '50%',
                border: '1px solid rgba(226, 191, 183, 0.9)',
                background: '#fffdfc',
                boxShadow: '0 0 0 8px rgba(255, 99, 67, 0.08), 0 18px 32px rgba(26, 28, 28, 0.08)',
                color: '#ff6343',
                fontFamily: 'var(--font-heading)',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.06em',
                textAlign: 'center',
                textTransform: 'uppercase',
              }}>
                90 day
              </span>
            </div>
          </div>

          <div style={{
            border: '1px solid rgba(255, 99, 67, 0.22)',
            borderRadius: 22,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,243,240,0.7))',
            boxShadow: '4px 4px 0 rgba(226, 191, 183, 0.3), 0 18px 38px rgba(26, 28, 28, 0.045)',
            padding: 22,
          }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 900, letterSpacing: '0.08em', color: '#ff6343', textTransform: 'uppercase', marginBottom: 16 }}>
              AI-native {roleName}
            </p>
            <div className="grid gap-3">
              {red.map((skill, i) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.22 + i * 0.05 }}
                  style={{
                    display: 'flex',
                    minHeight: 48,
                    alignItems: 'center',
                    gap: 12,
                    border: '1px solid rgba(255, 99, 67, 0.16)',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.72)',
                    padding: '10px 12px',
                  }}
                >
                  <span style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,99,67,0.1)', flexShrink: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6343' }} />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#1a1c1c' }}>{skill.name}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#8e6a5a', lineHeight: 1.4 }}>{skill.can_do}</span>
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          style={{
            maxWidth: 680,
            margin: '0 auto 22px',
            textAlign: 'center',
            padding: '16px 22px', borderRadius: 16,
            background: 'rgba(255,99,67,0.04)', border: '1px solid rgba(255,99,67,0.15)',
          }}
        >
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#5a413b', lineHeight: 1.65 }}>
            <strong style={{ color: '#ff6343' }}>{red.length} skill area{red.length !== 1 ? 's' : ''}</strong>{' '}
            stand between your current profile and the AI-native {roleName}.
            {' '}A focused 90-day plan closes this gap.
          </p>
        </motion.div>

        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.55 }}
        >
          <button
            onClick={onAdvance}
            className={funnelStyles.primaryButton}
            type="button"
          >
            SEE MY PERSONALISED ROADMAP →
          </button>
        </motion.div>
      </div>
    </FunnelShell>
  );
}
