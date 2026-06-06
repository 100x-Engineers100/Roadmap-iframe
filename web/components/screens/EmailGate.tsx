'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FunnelShell } from '@/components/screens/FunnelShell';
import type { AiFamiliarity, GapInferenceResult, OnetTask, RoleCategory, ScoreBand, SkillGapResult, TaskWeight, Roadmap, UserWorkProfile } from '@/types';

interface EmailGateProps {
  roleCategory: RoleCategory;
  socCode: string;
  socTitle: string;
  riskScore: number;
  scoreBand: ScoreBand;
  tasks: OnetTask[];
  taskWeights: Record<string, TaskWeight>;
  skillGap: SkillGapResult;
  aiFamiliarity: AiFamiliarity;
  userProfile: UserWorkProfile | null;
  gapInferenceResult?: GapInferenceResult | null;
  onRoadmapReady: (roadmap: Roadmap, shareToken: string | null) => void;
}

const ROLE_DISPLAY: Record<RoleCategory, string> = {
  pm: 'Product Manager', designer: 'Designer', marketer: 'Marketer',
  sales: 'Sales Professional', engineer: 'Engineer', student: 'Student',
};

type FormStatus = 'idle' | 'loading' | 'success' | 'error' | 'generation_failed';

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-[3px] shrink-0">
      <circle cx="8" cy="8" r="7" fill="rgba(22,163,74,0.1)" />
      <path d="M5 8l2.5 2.5L11 5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EmailGate({
  roleCategory, socCode, socTitle, riskScore, scoreBand,
  tasks, taskWeights, skillGap, aiFamiliarity, userProfile, gapInferenceResult, onRoadmapReady,
}: EmailGateProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const roleName = ROLE_DISPLAY[roleCategory];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const weightOrder: Record<TaskWeight, number> = { high: 0, medium: 1, low: 2 };
      const topTasks = [...tasks]
        .sort((a, b) => weightOrder[taskWeights[a.id] ?? 'medium'] - weightOrder[taskWeights[b.id] ?? 'medium'])
        .slice(0, 4)
        .map(t => t.description);

      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), email: email.trim(),
          soc_code: socCode, soc_title: socTitle, role_category: roleCategory,
          risk_score: riskScore, score_band: scoreBand, task_weights: taskWeights,
          user_profile: userProfile,
          skill_gap: skillGap.red,
          skills_have: skillGap.green,
          top_tasks: topTasks,
          ai_familiarity: aiFamiliarity,
          gap_inference_result: gapInferenceResult ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string; code?: string; retryable?: boolean; detail?: string };
        if (data.error === 'generation_failed') {
          const error = new Error('generation_failed');
          error.name = 'RoadmapGenerationFailed';
          throw error;
        }
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { roadmap: Roadmap; shareToken?: string | null };
      setStatus('success');
      setTimeout(() => onRoadmapReady(data.roadmap, data.shareToken ?? null), 700);
    } catch (err) {
      if (err instanceof Error && (err.name === 'RoadmapGenerationFailed' || err.message === 'generation_failed')) {
        setStatus('generation_failed');
        setErrorMsg('We encountered some issue with current processing. Please try again.');
        return;
      }
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again.');
    }
  }

  return (
    <FunnelShell
      current={5}
      stepLabel="Step 5 of 5"
      title={<>Your AI-Native {roleName} roadmap is ready.</>}
      subtitle="Save the result and unlock the full roadmap with the role-specific skill sequence."
      width="compact"
    >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        >
          {/* Value bullets */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Your complete AI risk breakdown',
              'The 3 skills that reduce your score most',
              `How ${roleName}s in India are making this transition`,
            ].map((text) => (
              <li key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckIcon />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#1a1c1c', lineHeight: 1.5 }}>
                  {text}
                </span>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div style={{ height: 1, background: '#f0f0f0', margin: '0 0 22px' }} />

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(['name', 'email'] as const).map((field) => (
              <div key={field}>
                <label
                  htmlFor={field}
                  style={{
                    display: 'block', fontFamily: 'var(--font-heading)', fontWeight: 600,
                    fontSize: 11, letterSpacing: '0.07em', color: '#8e706a',
                    textTransform: 'uppercase', marginBottom: 6,
                  }}
                >
                  {field === 'name' ? 'YOUR NAME' : 'WORK EMAIL'}
                </label>
                <input
                  id={field}
                  type={field === 'email' ? 'email' : 'text'}
                  value={field === 'name' ? name : email}
                  onChange={(e) => field === 'name' ? setName(e.target.value) : setEmail(e.target.value)}
                  required
                  placeholder={field === 'name' ? 'Jane Smith' : 'jane@company.com'}
                  style={{
                    width: '100%', height: 50, padding: '0 14px',
                    fontFamily: 'var(--font-body)', fontSize: 15, color: '#1a1c1c',
                    border: '1.5px solid #e2bfb7', borderRadius: 8, outline: 'none',
                    boxSizing: 'border-box', background: '#ffffff',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#ff6343'; e.currentTarget.style.background = '#fff'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e2bfb7'; e.currentTarget.style.background = '#fff'; }}
                />
              </div>
            ))}

            {(status === 'error' || status === 'generation_failed') && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#ff6343', margin: 0 }}>
                {errorMsg}
              </p>
            )}

            <motion.button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              style={{
                height: 52, fontFamily: 'var(--font-heading)', fontWeight: 700,
                fontSize: 14, letterSpacing: '0.05em',
                backgroundColor: status === 'success' ? '#16a34a' : '#ff6343',
                color: '#fff', border: 'none', borderRadius: 999,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s, box-shadow 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: status !== 'loading' ? '0 4px 16px rgba(255,99,67,0.28)' : 'none',
                marginTop: 4, willChange: 'transform',
              }}
              whileTap={status !== 'loading' && status !== 'success' ? { scale: 0.96 } : undefined}
              onMouseEnter={(e) => {
                if (status === 'idle' || status === 'error' || status === 'generation_failed') {
                  e.currentTarget.style.backgroundColor = '#e5432a';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,99,67,0.38)';
                }
              }}
              onMouseLeave={(e) => {
                if (status !== 'success') e.currentTarget.style.backgroundColor = '#ff6343';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,99,67,0.28)';
              }}
            >
              {status === 'loading' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ animation: 'spin 0.7s linear infinite' }}>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              )}
              {status === 'loading' ? 'GENERATING YOUR ROADMAP...' : status === 'success' ? '✓ ROADMAP READY!' : status === 'generation_failed' ? 'TRY AGAIN NOW' : 'GET MY ROADMAP →'}
            </motion.button>
            {(status === 'idle' || status === 'error' || status === 'generation_failed') && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#b8a09a', textAlign: 'center', margin: '4px 0 0' }}>
                — takes ~1 minute to generate
              </p>
            )}
          </form>

          {/* Social proof */}
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 13, color: '#8e706a',
            textAlign: 'center', marginTop: 18,
          }}>
            Join professionals mapping their AI risk profile before the market forces the transition.
          </p>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 12, color: '#b8a09a',
            textAlign: 'center', marginTop: 6,
          }}>
            No spam. Unsubscribe anytime.
          </p>
        </motion.div>
    </FunnelShell>
  );
}
