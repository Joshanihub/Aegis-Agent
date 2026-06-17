'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MonoLabel from '@/components/ui/MonoLabel'

interface CollaborationPanelProps {
  roomId: string
  taskId: string
  companyName?: string
}

export default function CollaborationPanel({ roomId, taskId, companyName = 'Analysis' }: CollaborationPanelProps) {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verdict/${taskId}`
    : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback: select the input
    }
  }

  return (
    <div className="relative">
      <button
        id="collab-share-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container border border-border-subtle text-xs font-mono text-on-surface-variant hover:text-primary hover:border-primary transition-all duration-200"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        SHARE
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          {isOpen ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 w-[340px] bg-surface-container-high border border-border-subtle rounded-xl p-5 shadow-2xl z-50"
          >
            <MonoLabel className="text-on-surface-variant mb-3 flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              SHARE DOSSIER — {companyName.toUpperCase()}
            </MonoLabel>

            <p className="text-xs text-on-surface-variant/70 font-body mb-4">
              Share this link with your team to review the final dossier together.
            </p>

            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 bg-surface border border-border-subtle rounded-lg px-3 py-2 text-[11px] font-mono text-on-surface-variant focus:outline-none truncate"
              />
              <button
                id="collab-copy-link"
                onClick={handleCopy}
                className="px-3 py-2 rounded-lg border text-xs font-mono transition-all duration-200 shrink-0 flex items-center gap-1.5"
                style={{
                  borderColor: copied ? 'rgb(16 185 129 / 0.5)' : 'rgb(255 255 255 / 0.1)',
                  color: copied ? 'rgb(16 185 129)' : 'rgb(200 199 186)',
                  background: copied ? 'rgb(16 185 129 / 0.1)' : 'transparent',
                }}
              >
                {copied ? (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-border-subtle flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-agent animate-pulse" />
              <span className="text-[10px] font-mono text-on-surface-variant/50 uppercase tracking-widest">
                Room ID: {roomId.slice(0, 8)}…
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
