/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getTaskStatus } from '@/lib/api'
import { BandClient } from '@/lib/ws/BandClient'
import { useAegisStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'

import AgentGrid from '@/components/war-room/AgentGrid'
import TerminalStream from '@/components/war-room/TerminalStream'
import LockedSidebar from '@/components/war-room/LockedSidebar'
import GlassPanel from '@/components/ui/GlassPanel'
import MonoLabel from '@/components/ui/MonoLabel'
import AegisSidebar from '@/components/ui/AegisSidebar'
import AegisTopBar from '@/components/ui/AegisTopBar'
import Footer from '@/components/ui/Footer'
import InterventionDrawer from '@/components/war-room/InterventionDrawer'
import NotificationToast, { ToastData, ToastVariant } from '@/components/ui/NotificationToast'

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export default function WarRoomInner({ taskId }: { taskId: string }) {
  const router = useRouter()
  const {
    taskId: storeTaskId,
    roomStatus,
    wsError,
    task,
    agents,
    messages,
    verdict,
    initializeFromSnapshot,
    setConnectionStatus,
    setWsError,
    applyBandMessage,
    applyAgentStatusChanged,
    setVerdict,
    setRoomIdentifiers,
  } = useAegisStore()

  const [isInterventionOpen, setIsInterventionOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = (message: string, variant: ToastVariant = 'info', description?: string) => {
    const id = generateId()
    setToasts((prev) => [...prev, { id, message, variant, description }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const handleInterventionSubmit = async (guidance: string) => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'
    const response = await fetch(`${apiBase}/api/rooms/${taskId}/intervene`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guidance }),
    })
    if (!response.ok) {
      addToast('Intervention failed', 'error', 'Could not communicate with the backend.')
      throw new Error('Failed to inject guidance')
    }
    addToast('Guidance Injected', 'success', 'Directives successfully appended to the deal context.')
  }

  // Hydrate store from REST if navigating directly to this URL
  useEffect(() => {
    void (async () => {
      try {
        if (!storeTaskId || storeTaskId !== taskId) {
          const status = await getTaskStatus(taskId)
          setRoomIdentifiers(status.room_id, status.task_id)
          initializeFromSnapshot({
            task: status,
            agents: status.agents ?? [],
            messages: status.messages ?? [],
            verdict: null,
          })
        }
      } catch {
        // ignore; websocket snapshot will cover this
      }
    })()
  }, [taskId])

  // WebSocket connection lifecycle
  useEffect(() => {
    const client = new BandClient(taskId, {
      onSnapshot: (snapshot) => {
        initializeFromSnapshot({
          task: snapshot.task,
          agents: snapshot.agents,
          messages: snapshot.messages,
          verdict: snapshot.verdict,
        })
        setConnectionStatus('connected')
        setWsError(null)
      },
      onAgentStatusChanged: (event) => {
        applyAgentStatusChanged({
          agent_id: event.agent_id,
          status: event.status,
          last_action: event.last_action,
        })
        if (event.status === 'processing') {
          addToast(`Agent Active: ${event.agent_id.toUpperCase()}`, 'info', event.last_action)
        }
      },
      onBandMessage: (event) => {
        applyBandMessage(event.message)
      },
      onVerdictReady: (event) => {
        setVerdict(event.verdict)
        addToast('Verdict Compiled', 'success', 'The Finalizer has completed the analysis.')
        router.push(`/verdict/${encodeURIComponent(taskId)}`)
      },
      onError: (event) => {
        setConnectionStatus('error')
        setWsError({ message: event.message, recoverable: event.recoverable })
      },
      onConnectionStatusChange: (status) => {
        setConnectionStatus(status)
      },
      onUserIntervention: (guidance) => {
        applyBandMessage({
          owner: 'system',
          task: 'System Intervention',
          context: 'User Override',
          action: 'Injecting Directives',
          status: 'completed',
          next_handoff: null,
          metadata: { cycle: 0 },
          output: {
            data: {},
            confidence: 100,
            api_used: 'System Override',
            reasoning: `[DIRECTIVE INJECTED]: ${guidance}`
          }
        })
      },
    })

    setConnectionStatus('connecting')
    client.connect()

    return () => {
      client.close()
    }
  }, [taskId])

  // Fatal WS error → back to config
  useEffect(() => {
    if (roomStatus === 'error' && wsError && !wsError.recoverable) {
      router.replace('/config')
    }
  }, [roomStatus, wsError])

  const currentRisk = task?.risk_tolerance ?? 0

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
          title="War Room" 
          subtitle="Live Workflow Visualization" 
          taskId={taskId}
          status={roomStatus === 'connected' ? 'live' : roomStatus === 'connecting' ? 'connecting' : roomStatus === 'error' ? 'error' : 'idle'}
        />

        {/* Scrollable Workspace Content */}
        <main className="flex-1 overflow-y-auto mt-14 p-8 xl:p-12">
          <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-8">
            {/* Cinematic Hero */}
            <section className="relative w-full rounded-xl overflow-hidden glass-panel p-8 flex items-end animate-enter h-[200px]">
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/50 to-transparent" />
              <div className="relative z-10 w-full flex justify-between items-end">
                <div>
                  <h2 className="font-headline text-headline-lg font-bold text-on-surface tracking-tight mb-2">
                    Analysis in Progress — <span className="text-primary">{task?.company_name || 'Loading...'}</span>
                  </h2>
                  <p className="font-body text-body-md text-on-surface-variant max-w-xl">
                    {task?.deal_context || 'Awaiting context parameters...'}
                  </p>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-3">
                  <div className="flex gap-2">
                    <div className="px-4 py-1.5 bg-surface-glass border border-border-subtle rounded-md font-mono text-[11px] text-primary flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> System Nominal
                    </div>
                    <button
                      onClick={() => setIsInterventionOpen(true)}
                      className="px-4 py-1.5 bg-amber-agent/10 border border-amber-agent/30 text-amber-agent rounded-md font-mono text-[11px] hover:bg-amber-agent hover:text-surface transition-colors font-bold uppercase tracking-widest"
                    >
                      INTERVENE
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high border border-border-subtle font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">
                      Powered by Band
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high border border-border-subtle font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">
                      Featherless AI
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high border border-border-subtle font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">
                      AI/ML API
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <NotificationToast toasts={toasts} onDismiss={removeToast} />
            <InterventionDrawer isOpen={isInterventionOpen} onClose={() => setIsInterventionOpen(false)} onSubmit={handleInterventionSubmit} />

            <AnimatePresence mode="wait">
              {task ? (
                <motion.div
                  key="active-session"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 xl:grid-cols-12 gap-8"
                >
                  <div className="xl:col-span-8 flex flex-col gap-8 min-w-0">
                    <AgentGrid agents={agents} />
                    <div className="flex-1 min-h-[500px]">
                      <TerminalStream messages={messages} />
                    </div>
                  </div>
                  
                  <aside className="xl:col-span-4 hidden xl:block">
                    <LockedSidebar currentRisk={currentRisk} />
                  </aside>
                </motion.div>
              ) : (
                <GlassPanel key="loading" className="flex flex-col items-center justify-center p-20 text-center col-span-12">
                  <div className="w-10 h-10 rounded-full border-2 border-border-subtle border-t-accent-luminous animate-spin mb-6" />
                  <MonoLabel className="text-on-surface-variant text-sm tracking-widest uppercase">Connecting to workflow snapshot…</MonoLabel>
                </GlassPanel>
              )}
            </AnimatePresence>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
