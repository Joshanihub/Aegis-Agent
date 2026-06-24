'use client'

import Link from 'next/link'
import DashedGrid from '@/components/ui/DashedGrid'
import { motion } from 'framer-motion'
import AegisSidebar from '@/components/ui/AegisSidebar'
import AegisTopBar from '@/components/ui/AegisTopBar'
import { useAegisStore } from '@/lib/store'
import Footer from '@/components/ui/Footer'
import type { TaskStatus } from '@/lib/types'

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.6 } },
}

function sessionHref(session: { taskId: string; status?: TaskStatus }) {
  return session.status === 'complete'
    ? `/verdict/${encodeURIComponent(session.taskId)}`
    : `/war-room/${encodeURIComponent(session.taskId)}`
}

export default function DashboardPage() {
  const recentSessions = useAegisStore((s) => s.recentSessions || [])
  const defaultAimlModel = useAegisStore((s) => s.defaultAimlModel || 'gpt-4o')

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <AegisSidebar />

      <div className="flex-1 md:ml-[280px] flex flex-col relative h-full">
        <AegisTopBar title="Overview" subtitle="Command Centre" status="idle" />

        <main className="flex-1 overflow-y-auto mt-14 relative">
          <DashedGrid />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="max-w-6xl mx-auto relative z-10 space-y-10 p-8 lg:p-12"
          >
            {/* Hero Section */}
            <motion.section variants={staggerItem} className="glass-panel p-8 md:p-10 rounded-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-surface-container-high/50 to-transparent pointer-events-none" />
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full border border-primary/20 bg-primary/5">
                  <div className="w-2 h-2 rounded-full bg-emerald-agent animate-pulse" />
                  <span className="font-mono text-xs text-primary uppercase tracking-widest">4 Agents Online · System Nominal</span>
                </div>
                <h1 className="font-headline text-4xl md:text-5xl font-bold text-on-surface tracking-tight mb-4">
                  Investment<br />Intelligence Hub
                </h1>
                <p className="font-body text-on-surface-variant leading-relaxed mb-8 max-w-lg">
                  Deploy your autonomous analyst committee to perform forensic due diligence on any investment target. Results in under 90 seconds.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/config" className="px-8 py-3 rounded-md bg-primary text-on-primary font-mono text-sm font-bold tracking-widest uppercase hover:bg-accent-luminous transition-colors inline-flex items-center gap-2">
                    INITIALIZE ANALYSIS
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </Link>
                  <Link href="/settings" className="px-8 py-3 rounded-md border border-border-subtle text-on-surface-variant font-mono text-sm font-bold tracking-widest uppercase hover:bg-surface-container-low hover:text-on-surface transition-colors">
                    SETTINGS
                  </Link>
                </div>
              </div>
            </motion.section>

            {/* Quick Stats */}
            <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="glass-panel p-6 rounded-xl flex items-center justify-between group hover:border-border-subtle/80 transition-colors">
                <div>
                  <p className="font-mono text-[10px] text-on-surface-variant tracking-[0.1em] uppercase mb-2">Total Analyses</p>
                  <p className="font-headline text-4xl font-bold text-on-surface">{recentSessions.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl flex items-center justify-between group hover:border-border-subtle/80 transition-colors">
                <div>
                  <p className="font-mono text-[10px] text-on-surface-variant tracking-[0.1em] uppercase mb-2">Active Agents</p>
                  <p className="font-headline text-4xl font-bold text-on-surface">4</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-agent/10 flex items-center justify-center text-cyan-agent group-hover:scale-110 transition-transform">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><path d="m4.93 4.93 2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/></svg>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl flex items-center justify-between group hover:border-border-subtle/80 transition-colors">
                <div>
                  <p className="font-mono text-[10px] text-on-surface-variant tracking-[0.1em] uppercase mb-2">Inference Model</p>
                  <p className="font-mono text-sm font-bold text-on-surface truncate max-w-[160px] mt-1">{defaultAimlModel}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-init/10 flex items-center justify-center text-indigo-init group-hover:scale-110 transition-transform">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
              </div>
            </motion.div>

            {/* Recent Analyses */}
            {recentSessions.length > 0 ? (
              <motion.section variants={staggerItem}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-mono text-sm tracking-[0.1em] text-on-surface-variant uppercase flex items-center gap-3">
                    <div className="h-px bg-border-subtle w-8" />
                    Recent Analyses
                  </h2>
                  <button
                    onClick={() => useAegisStore.getState().clearSessions()}
                    className="font-mono text-[10px] text-on-surface-variant/50 hover:text-rose-agent transition-colors uppercase tracking-widest flex items-center gap-1.5"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentSessions.slice(0, 6).map((session) => (
                    <Link
                      key={session.taskId}
                      href={sessionHref(session)}
                      className="glass-panel p-5 rounded-xl hover:bg-surface-container-low transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">{session.companyName}</p>
                          <p className="font-mono text-[10px] text-on-surface-variant/60 mt-1.5 uppercase tracking-wider">
                            {new Date(session.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="font-mono text-[9px] text-on-surface-variant/40 mt-1 uppercase tracking-wider">
                            {session.status === 'complete' ? 'Verdict ready' : 'Open war room'}
                          </p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant/40 group-hover:text-primary transition-colors shrink-0 mt-1">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.section>
            ) : (
              <motion.section variants={staggerItem}>
                <div className="glass-panel p-12 rounded-2xl text-center border border-dashed border-border-subtle">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container mx-auto mb-5 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  </div>
                  <p className="font-mono text-sm text-on-surface-variant mb-2 uppercase tracking-widest">No analyses yet</p>
                  <p className="text-xs text-on-surface-variant/50 mb-6">Deploy your first analyst committee to get started</p>
                  <Link href="/config" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary text-on-primary font-mono text-xs font-bold tracking-widest uppercase hover:bg-accent-luminous transition-colors">
                    START FIRST ANALYSIS
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </Link>
                </div>
              </motion.section>
            )}
          </motion.div>

          <Footer />
        </main>
      </div>
    </div>
  )
}
