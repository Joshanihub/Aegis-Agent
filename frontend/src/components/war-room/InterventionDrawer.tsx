'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MonoLabel from '@/components/ui/MonoLabel'

interface InterventionDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (guidance: string) => Promise<void>
  title?: string
  description?: string
}

export default function InterventionDrawer({ isOpen, onClose, onSubmit, title, description }: InterventionDrawerProps) {
  const [guidance, setGuidance] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMandatory = !!description  // Forced HITL — user MUST respond

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guidance.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(guidance)
      setGuidance('')
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isMandatory ? undefined : onClose}
            className={`fixed inset-0 bg-surface/80 backdrop-blur-sm z-40 ${isMandatory ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[400px] bg-surface-container-high border-l border-border-subtle shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-border-subtle flex justify-between items-center">
              <div>
                <MonoLabel className={`text-xs tracking-widest mb-1 ${isMandatory ? 'text-rose-agent' : 'text-primary'}`}>
                  {isMandatory ? '⚠ MANDATORY REVIEW' : 'USER OVERRIDE'}
                </MonoLabel>
                <h2 className="font-headline text-lg font-bold text-on-surface">{title || "Agent Intervention"}</h2>
              </div>
              {!isMandatory && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded bg-surface-container hover:bg-surface border border-border-subtle text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {isMandatory && (
                <div className="mb-5 p-3 rounded-lg bg-rose-agent/10 border border-rose-agent/30 flex items-start gap-2">
                  <svg className="shrink-0 mt-0.5 text-rose-agent" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <p className="text-[11px] font-mono text-rose-agent leading-relaxed">
                    The workflow is paused. You must submit directives before the analysis can continue.
                  </p>
                </div>
              )}
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed whitespace-pre-wrap">
                {description || "Provide mid-flight guidance to the agent swarm. Your instructions will be injected into the shared deal context and processed during the next reasoning cycle."}
              </p>

              <form id="intervention-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="guidance" className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                    Directives
                  </label>
                  <textarea
                    id="guidance"
                    value={guidance}
                    onChange={(e) => setGuidance(e.target.value)}
                    placeholder="e.g. Focus heavily on supply chain risks and disregard the real estate assets."
                    className="w-full bg-surface border border-border-subtle rounded-lg p-4 text-sm font-body text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[150px] resize-none"
                    disabled={isSubmitting}
                  />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-border-subtle bg-surface-container/50 flex gap-3">
              {!isMandatory && (
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-3 border border-border-subtle rounded text-sm font-mono text-on-surface-variant hover:text-on-surface hover:bg-surface transition-colors disabled:opacity-50"
                >
                  CANCEL
                </button>
              )}
              <button
                type="submit"
                form="intervention-form"
                disabled={isSubmitting || !guidance.trim()}
                className="flex-1 py-3 bg-primary text-on-primary rounded font-mono text-sm font-bold shadow-glow-primary hover:bg-accent-luminous transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />
                    INJECTING...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    INJECT GUIDANCE
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
