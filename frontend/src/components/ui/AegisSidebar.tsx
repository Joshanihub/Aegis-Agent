'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

export interface AegisSidebarProps {
  onNewAnalysis?: () => void
}

const navItems = [
  {
    href: '/config',
    label: 'Analysis',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    matchExact: true,
  },
  {
    href: '/war-room',
    label: 'War Room',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        <path d="m4.93 4.93 2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
      </svg>
    ),
    matchPrefix: true,
  },
  {
    href: '/verdict',
    label: 'Verdicts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4" />
        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
      </svg>
    ),
    matchPrefix: true,
  },
  {
    href: '/audit-trail',
    label: 'Audit Trail',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
  },
  {
    href: '/support',
    label: 'Support',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
]

import { useAegisStore } from '@/lib/store'

export default function AegisSidebar({ onNewAnalysis }: AegisSidebarProps) {
  const pathname = usePathname()
  const taskId = useAegisStore((state) => state.taskId)
  const recentSessions = useAegisStore((state) => state.recentSessions) || []

  return (
    <nav className="hidden md:flex flex-col h-full py-0 bg-surface-glass backdrop-blur-xl fixed left-0 top-0 w-[280px] border-r border-border-subtle z-50">
      {/* Brand Header */}
      <div className="px-6 py-5 flex items-center gap-3 border-b border-border-subtle/50 mb-4">
        <div className="w-9 h-9 rounded-lg bg-primary-container/20 border border-primary-container/30 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-luminous)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h1 className="font-headline text-base font-bold text-primary tracking-tight leading-none">AEGIS</h1>
          <p className="font-mono text-[10px] text-on-surface-variant mt-0.5 tracking-[0.08em]">INVESTMENT COMMITTEE</p>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto px-2 flex flex-col gap-0.5">
        {navItems.map((item) => {
          let resolvedHref = item.href
          let isDisabled = false

          if (item.href === '/war-room' || item.href === '/verdict') {
            if (taskId) {
              resolvedHref = `${item.href}/${encodeURIComponent(taskId)}`
            } else {
              isDisabled = true
              resolvedHref = '#'
            }
          } else if (item.href === '#') {
            isDisabled = true
          }

          const isActive = !isDisabled && (
            item.matchExact
              ? pathname === item.href
              : item.matchPrefix
                ? pathname.startsWith(item.href)
                : false
          )

          return (
            <Link
              key={item.label}
              href={resolvedHref}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] font-mono tracking-[0.05em] transition-all duration-200 ${
                isDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
              } ${
                isActive
                  ? 'text-primary font-bold border-r-2 border-primary bg-surface-variant/10 -mr-2 pr-6'
                  : 'text-on-surface-variant hover:bg-surface-variant/20 hover:text-on-surface'
              }`}
            >
              <span className={isActive ? 'text-primary' : 'text-on-surface-variant'}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div className="px-4 py-4 border-t border-border-subtle/50">
          <p className="font-mono text-[10px] text-on-surface-variant/70 mb-2 tracking-[0.08em] uppercase">Recent Sessions</p>
          <div className="flex flex-col gap-1">
            {recentSessions.map((session) => (
              <Link 
                key={session.taskId}
                href={`/verdict/${encodeURIComponent(session.taskId)}`}
                className="text-xs font-mono text-on-surface-variant hover:text-primary truncate px-2 py-1 rounded hover:bg-surface-variant/10 transition-colors"
                title={session.companyName}
              >
                {session.companyName}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA + Footer */}
      <div className="px-4 pb-4 flex flex-col gap-3 pt-4 border-t border-border-subtle/50">
        <motion.button
          onClick={onNewAnalysis}
          className="w-full bg-primary-container text-on-primary-container font-mono text-[11px] tracking-[0.08em] py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          NEW ANALYSIS
        </motion.button>
      </div>
    </nav>
  )
}
