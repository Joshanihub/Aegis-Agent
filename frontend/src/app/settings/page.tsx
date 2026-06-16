'use client'

import { useRouter } from 'next/navigation'
import AegisSidebar from '@/components/ui/AegisSidebar'
import AegisTopBar from '@/components/ui/AegisTopBar'
import GlassPanel from '@/components/ui/GlassPanel'
import MonoLabel from '@/components/ui/MonoLabel'
import { useAegisStore } from '@/lib/store'
import { motion } from 'framer-motion'

export default function SettingsPage() {
  const router = useRouter()
  const taskId = useAegisStore(s => s.taskId)

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <AegisSidebar onNewAnalysis={() => {
        useAegisStore.getState().reset()
        router.push('/config')
      }} />

      <div className="flex-1 md:ml-[280px] flex flex-col relative h-full">
        <AegisTopBar title="Settings" subtitle="System Preferences" status="idle" />

        <main className="flex-1 overflow-y-auto mt-14 p-8 xl:p-12">
          <div className="max-w-[800px] mx-auto w-full flex flex-col gap-8 pb-10">
            <header className="mb-2">
              <h1 className="font-headline text-headline-lg font-bold text-on-surface tracking-tight mb-2">
                System Configuration
              </h1>
              <p className="font-body text-sm text-on-surface-variant max-w-2xl">
                Configure user preferences, AI model routing, and default parameters for new investment analyses.
              </p>
            </header>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid gap-6">
              
              {/* User Profile */}
              <GlassPanel className="p-8">
                <MonoLabel className="text-on-surface-variant mb-6 text-xs tracking-widest">USER PROFILE</MonoLabel>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-surface-container-high border border-border-subtle flex items-center justify-center relative overflow-hidden">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-headline text-lg text-on-surface font-semibold">Josh Aegis</h3>
                    <p className="text-sm text-on-surface-variant mt-1">Lead Investment Architect</p>
                    <div className="mt-2 inline-flex px-2 py-0.5 rounded bg-emerald-agent/10 text-emerald-agent border border-emerald-agent/20 font-mono text-[10px] uppercase tracking-wider">
                      CLEARANCE LEVEL: ROOT
                    </div>
                  </div>
                </div>
              </GlassPanel>

              {/* Model Selection */}
              <GlassPanel className="p-8 border-l-4 border-l-indigo-init">
                <MonoLabel className="text-indigo-init mb-6 text-xs tracking-widest">AI MODEL ROUTING</MonoLabel>
                <p className="text-sm text-on-surface-variant mb-6">
                  Select which intelligence backends power the different agent nodes. The system defaults to optimal routing.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-surface-container-low border border-border-subtle rounded-lg">
                    <div>
                      <h4 className="font-semibold text-on-surface text-sm">Reviewer & Analyst Nodes</h4>
                      <p className="text-xs text-on-surface-variant mt-1">Primary inference engines for data synthesis and adversarial review.</p>
                    </div>
                    <select className="bg-surface border border-border-subtle rounded-md px-4 py-2 text-sm text-primary font-mono focus:outline-none focus:border-primary w-[250px]" defaultValue="featherless">
                      <option value="featherless">Featherless AI (Mistral-7B)</option>
                      <option value="aiml">AI/ML API (GPT-4o)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-surface-container-low border border-border-subtle rounded-lg">
                    <div>
                      <h4 className="font-semibold text-on-surface text-sm">Planner & Finalizer Nodes</h4>
                      <p className="text-xs text-on-surface-variant mt-1">Orchestration and final verdict compilation engines.</p>
                    </div>
                    <select className="bg-surface border border-border-subtle rounded-md px-4 py-2 text-sm text-primary font-mono focus:outline-none focus:border-primary w-[250px]" defaultValue="aiml">
                      <option value="aiml">AI/ML API (GPT-4o)</option>
                      <option value="featherless">Featherless AI (Mistral-7B)</option>
                    </select>
                  </div>
                </div>
              </GlassPanel>

              {/* Default Parameters */}
              <GlassPanel className="p-8">
                <MonoLabel className="text-on-surface-variant mb-6 text-xs tracking-widest">ANALYSIS DEFAULTS</MonoLabel>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Default Risk Tolerance</label>
                    <input type="range" min="0" max="100" defaultValue="50" className="w-full accent-primary h-2 bg-surface-container rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-xs text-on-surface-variant mt-2 font-mono">
                      <span>0 (CONSERVATIVE)</span>
                      <span>100 (AGGRESSIVE)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Default Analysis Depth</label>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded border border-border-subtle bg-surface hover:bg-surface-container-high transition-colors text-sm font-mono text-on-surface-variant">SURFACE</button>
                      <button className="flex-1 py-2 rounded border border-primary bg-primary-container/10 text-primary transition-colors text-sm font-mono font-bold">STANDARD</button>
                      <button className="flex-1 py-2 rounded border border-border-subtle bg-surface hover:bg-surface-container-high transition-colors text-sm font-mono text-on-surface-variant">DEEP</button>
                    </div>
                  </div>
                </div>
              </GlassPanel>

            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}
