/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelAnalysis, getTaskStatus, retryAnalysis } from '@/lib/api'
import { BandClient } from '@/lib/ws/BandClient'
import { useAegisStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateWorkflowProgress } from '@/lib/utils/progressCalculator'

import AgentGrid from '@/components/war-room/AgentGrid'
import TerminalStream from '@/components/war-room/TerminalStream'
import LockedSidebar from '@/components/war-room/LockedSidebar'
import WorkflowProgress from '@/components/war-room/WorkflowProgress'
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
    humanInputRequired,
    setHumanInputRequired,
  } = useAegisStore()

  const [isInterventionOpen, setIsInterventionOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastData[]>([])
  const [workflowActionPending, setWorkflowActionPending] = useState(false)

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
    setHumanInputRequired(null)
    setIsInterventionOpen(false)
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

  // WebSocket connection lifecycle — closed flag prevents React StrictMode double-fire
  useEffect(() => {
    let closed = false
    const client = new BandClient(taskId, {
      onSnapshot: (snapshot) => {
        if (closed) return
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
        if (closed) return
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
        if (closed) return
        applyBandMessage(event.message)
      },
      onVerdictReady: (event) => {
        if (closed) return
        setVerdict(event.verdict)
        addToast('Verdict Compiled', 'success', 'The Finalizer has completed the analysis.')
        router.push(`/verdict/${encodeURIComponent(taskId)}`)
      },
      onError: (event) => {
        if (closed) return
        setConnectionStatus('error')
        setWsError({ message: event.message, recoverable: event.recoverable })
      },
      onConnectionStatusChange: (status) => {
        if (closed) return
        setConnectionStatus(status)
      },
      onUserIntervention: (guidance) => {
        if (closed) return
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
      onHumanInputRequired: (event) => {
        if (closed) return
        setHumanInputRequired(event.message)
        setIsInterventionOpen(true)
        addToast('⚠ Human Input Required', 'warning', 'The Reviewer flagged high-risk findings. Your oversight is needed before the analysis continues.')
      },
      onWorkflowStateChanged: (event) => {
        if (closed) return
        initializeFromSnapshot({
          task: event.task,
          agents: event.task.agents ?? [],
          messages: event.task.messages ?? [],
          verdict: null,
        })
        if (event.type === 'workflow_cancelled') {
          addToast('Workflow Cancelled', 'warning', 'The analysis has stopped.')
        }
        if (event.type === 'workflow_retried') {
          addToast('Workflow Retried', 'success', 'The analysis has restarted.')
        }
      },
    })

    setConnectionStatus('connecting')
    client.connect()

    return () => {
      closed = true
      client.close()
    }
  }, [taskId])

  // Fatal WS error → back to config
  useEffect(() => {
    if (roomStatus === 'error' && wsError && !wsError.recoverable) {
      router.replace('/dashboard')
    }
  }, [roomStatus, wsError])

  const currentRisk = task?.risk_tolerance ?? 0
  const isWorkflowRunning = !!task && !['complete', 'error', 'cancelled'].includes(task.status)
  const canRetryWorkflow = !!task && ['error', 'cancelled'].includes(task.status)

  const handleCancelWorkflow = async () => {
    if (!task || workflowActionPending) return
    setWorkflowActionPending(true)
    try {
      await cancelAnalysis(taskId)
      addToast('Analysis cancelled', 'warning', 'The workflow will stop at the next safe checkpoint.')
    } catch {
      addToast('Cancel failed', 'error', 'Could not cancel this workflow.')
    } finally {
      setWorkflowActionPending(false)
    }
  }

  const handleRetryWorkflow = async () => {
    if (!task || workflowActionPending) return
    setWorkflowActionPending(true)
    try {
      await retryAnalysis(taskId)
      addToast('Retry started', 'success', 'The committee is being relaunched.')
    } catch {
      addToast('Retry failed', 'error', 'Only cancelled or failed workflows can be retried.')
    } finally {
      setWorkflowActionPending(false)
    }
  }

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Fixed Sidebar */}
      <AegisSidebar />

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
            <section className="relative w-full rounded-xl overflow-hidden glass-panel p-8 flex flex-col gap-6 animate-enter">
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/50 to-transparent" />
              <div className="relative z-10 w-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
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
                      {isWorkflowRunning && (
                        <button
                          onClick={handleCancelWorkflow}
                          disabled={workflowActionPending}
                          className="px-4 py-1.5 bg-rose-agent/10 border border-rose-agent/30 text-rose-agent rounded-md font-mono text-[11px] hover:bg-rose-agent hover:text-surface transition-colors font-bold uppercase tracking-widest disabled:opacity-50"
                        >
                          CANCEL
                        </button>
                      )}
                      {canRetryWorkflow && (
                        <button
                          onClick={handleRetryWorkflow}
                          disabled={workflowActionPending}
                          className="px-4 py-1.5 bg-emerald-agent/10 border border-emerald-agent/30 text-emerald-agent rounded-md font-mono text-[11px] hover:bg-emerald-agent hover:text-surface transition-colors font-bold uppercase tracking-widest disabled:opacity-50"
                        >
                          RETRY
                        </button>
                      )}
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

                {/* Progress Bar */}
                <WorkflowProgress
                  {...calculateWorkflowProgress(agents)}
                />
              </div>
            </section>

            <NotificationToast toasts={toasts} onDismiss={removeToast} />
            <InterventionDrawer
              isOpen={isInterventionOpen || !!humanInputRequired}
              onClose={() => {
                if (!humanInputRequired) setIsInterventionOpen(false)
              }}
              onSubmit={handleInterventionSubmit}
              title={humanInputRequired ? "Reviewer Flagged High-Risk Findings" : "Inject Directives"}
              description={humanInputRequired ?? undefined}
            />

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
                    <AgentGrid agents={agents} messages={messages} />
                    <div className="flex-1 min-h-[500px]">
                      <TerminalStream
                        messages={messages}
                        activeOwner={agents.find(a => a.status === 'processing')?.agent_id ?? (messages.length > 0 ? messages[messages.length - 1].owner : null)}
                      />
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
