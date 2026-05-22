'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const GRID_BG = `
  linear-gradient(rgba(26,28,28,0.04) 1px, transparent 1px),
  linear-gradient(90deg, rgba(26,28,28,0.04) 1px, transparent 1px),
  #f9f9f9
`.trim();

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Home() {
  const router = useRouter();

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: GRID_BG,
        backgroundSize: '24px 24px',
      }}
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center text-center w-full max-w-[680px]"
        style={{ gap: 0 }}
      >
        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#1a1c1c',
            marginBottom: 24,
          }}
          className="text-[40px] md:text-[64px]"
        >
          What is your job worth in{' '}
          <span style={{ color: '#b22c11' }}>5 years</span>?
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeUp}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 18,
            fontWeight: 400,
            color: '#5a413b',
            lineHeight: 1.6,
            marginBottom: 32,
            maxWidth: 520,
          }}
        >
          Find out using the same methodology economists use
          <br className="hidden sm:block" />
          to measure AI displacement risk.
        </motion.p>

        {/* CTA */}
        <motion.div variants={fadeUp} style={{ marginBottom: 48, width: '100%' }}>
          <motion.button
            onClick={() => router.push('/assess')}
            animate={{ scale: [1, 1.015, 1] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatDelay: 4.2,
              ease: 'easeInOut',
            }}
            className="w-full sm:w-auto rounded-[4px] active:scale-[0.96]"
            style={{
              background: '#ff6343',
              color: 'white',
              fontFamily: 'var(--font-heading)',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              height: 56,
              paddingLeft: 52,
              paddingRight: 52,
              cursor: 'pointer',
              border: 'none',
              borderRadius: 8,
              boxShadow: '0 4px 24px rgba(255,99,67,0.36)',
              transition: 'background-color 0.15s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e8502e';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(255,99,67,0.46)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ff6343';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(255,99,67,0.36)';
            }}

          >
            Calculate My Risk Score →
          </motion.button>
        </motion.div>

        {/* Credibility bar */}
        <motion.div
          variants={fadeUp}
          className="flex items-center justify-center flex-wrap"
          style={{ gap: 0 }}
        >
          {['O*NET', 'STANFORD HAI 2026', 'WEF Future of Jobs'].map((label, i) => (
            <span key={label} className="flex items-center">
              {i > 0 && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 1,
                    height: 14,
                    background: '#e2e2e2',
                    margin: '0 16px',
                  }}
                />
              )}
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'rgba(95,94,94,0.8)',
                }}
              >
                {label}
              </span>
            </span>
          ))}
        </motion.div>
      </motion.div>
    </main>
  );
}
