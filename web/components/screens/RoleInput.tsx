'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { inferRoleCategory } from '@/lib/utils/role-mapper';
import type { SOCMatch, OnetTask, RoleCategory } from '@/types';

interface SocMatchResponse {
  primary: SOCMatch;
  alternatives: SOCMatch[];
}

interface Props {
  savedInput?: string;
  savedMatch?: SOCMatch | null;
  onConfirm: (soc: SOCMatch, tasks: OnetTask[], role: RoleCategory, input: string) => void;
}

export function RoleInput({ savedInput = '', savedMatch = null, onConfirm }: Props) {
  const router = useRouter();
  const [input, setInput] = useState(savedInput);
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
      const role = inferRoleCategory(activeSoc.soc_code, activeSoc.title);
      onConfirm(activeSoc, data.tasks, role, input);
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
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[560px]">
          {/* Progress dots */}
          <div className="mb-8">
            <ProgressDots total={5} current={1} />
          </div>

          {/* Back arrow */}
          <button
            onClick={() => router.push('/')}
            aria-label="Go back"
            className="flex items-center gap-2 mb-6 transition-colors"
            style={{ color: '#5a413b', fontFamily: 'var(--font-body)', fontSize: 14 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1c1c')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#5a413b')}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          {/* Card */}
          <div className="bg-white border border-[#e2e2e2] rounded-[4px] p-8 md:p-12">
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
              Step 1 of 5
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
              What do you do?
            </h1>
            <p
              className="mb-8"
              style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: '#5a413b' }}
            >
              Be specific — include your role and industry.
            </p>

            {/* Input */}
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="E.g. Product Manager at a fintech startup"
                className={cn(
                  'w-full h-14 px-4 rounded-[4px] text-base outline-none transition-colors pr-12',
                  'border-2',
                  error
                    ? 'border-[#b22c11]'
                    : 'border-[#1a1c1c] focus:border-[#b22c11]'
                )}
                style={{ fontFamily: 'var(--font-body)', color: '#1a1c1c', background: 'white' }}
              />
              {/* Loading dots */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-[5px]"
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="block size-[6px] rounded-full bg-[#b22c11]"
                        animate={{ opacity: [0.25, 1, 0.25] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.25 }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error */}
            {error && (
              <p
                className="mt-2"
                style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#b22c11' }}
              >
                {error}
              </p>
            )}

            {/* Match result */}
            <AnimatePresence>
              {match && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="mt-4 border border-[#e2e2e2] rounded-[4px] p-4"
                >
                  {/* Match header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="text-xs uppercase rounded-[4px] px-2 py-1"
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 500,
                        letterSpacing: '0.05em',
                        background: '#fff3f0',
                        color: '#b22c11',
                      }}
                    >
                      Matched
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 15,
                        fontWeight: 500,
                        color: '#1a1c1c',
                      }}
                    >
                      {activeSoc?.title ?? match.primary.title}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={handleConfirm}
                      disabled={confirming}
                      className="flex items-center gap-2 px-4 h-10 rounded-[4px] transition-colors disabled:opacity-60"
                      style={{
                        background: confirming ? '#8d1700' : '#b22c11',
                        color: 'white',
                        fontFamily: 'var(--font-heading)',
                        fontSize: 12,
                        fontWeight: 500,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
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
                        className="flex items-center gap-2 px-4 h-10 rounded-[4px] transition-colors"
                        style={{
                          border: '1px solid #e2e2e2',
                          fontFamily: 'var(--font-heading)',
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#5a413b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          background: 'white',
                        }}
                      >
                        Show options
                        <ChevronDown
                          size={14}
                          className={cn('transition-transform duration-200', showAlts && 'rotate-180')}
                        />
                      </button>
                    )}
                  </div>

                  {/* Alternatives */}
                  <AnimatePresence>
                    {showAlts && match.alternatives.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-[#e2e2e2]">
                          <p
                            className="uppercase mb-3"
                            style={{
                              fontFamily: 'var(--font-heading)',
                              fontSize: 12,
                              fontWeight: 500,
                              letterSpacing: '0.05em',
                              color: '#5a413b',
                            }}
                          >
                            Select your role:
                          </p>
                          <RadioGroup
                            value={selectedAltCode}
                            onValueChange={(v: string) => setSelectedAltCode(v)}
                          >
                            {match.alternatives.map((alt) => (
                              <label
                                key={alt.soc_code}
                                className="flex items-center gap-3 py-2 cursor-pointer"
                              >
                                <RadioGroupItem value={alt.soc_code} />
                                <span
                                  style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: 14,
                                    color: '#1a1c1c',
                                  }}
                                >
                                  {alt.title}
                                  <span
                                    className="ml-2"
                                    style={{ fontSize: 12, color: '#8e706a' }}
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
