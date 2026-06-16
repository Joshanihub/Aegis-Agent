'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AegisSidebar from '@/components/ui/AegisSidebar'
import AegisTopBar from '@/components/ui/AegisTopBar'
import GlassPanel from '@/components/ui/GlassPanel'
import MonoLabel from '@/components/ui/MonoLabel'
import { useAegisStore } from '@/lib/store'
import { getTaskStatus } from '@/lib/api'
import type { TaskState, BandMessage } from '@/lib/types'
import { motion } from 'framer-motion'

export default function AuditTrailPage() {
  const router = useRouter()
  const taskId = useAegisStore(s => s.taskId)
  const [task, setTask] = useState<TaskState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!taskId) {
      setLoading(false)
      return
    }

    void (async () => {
      try {
        const t = await getTaskStatus(taskId)
        setTask(t)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })()
  }, [taskId])

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const staggerItem = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.5 } },
  }

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <AegisSidebar onNewAnalysis={() => {
        useAegisStore.getState().reset()
        router.push('/config')
      }} />

      <div className="flex-1 md:ml-[280px] flex flex-col relative h-full">
        <AegisTopBar title="Audit Trail" subtitle="System Event Log" status="idle" taskId={taskId || undefined} />

        <main className="flex-1 overflow-y-auto mt-14 p-8 xl:p-12">
          <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-8 pb-10">
            <header className="mb-2">
              <h1 className="font-headline text-headline-lg font-bold text-on-surface tracking-tight mb-2">
                Cryptographic Audit Trail
              </h1>
              <p className="font-body text-sm text-on-surface-variant max-w-2xl">
                Immutable record of all agent interactions, API calls, and reasoning steps during the active session. This log satisfies Zero-Knowledge compliance requirements.
              </p>
            </header>

            {!taskId && !loading && (
              <GlassPanel className="p-12 text-center flex flex-col items-center">
                <MonoLabel className="text-on-surface-variant text-lg mb-2">NO ACTIVE SESSION</MonoLabel>
                <p className="text-on-surface-variant/70 text-sm font-body">Initialize a new analysis protocol to begin logging.</p>
                <button
                  onClick={() => router.push('/config')}
                  className="mt-6 px-6 py-2 bg-primary text-on-primary font-mono text-sm font-semibold rounded-md shadow-glow-primary hover:bg-accent-luminous transition-colors"
                >
                  INITIALIZE PROTOCOL
                </button>
              </GlassPanel>
            )}

            {loading && (
              <div className="flex justify-center p-20">
                <div className="w-8 h-8 rounded-full border-2 border-border-subtle border-t-accent-luminous animate-spin" />
              </div>
            )}

            {task && !loading && (
              <GlassPanel className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-subtle bg-surface-container-low/50">
                        <th className="py-4 px-6 font-mono text-[11px] text-on-surface-variant tracking-widest uppercase font-semibold">Timestamp</th>
                        <th className="py-4 px-6 font-mono text-[11px] text-on-surface-variant tracking-widest uppercase font-semibold">Agent</th>
                        <th className="py-4 px-6 font-mono text-[11px] text-on-surface-variant tracking-widest uppercase font-semibold">Action</th>
                        <th className="py-4 px-6 font-mono text-[11px] text-on-surface-variant tracking-widest uppercase font-semibold">API Model</th>
                        <th className="py-4 px-6 font-mono text-[11px] text-on-surface-variant tracking-widest uppercase font-semibold">Confidence</th>
                      </tr>
                    </thead>
                    <motion.tbody variants={staggerContainer} initial="hidden" animate="show" className="divide-y divide-border-subtle/50">
                      {task.messages.map((msg, idx) => {
                        const date = msg.metadata?.timestamp ? new Date(msg.metadata.timestamp as string) : new Date()
                        return (
                          <motion.tr key={idx} variants={staggerItem} className="hover:bg-surface-glass transition-colors">
                            <td className="py-4 px-6 font-mono text-xs text-on-surface-variant whitespace-nowrap">
                              {date.toISOString().replace('T', ' ').substring(0, 19)}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider ${
                                msg.owner === 'planner' ? 'bg-cyan-agent/10 text-cyan-agent border border-cyan-agent/20' :
                                msg.owner === 'analyst' ? 'bg-indigo-init/10 text-indigo-init border border-indigo-init/20' :
                                msg.owner === 'reviewer' ? 'bg-rose-agent/10 text-rose-agent border border-rose-agent/20' :
                                msg.owner === 'finalizer' ? 'bg-emerald-agent/10 text-emerald-agent border border-emerald-agent/20' :
                                'bg-surface-container text-on-surface-variant border border-border-subtle'
                              }`}>
                                {msg.owner}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-body text-sm text-on-surface max-w-[300px] truncate" title={msg.action}>
                              {msg.action}
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container font-mono text-[10px] text-primary border border-border-subtle">
                                <div className="w-1 h-1 rounded-full bg-primary" />
                                {msg.output.api_used}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-mono text-sm text-on-surface-variant">
                              {msg.output.confidence}%
                            </td>
                          </motion.tr>
                        )
                      })}
                      {task.messages.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-sm text-on-surface-variant">
                            No events recorded yet.
                          </td>
                        </tr>
                      )}
                    </motion.tbody>
                  </table>
                </div>
              </GlassPanel>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
