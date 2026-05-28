'use client';

import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import styles from './Home.module.css';

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

const proofItems = [
  { value: 'O*NET', label: 'task basis' },
  { value: '4-factor', label: 'risk model' },
  { value: '90-day', label: 'upgrade map' },
];

const heroVideoUrl = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4';

export default function Home() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const goToAssess = () => router.push('/assess');

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.leftPane}>
          <header className={styles.leftNav}>
            <div className={styles.brand}>
              <strong>100x</strong>
            </div>
            <button className={styles.navCta} type="button" onClick={goToAssess}>
              <span>Start scan</span>
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          </header>

          <motion.div
            className={styles.copy}
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.h1 variants={fadeUp}>
              What is your job worth in <span>5 years</span>?
            </motion.h1>

            <motion.p className={styles.lede} variants={fadeUp}>
              Get a role-specific risk score, the skills that change it, and a 90-day AI-native roadmap built around real work tasks.
            </motion.p>

            <motion.div className={styles.actionRow} variants={fadeUp}>
              <button className={styles.primaryCta} type="button" onClick={goToAssess}>
                <span>Calculate my risk score</span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
              <span className={styles.timeNote}>Takes under 2 minutes</span>
            </motion.div>

            <motion.div className={styles.proofGrid} variants={fadeUp}>
              {proofItems.map((item) => (
                <div className={styles.proofItem} key={item.value}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          className={styles.videoPanel}
          initial={{ opacity: 0, x: reduceMotion ? 0 : 22 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          aria-label="AI risk scanner video preview"
        >
          <video
            className={styles.heroVideo}
            src={heroVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
        </motion.div>

      </section>
    </main>
  );
}
