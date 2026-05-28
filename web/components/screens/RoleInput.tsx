'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FunnelShell } from '@/components/screens/FunnelShell';
import { inferRoleCategory } from '@/lib/utils/role-mapper';
import { normalizeRoleCategory } from '@/lib/profile/user-work-profile.mjs';
import type { SOCMatch, OnetTask, RoleCategory, WorkContext } from '@/types';

interface SocMatchResponse {
  primary: SOCMatch;
  alternatives: SOCMatch[];
}

const WORK_CONTEXT_OPTIONS: { value: WorkContext; label: string }[] = [
  { value: 'startup', label: 'Startup' },
  { value: 'MNC', label: 'MNC / Large enterprise' },
  { value: 'agency', label: 'Agency / Consultancy' },
  { value: 'freelance', label: 'Freelance / Independent' },
];

interface Props {
  savedInput?: string;
  savedMatch?: SOCMatch | null;
  onConfirm: (soc: SOCMatch, tasks: OnetTask[], role: RoleCategory, input: string, workContext: WorkContext) => void;
}

export function RoleInput({ savedInput = '', savedMatch = null, onConfirm }: Props) {
  const router = useRouter();
  const [input, setInput] = useState(savedInput);
  const [workContext, setWorkContext] = useState<WorkContext>('startup');
  const [isLoading, setIsLoading] = useState(false);
  const [match, setMatch] = useState<SocMatchResponse | null>(
    savedMatch ? { primary: savedMatch, alternatives: [] } : null
  );
  const [showAlts, setShowAlts] = useState(false);
  const [selectedAltCode, setSelectedAltCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!input.trim() || input.length < 3) {
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/soc-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input }),
        });
        if (!res.ok) throw new Error('Match failed');
        const data: SocMatchResponse = await res.json();
        setMatch(data);
        setSelectedAltCode('');
        setShowAlts(false);
      } catch {
        setError('Try being more specific — e.g. "Financial Analyst at a bank in India"');
        setMatch(null);
      } finally {
        setIsLoading(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input]);

  const activeSoc: SOCMatch | null = selectedAltCode
    ? (match?.alternatives.find((a) => a.soc_code === selectedAltCode) ?? null)
    : (match?.primary ?? null);

  const handleConfirm = async () => {
    if (!activeSoc) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/onet-tasks?soc=${encodeURIComponent(activeSoc.soc_code)}`);
      if (!res.ok) throw new Error('Failed to load role tasks');
      const data = await res.json() as { tasks: OnetTask[] };
      const inferredRole = inferRoleCategory(activeSoc.soc_code, activeSoc.title);
      const role = normalizeRoleCategory(inferredRole, input, activeSoc.title) as RoleCategory;
      onConfirm(activeSoc, data.tasks, role, input, workContext);
    } catch {
      setError('Failed to load role data. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const handleInputChange = (nextInput: string) => {
    setInput(nextInput);
    if (!nextInput.trim() || nextInput.length < 3) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setMatch(null);
      setError(null);
      setShowAlts(false);
      setSelectedAltCode('');
    }
  };

  return (
    <FunnelShell
      current={1}
      stepLabel="Step 1 of 5"
      title="What do you do?"
      subtitle="Be specific. Include your role, function, and industry so the risk map starts from the right work profile."
      onBack={() => router.push('/')}
      width="compact"
      surface={false}
    >
      <div className="mx-auto grid w-full max-w-[590px] gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[18px] border border-[#ead0c9] bg-[#fffdfc]"
          style={{
            padding: 14,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,248,246,0.72))',
            boxShadow: '0 1px 0 rgba(255,255,255,0.86) inset, 0 16px 36px rgba(26, 28, 28, 0.045)',
          }}
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#b89a92]"
              size={18}
              aria-hidden="true"
            />
            <input
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="E.g. Product Manager at a fintech startup"
              className={cn(
                'w-full h-[58px] rounded-[14px] border bg-white/95 py-0 pl-12 pr-5 text-base outline-none transition-[border-color,box-shadow,background-color]',
                error
                  ? 'border-[#ff6343]'
                  : 'border-[#ead0c9] focus:border-[#ff9b86] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,99,67,0.09),0_10px_22px_rgba(26,28,28,0.04)]'
              )}
              style={{
                fontFamily: 'var(--font-body)',
                color: '#1a1c1c',
                paddingLeft: 48,
                paddingRight: 20,
                boxShadow: error
                  ? '0 0 0 4px rgba(255, 99, 67, 0.08)'
                  : 'inset 0 1px 0 rgba(255, 255, 255, 0.82)',
              }}
            />
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-5 top-1/2 flex -translate-y-1/2 gap-[5px]"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="block size-[6px] rounded-full bg-[#ff6343]"
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.25 }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <p
              className="mt-3"
              style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#ff6343' }}
            >
              {error}
            </p>
          )}
        </motion.div>

        <AnimatePresence>
          {match && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="rounded-[20px] border border-[#e2bfb7] bg-[rgba(255,248,246,0.92)] p-6"
              style={{
                minHeight: 158,
                padding: '26px 28px',
                boxShadow: '5px 5px 0 rgba(226, 191, 183, 0.32), 0 20px 42px rgba(26, 28, 28, 0.055)',
              }}
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <span
                    className="inline-flex rounded-full px-3 py-1 text-xs uppercase"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      background: '#fff3f0',
                      color: '#ff6343',
                    }}
                  >
                    Matched role
                  </span>
                  <h2
                    className="mt-4"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 26,
                      fontWeight: 900,
                      lineHeight: 1.05,
                      color: '#1a1c1c',
                    }}
                  >
                    {activeSoc?.title ?? match.primary.title}
                  </h2>
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: '#5a413b',
                    }}
                  >
                    This role anchors your task exposure, score, and 90-day upgrade map.
                  </p>
                </div>
              </div>

              <div className="mt-5" style={{ paddingBottom: 10 }}>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#5a413b', marginBottom: 8 }}>
                  Where do you work?
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {WORK_CONTEXT_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setWorkContext(value)}
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 13,
                        fontWeight: workContext === value ? 600 : 400,
                        padding: '6px 14px',
                        borderRadius: 999,
                        border: workContext === value ? '1.5px solid #ff6343' : '1px solid #e2bfb7',
                        background: workContext === value ? '#fff3f0' : '#fffdfc',
                        color: workContext === value ? '#ff6343' : '#5a413b',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2.5 border-t border-[#ecd7d1]" style={{ flexWrap: 'wrap', gap: 10, marginTop: 16, paddingTop: 16 }}>
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-full px-4 transition-colors disabled:opacity-60"
                  style={{
                    background: confirming ? '#dd4d20' : '#ff6343',
                    color: 'white',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    minWidth: 112,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 6px 16px rgba(255, 99, 67, 0.16)',
                  }}
                >
                  {confirming ? (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      Loading...
                    </motion.span>
                  ) : (
                    <>
                      <Check size={14} />
                      {`That's me`}
                    </>
                  )}
                </button>

                {match.alternatives.length > 0 && (
                  <button
                    onClick={() => setShowAlts((v) => !v)}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-full px-4 transition-colors"
                    style={{
                      border: '1px solid #e2bfb7',
                      fontFamily: 'var(--font-heading)',
                      fontSize: 11,
                      fontWeight: 900,
                      color: '#5a413b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      background: '#fffdfc',
                      minWidth: 128,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Other matches
                    <ChevronDown
                      size={14}
                      className={cn('transition-transform duration-200', showAlts && 'rotate-180')}
                    />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAlts && match && !error && match.alternatives.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div
                className="rounded-[18px] border border-[#ecd7d1] bg-white"
                style={{
                  padding: '24px 30px 26px',
                  boxShadow: '3px 3px 0 rgba(226, 191, 183, 0.22)',
                }}
              >
                <p
                  className="mb-5 uppercase"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: '#5a413b',
                  }}
                >
                  Select a closer role
                </p>
                <RadioGroup
                  className="grid gap-3"
                  value={selectedAltCode}
                  onValueChange={(v: string) => setSelectedAltCode(v)}
                >
                  {match.alternatives.map((alt) => (
                    <label
                      key={alt.soc_code}
                      className="flex min-h-[54px] cursor-pointer items-center rounded-[14px] border border-[#f2ded8] bg-[#fffdfc] py-3 pr-4 transition-colors hover:bg-[#fff8f6]"
                      style={{ paddingLeft: 28, gap: 16 }}
                    >
                      <RadioGroupItem value={alt.soc_code} />
                      <span
                        className="flex min-w-0 flex-1 items-center"
                        style={{
                          gap: 12,
                          fontFamily: 'var(--font-body)',
                          fontSize: 14,
                          color: '#1a1c1c',
                        }}
                      >
                        <span style={{ fontWeight: 500, lineHeight: 1.25 }}>{alt.title}</span>
                        <span
                          style={{
                            border: '1px solid #f0d9d3',
                            borderRadius: 999,
                            color: '#8e706a',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: 700,
                            lineHeight: 1,
                            padding: '2px 7px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {alt.soc_code}
                        </span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FunnelShell>
  );
}
