'use client'

import { motion, AnimatePresence } from 'framer-motion'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface ToastData {
  id: string
  message: string
  variant: ToastVariant
  description?: string
}

interface NotificationToastProps {
  toasts: ToastData[]
  onDismiss: (id: string) => void
}

export default function NotificationToast({ toasts, onDismiss }: NotificationToastProps) {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let variantStyles = ''
          let icon = null

          switch (toast.variant) {
            case 'success':
              variantStyles = 'border-emerald-agent/50 bg-surface/90 text-emerald-agent'
              icon = (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )
              break
            case 'warning':
              variantStyles = 'border-amber-agent/50 bg-surface/90 text-amber-agent'
              icon = (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )
              break
            case 'error':
              variantStyles = 'border-rose-agent/50 bg-surface/90 text-rose-agent'
              icon = (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )
              break
            case 'info':
            default:
              variantStyles = 'border-cyan-agent/50 bg-surface/90 text-cyan-agent'
              icon = (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )
              break
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border backdrop-blur-xl shadow-2xl ${variantStyles}`}
            >
              <div className="shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-on-surface font-body">{toast.message}</p>
                {toast.description && (
                  <p className="text-xs text-on-surface-variant mt-1 font-body leading-relaxed">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 p-1 rounded-md opacity-50 hover:opacity-100 transition-opacity"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
