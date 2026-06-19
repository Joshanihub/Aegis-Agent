'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AegisSidebar from '@/components/ui/AegisSidebar'
import AegisTopBar from '@/components/ui/AegisTopBar'
import GlassPanel from '@/components/ui/GlassPanel'
import MonoLabel from '@/components/ui/MonoLabel'
import { getSessions } from '@/lib/api'
import type { SessionSummary, TaskStatus } from '@/lib/types'

function sessionHref(session: SessionSummary) {
  return session.status === 'complete'
    ? `/verdict/${encodeURIComponent(session.task_id)}`
    : `/war-room/${encodeURIComponent(session.task_id)}`
}

function statusClass(status: TaskStatus) {
  if (status === 'complete') return 'text-emerald-agent border-emerald-agent/30 bg-emerald-agent/10'
  if (status === 'error' || status === 'cancelled') return 'text-rose-agent border-rose-agent/30 bg-rose-agent/10'
  return 'text-amber-agent border-amber-agent/30 bg-amber-agent/10'
}

export default function ArchivePage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        setSessions(await getSessions())
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sessions.filter((session) => {
      const matchesQuery = !q || session.company_name.toLowerCase().includes(q) || session.task_id.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || session.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [query, sessions, statusFilter])

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <AegisSidebar />
      <div className="flex-1 md:ml-[280px] flex flex-col relative h-full">
        <AegisTopBar title="Session Archive" subtitle="Searchable Analysis History" status="idle" />
        <main className="flex-1 overflow-y-auto mt-14 p-8 xl:p-12">
          <div className="max-w-[1300px] mx-auto flex flex-col gap-8">
            <header>
              <h1 className="font-headline text-headline-lg font-bold text-on-surface tracking-tight mb-2">
                Analysis Archive
              </h1>
              <p className="text-sm text-on-surface-variant max-w-2xl">
                Review every persisted analysis, including in-progress rooms, cancelled runs, and completed verdicts.
              </p>
            </header>

            <GlassPanel className="p-5 flex flex-col md:flex-row gap-3 md:items-center">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search company or task id..."
                className="flex-1 bg-surface-container border border-border-subtle rounded-md px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | TaskStatus)}
                className="bg-surface-container border border-border-subtle rounded-md px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="all">All statuses</option>
                <option value="complete">Complete</option>
                <option value="planning">Planning</option>
                <option value="analyzing">Analyzing</option>
                <option value="reviewing">Reviewing</option>
                <option value="finalizing">Finalizing</option>
                <option value="cancelled">Cancelled</option>
                <option value="error">Error</option>
              </select>
            </GlassPanel>

            <GlassPanel className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low/70 border-b border-border-subtle">
                    <tr>
                      <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Target</th>
                      <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Status</th>
                      <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Risk</th>
                      <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Messages</th>
                      <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Updated</th>
                      <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Open</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/50">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-sm text-on-surface-variant">Loading archive...</td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-sm text-on-surface-variant">No sessions match this filter.</td>
                      </tr>
                    ) : filtered.map((session) => (
                      <tr key={session.task_id} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-mono text-sm font-bold text-on-surface">{session.company_name}</div>
                          <div className="font-mono text-[10px] text-on-surface-variant/50 mt-1">{session.task_id}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2 py-1 rounded border font-mono text-[10px] uppercase tracking-wider ${statusClass(session.status)}`}>
                            {session.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-sm text-on-surface">
                          {session.risk_score ?? 'Pending'}
                        </td>
                        <td className="px-5 py-4 font-mono text-sm text-on-surface-variant">{session.message_count}</td>
                        <td className="px-5 py-4 font-mono text-xs text-on-surface-variant">
                          {new Date(session.updated_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-4">
                          <Link href={sessionHref(session)} className="font-mono text-xs text-primary hover:text-accent-luminous uppercase tracking-widest">
                            {session.status === 'complete' ? 'Verdict' : 'War Room'}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassPanel>

            <MonoLabel className="text-on-surface-variant">
              {filtered.length} SESSION{filtered.length === 1 ? '' : 'S'} SHOWN
            </MonoLabel>
          </div>
        </main>
      </div>
    </div>
  )
}
