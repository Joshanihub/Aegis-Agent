'use client'

import AegisSidebar from '@/components/ui/AegisSidebar'
import AegisTopBar from '@/components/ui/AegisTopBar'
import GlassPanel from '@/components/ui/GlassPanel'
import MonoLabel from '@/components/ui/MonoLabel'
import Footer from '@/components/ui/Footer'
import { useAegisStore } from '@/lib/store'
import { motion } from 'framer-motion'

export default function SettingsPage() {
  const defaultAimlModel = useAegisStore(s => s.defaultAimlModel)
  const setDefaultAimlModel = useAegisStore(s => s.setDefaultAimlModel)
  const defaultFeatherlessModel = useAegisStore(s => s.defaultFeatherlessModel)
  const setDefaultFeatherlessModel = useAegisStore(s => s.setDefaultFeatherlessModel)
  const defaultRiskTolerance = useAegisStore(s => s.defaultRiskTolerance)
  const setDefaultRiskTolerance = useAegisStore(s => s.setDefaultRiskTolerance)
  const defaultAnalysisDepth = useAegisStore(s => s.defaultAnalysisDepth)
  const setDefaultAnalysisDepth = useAegisStore(s => s.setDefaultAnalysisDepth)

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <AegisSidebar />

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
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 bg-surface-container-low border border-border-subtle rounded-lg">
                      <div>
                        <h4 className="font-semibold text-on-surface text-sm">Reasoning Engine (AI/ML)</h4>
                        <p className="text-xs text-on-surface-variant mt-1">Default model for heavy logic agents (Planner, Reviewer, Finalizer).</p>
                      </div>
                      <select 
                        className="bg-surface border border-border-subtle rounded-md px-4 py-2 text-sm text-primary font-mono focus:outline-none focus:border-primary w-[250px]" 
                        value={defaultAimlModel}
                        onChange={(e) => setDefaultAimlModel(e.target.value)}
                      >
                        <option value="gpt-4o">GPT-4o (Default)</option>
                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                        <option value="o1-preview">o1 Preview</option>
                        <option value="o3-mini">o3 Mini</option>
                        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                        <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface-container-low border border-border-subtle rounded-lg">
                      <div>
                        <h4 className="font-semibold text-on-surface text-sm">Data Engine (Featherless)</h4>
                        <p className="text-xs text-on-surface-variant mt-1">Default model for data processing agents (Analyst).</p>
                      </div>
                      <select 
                        className="bg-surface border border-border-subtle rounded-md px-4 py-2 text-sm text-primary font-mono focus:outline-none focus:border-primary w-[250px]" 
                        value={defaultFeatherlessModel}
                        onChange={(e) => setDefaultFeatherlessModel(e.target.value)}
                      >
                        <option value="meta-llama/Llama-3.3-70B-Instruct">Llama 3.3 (70B)</option>
                        <option value="meta-llama/Llama-3.1-405B-Instruct">Llama 3.1 (405B)</option>
                        <option value="Qwen/Qwen2.5-72B-Instruct">Qwen2.5 (72B)</option>
                        <option value="deepseek-ai/DeepSeek-V3">DeepSeek-V3</option>
                      </select>
                    </div>
                  </div>
                </div>
              </GlassPanel>

              {/* Default Parameters */}
              <GlassPanel className="p-8">
                <MonoLabel className="text-on-surface-variant mb-6 text-xs tracking-widest">ANALYSIS DEFAULTS</MonoLabel>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Default Risk Tolerance</label>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={defaultRiskTolerance} 
                      onChange={(e) => setDefaultRiskTolerance(Number(e.target.value))}
                      className="w-full accent-primary h-2 bg-surface-container rounded-lg appearance-none cursor-pointer" 
                    />
                    <div className="flex justify-between text-xs text-on-surface-variant mt-2 font-mono">
                      <span>0 (CONSERVATIVE)</span>
                      <span>100 (AGGRESSIVE)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Default Analysis Depth</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setDefaultAnalysisDepth('SURFACE')}
                        className={`flex-1 py-2 rounded border transition-colors text-sm font-mono ${defaultAnalysisDepth === 'SURFACE' ? 'border-primary bg-primary-container/10 text-primary font-bold' : 'border-border-subtle bg-surface hover:bg-surface-container-high text-on-surface-variant'}`}
                      >
                        SURFACE
                      </button>
                      <button 
                        onClick={() => setDefaultAnalysisDepth('STANDARD')}
                        className={`flex-1 py-2 rounded border transition-colors text-sm font-mono ${defaultAnalysisDepth === 'STANDARD' ? 'border-primary bg-primary-container/10 text-primary font-bold' : 'border-border-subtle bg-surface hover:bg-surface-container-high text-on-surface-variant'}`}
                      >
                        STANDARD
                      </button>
                      <button 
                        onClick={() => setDefaultAnalysisDepth('DEEP')}
                        className={`flex-1 py-2 rounded border transition-colors text-sm font-mono ${defaultAnalysisDepth === 'DEEP' ? 'border-primary bg-primary-container/10 text-primary font-bold' : 'border-border-subtle bg-surface hover:bg-surface-container-high text-on-surface-variant'}`}
                      >
                        DEEP
                      </button>
                    </div>
                  </div>
                </div>
              </GlassPanel>

            </motion.div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
