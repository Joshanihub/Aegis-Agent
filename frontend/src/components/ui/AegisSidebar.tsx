'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAegisStore } from '@/lib/store'

export interface AegisSidebarProps {
  onNewAnalysis?: () => void
}

const navItems = [
  {
    href: '/dashboard',
    label: 'Overview Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    matchExact: true,
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
    matchExact: true,
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
    matchExact: true,
  },
]

export default function AegisSidebar({ onNewAnalysis }: AegisSidebarProps) {
  const pathname = usePathname()
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
          const isActive = pathname === item.href

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] font-mono tracking-[0.05em] transition-all duration-200 ${
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
        <div className="px-4 py-4 border-t border-border-subtle/50 relative group">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-[10px] text-on-surface-variant/70 tracking-[0.08em] uppercase">Recent Sessions</p>
            <button 
              onClick={() => useAegisStore.getState().clearSessions()}
              className="text-text-muted hover:text-rose-agent transition-colors opacity-0 group-hover:opacity-100"
              title="Clear Session History"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
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
        <Link href="/config">
          <motion.div
            className="w-full bg-primary-container text-on-primary-container font-mono text-[11px] tracking-[0.08em] py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            NEW ANALYSIS
          </motion.div>
        </Link>
      </div>
    </nav>
  )
}
