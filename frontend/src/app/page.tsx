'use client'

import Link from 'next/link'
import DashedGrid from '@/components/ui/DashedGrid'
import { motion } from 'framer-motion'

const AGENT_PILLARS = [
  { label: 'FORENSIC AUDITOR', color: 'text-cyan-agent', border: 'border-cyan-agent/30', bg: 'bg-cyan-agent/5' },
  { label: 'MARKET ANALYST', color: 'text-indigo-init', border: 'border-indigo-init/30', bg: 'bg-indigo-init/5' },
  { label: 'RISK AUDITOR', color: 'text-rose-agent', border: 'border-rose-agent/30', bg: 'bg-rose-agent/5' },
  { label: 'EXECUTIVE FINALIZER', color: 'text-emerald-agent', border: 'border-emerald-agent/30', bg: 'bg-emerald-agent/5' },
]

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.8 } },
}

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <DashedGrid />

      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-agent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-init/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="max-w-2xl w-full glass-panel rounded-2xl p-10 relative z-10 text-center flex flex-col items-center shadow-glow-primary"
      >
        {/* Logo mark */}
        <motion.div
          variants={staggerItem}
          className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mb-6 border border-border-subtle relative overflow-hidden"
        >
          <div className="w-10 h-10 rounded-full bg-accent-luminous blur-[16px] opacity-40 absolute" />
          <div className="w-4 h-4 rounded-full bg-accent-luminous relative" />
        </motion.div>

        <motion.div variants={staggerItem} className="mb-2">
          <span className="font-mono text-[11px] tracking-[0.25em] text-on-surface-variant uppercase">
            Multi-Agent Command Center
          </span>
        </motion.div>

        <motion.h1
          variants={staggerItem}
          className="font-headline text-display-xl-mobile md:text-display-xl font-bold text-primary tracking-tight"
        >
          Aegis Agent
        </motion.h1>

        <motion.p
          variants={staggerItem}
          className="mt-4 text-body-lg text-on-surface-variant max-w-lg font-body leading-relaxed"
        >
          Enterprise multi-agent workflow command center. Built for autonomous investment
          analysis and rigorous zero-knowledge auditing.
        </motion.p>

        {/* Agent pillars */}
        <motion.div
          variants={staggerItem}
          className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2 w-full"
        >
          {AGENT_PILLARS.map((a) => (
            <div
              key={a.label}
              className={`rounded-lg border px-3 py-2 text-center ${a.border} ${a.bg}`}
            >
              <span className={`font-mono text-[9px] tracking-widest uppercase ${a.color}`}>
                {a.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={staggerItem} className="mt-10 flex gap-4 w-full sm:w-auto">
          <Link href="/config" passHref legacyBehavior>
            <motion.a
              className="w-full sm:w-auto px-8 py-3 rounded-full bg-primary text-on-primary font-mono text-sm font-semibold text-center shadow-glow-primary block"
              whileHover={{ backgroundColor: 'var(--accent-luminous)', boxShadow: 'var(--glow-primary-hover)' }}
              transition={{ duration: 0.2 }}
            >
              INITIALIZE PROTOCOL
            </motion.a>
          </Link>
        </motion.div>

        <motion.p
          variants={staggerItem}
          className="mt-6 text-[11px] font-mono text-on-surface-variant/40 tracking-widest"
        >
          AEGIS v1.0 · CRYPTOGRAPHICALLY SEALED
        </motion.p>
      </motion.div>
    </main>
  )
}
