'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { VerdictData } from '@/lib/types'
import { useAegisStore } from '@/lib/store'
import DossierCard from '@/components/verdict/DossierCard'
import { getVerdict, refineAnalysis } from '@/lib/api'
import { motion } from 'framer-motion'
import MonoLabel from '@/components/ui/MonoLabel'
import TraceLine from '@/components/ui/TraceLine'
import AegisSidebar from '@/components/ui/AegisSidebar'
import AegisTopBar from '@/components/ui/AegisTopBar'
import Footer from '@/components/ui/Footer'

export default function VerdictPage() {
  const params = useParams<{ task_id: string }>()
  const router = useRouter()
  const taskId = params.task_id
  const verdict = useAegisStore((s: { verdict: VerdictData | null }) => s.verdict)
  const setVerdict = useAegisStore((s: { setVerdict: (v: VerdictData | null) => void }) => s.setVerdict)

  const [refineCriteria, setRefineCriteria] = useState('')
  const [isRefining, setIsRefining] = useState(false)

  const [fetchError, setFetchError] = useState(false)

  // Fetch verdict from REST if store is empty (e.g., direct URL navigation)
  useEffect(() => {
    if (!taskId) return
    if (verdict) return

    let isMounted = true
    let retries = 3

    const fetchV = async () => {
      try {
        const v: VerdictData = await getVerdict(taskId)
        if (isMounted) {
          setVerdict(v)
          setFetchError(false)
        }
      } catch (err) {
        if (!isMounted) return
        if (retries > 0) {
          retries--
          setTimeout(fetchV, 2000)
        } else {
          setFetchError(true)
        }
      }
    }

    void fetchV()

    return () => {
      isMounted = false
    }
  }, [taskId, verdict, setVerdict])

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Fixed Sidebar */}
      <AegisSidebar onNewAnalysis={() => {
        useAegisStore.getState().reset()
        router.push('/config')
      }} />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[280px] flex flex-col relative h-full">
        <AegisTopBar 
          title="Final Verdict" 
          subtitle="Dossier Complete" 
          taskId={taskId}
          status={verdict ? 'complete' : 'live'}
        />

        {/* Scrollable Workspace Content */}
        <main className="flex-1 overflow-y-auto mt-14 p-8 xl:p-12">
          <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-8 pb-10">
            {verdict ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-8"
              >
                <DossierCard verdict={verdict} />
                
                {/* Continuous Refinement Panel */}
                <div className="glass-panel p-8 mt-4 flex flex-col gap-4 border-t-2 border-t-indigo-init relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-border-subtle group-hover:bg-indigo-init transition-colors duration-500" />
                  
                  <MonoLabel className="text-on-surface-variant">CONTINUOUS REFINEMENT</MonoLabel>
                  <p className="text-sm text-text-muted">
                    Not satisfied with the verdict? Add new criteria and the agents will re-analyze while maintaining context memory.
                  </p>
                  
                  <div className="flex gap-4 items-center mt-2">
                    <div className="relative flex-1">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant flex items-center justify-center pointer-events-none">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.29 1.29L3 12l5.8 1.9a2 2 0 0 1 1.29 1.29L12 21l1.9-5.8a2 2 0 0 1 1.29-1.29L21 12l-5.8-1.9a2 2 0 0 1-1.29-1.29L12 3Z" />
                          <path d="M19 3v4" />
                          <path d="M21 5h-4" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Focus exclusively on Q3 compute costs..."
                        value={refineCriteria}
                        onChange={(e) => setRefineCriteria(e.target.value)}
                        className="w-full bg-surface-container-low border border-border-subtle rounded-md pl-12 pr-4 py-4 text-sm text-on-surface focus:outline-none focus:border-indigo-init transition-colors shadow-inner"
                      />
                    </div>
                    <motion.button
                      disabled={!refineCriteria.trim() || isRefining}
                      onClick={async () => {
                        if (!refineCriteria.trim() || isRefining) return
                        setIsRefining(true)
                        try {
                          await refineAnalysis(taskId, refineCriteria)
                          useAegisStore.getState().setVerdict(null)
                          router.push(`/war-room/${encodeURIComponent(taskId)}`)
                        } catch (err) {
                          console.error(err)
                          setIsRefining(false)
                        }
                      }}
                      className="px-8 py-4 rounded-md bg-indigo-init text-white font-mono text-sm disabled:opacity-50 flex items-center gap-2 font-semibold shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-shadow"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isRefining ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span>REFINING...</span>
                        </>
                      ) : (
                        <span>REFINE ANALYSIS</span>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ) : fetchError ? (
                <div className="flex flex-col items-center justify-center mt-32 gap-6 glass-panel p-12 max-w-md mx-auto border-t-2 border-t-rose-agent">
                  <div className="text-center">
                    <MonoLabel className="text-rose-agent text-lg mb-3">
                      VERDICT NOT FOUND
                    </MonoLabel>
                    <p className="text-on-surface-variant/80 text-sm font-mono leading-relaxed mb-6">
                      Could not fetch the final dossier for this task. The analysis may have failed or the session expired.
                    </p>
                    <button
                      onClick={() => router.push('/config')}
                      className="px-6 py-2 bg-surface-container hover:bg-surface-container-high border border-border-subtle rounded text-sm font-mono text-on-surface transition-colors"
                    >
                      RETURN TO ANALYSIS
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center mt-32 gap-6 glass-panel p-12 max-w-md mx-auto">
                  <div className="relative w-32 h-8 flex items-center justify-center">
                    <TraceLine />
                  </div>
                  <div className="text-center">
                    <MonoLabel className="animate-pulse-amber text-amber-agent text-lg mb-3">
                      AWAITING FINALIZER VERDICT…
                    </MonoLabel>
                    <p className="text-on-surface-variant/80 text-sm font-mono leading-relaxed">
                      The executive committee is compiling the final dossier and calculating the definitive risk score.
                    </p>
                  </div>
                </div>
              )}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
