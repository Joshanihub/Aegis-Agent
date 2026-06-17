'use client'

import AegisSidebar from '@/components/ui/AegisSidebar'
import AegisTopBar from '@/components/ui/AegisTopBar'
import GlassPanel from '@/components/ui/GlassPanel'
import MonoLabel from '@/components/ui/MonoLabel'
import Footer from '@/components/ui/Footer'
import { useAegisStore } from '@/lib/store'
import { motion } from 'framer-motion'

export default function SupportPage() {

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <AegisSidebar />

      <div className="flex-1 md:ml-[280px] flex flex-col relative h-full">
        <AegisTopBar title="Support & Documentation" subtitle="System Reference" status="idle" />

        <main className="flex-1 overflow-y-auto mt-14 p-8 xl:p-12">
          <div className="max-w-[800px] mx-auto w-full flex flex-col gap-8 pb-10">
            <header className="mb-2">
              <h1 className="font-headline text-headline-lg font-bold text-on-surface tracking-tight mb-2">
                Aegis Agent Documentation
              </h1>
              <p className="font-body text-sm text-on-surface-variant max-w-2xl">
                Reference guide for the multi-agent investment committee, including architecture details and troubleshooting.
              </p>
            </header>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid gap-6">
              
              <GlassPanel className="p-8 border-l-4 border-l-cyan-agent">
                <MonoLabel className="text-cyan-agent mb-4 text-xs tracking-widest">ARCHITECTURE</MonoLabel>
                <h3 className="text-lg font-semibold text-on-surface mb-4">Multi-Agent Workflow (Band Protocol)</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  Aegis utilizes a 4-node agent architecture coordinated by the Band framework. The agents communicate asynchronously over WebSockets, passing context and findings through a rigid review cycle.
                </p>
                <ul className="space-y-4 text-sm text-on-surface-variant">
                  <li className="flex gap-3"><span className="text-cyan-agent font-bold">1. Planner:</span> Decomposes the investment thesis into actionable subtasks.</li>
                  <li className="flex gap-3"><span className="text-indigo-init font-bold">2. Analyst:</span> Executes forensic data gathering and synthesis.</li>
                  <li className="flex gap-3"><span className="text-rose-agent font-bold">3. Reviewer:</span> Conducts adversarial red-teaming against the Analyst&apos;s findings. Can force revision loops.</li>
                  <li className="flex gap-3"><span className="text-emerald-agent font-bold">4. Finalizer:</span> Compiles the executive dossier and assigns a cryptographically signed risk score.</li>
                </ul>
              </GlassPanel>

              <GlassPanel className="p-8 border-l-4 border-l-amber-agent">
                <MonoLabel className="text-amber-agent mb-4 text-xs tracking-widest">AI INFRASTRUCTURE</MonoLabel>
                <h3 className="text-lg font-semibold text-on-surface mb-4">Intelligence Engines</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                  The system relies on dual-inference backends to ensure high availability and diverse reasoning capabilities:
                </p>
                <div className="space-y-4">
                  <div className="bg-surface-container p-4 rounded-lg border border-border-subtle">
                    <h4 className="text-primary font-mono text-sm font-bold mb-1">Featherless AI</h4>
                    <p className="text-xs text-on-surface-variant">Used for high-throughput analytical tasks (Mistral-7B). Provides fast inference for the Analyst and Reviewer nodes.</p>
                  </div>
                  <div className="bg-surface-container p-4 rounded-lg border border-border-subtle">
                    <h4 className="text-primary font-mono text-sm font-bold mb-1">AI/ML API</h4>
                    <p className="text-xs text-on-surface-variant">Used for complex reasoning and orchestration (GPT-4o). Powers the Planner and Finalizer nodes.</p>
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel className="p-8 text-center bg-surface-container-lowest">
                <MonoLabel className="text-on-surface-variant mb-4 text-xs tracking-widest">NEED ASSISTANCE?</MonoLabel>
                <p className="text-sm text-on-surface-variant mb-6">
                  For priority technical support, please contact the engineering team.
                </p>
                <button className="px-6 py-2 border border-border-subtle rounded text-sm font-mono text-on-surface hover:bg-surface-container transition-colors">
                  CONTACT SUPPORT
                </button>
              </GlassPanel>

            </motion.div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
