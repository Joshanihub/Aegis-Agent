'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AegisSidebar from '@/components/ui/AegisSidebar'
import AegisTopBar from '@/components/ui/AegisTopBar'
import GlassPanel from '@/components/ui/GlassPanel'
import MonoLabel from '@/components/ui/MonoLabel'
import { compareAlternative } from '@/lib/api'
import type { ComparisonData } from '@/lib/types'

function MethodBadge({ method }: { method: string }) {
  const isComplete = method === 'completed_dossier_comparison'
  const isFallback = !isComplete && method !== 'ai_dossier_comparison'
  return (
    <span className={`inline-flex px-2 py-1 rounded border font-mono text-[10px] uppercase tracking-wider ${
      isFallback
        ? 'text-amber-agent border-amber-agent/30 bg-amber-agent/10'
        : 'text-emerald-agent border-emerald-agent/30 bg-emerald-agent/10'
    }`}>
      {isComplete ? 'Completed dossier comparison' : isFallback ? 'Pending competitor dossier' : 'AI dossier comparison'}
    </span>
  )
}

function CompareContent() {
  const params = useSearchParams()
  const taskId = params.get('taskId') || ''
  const alternative = params.get('alternative') || ''
  const [comparison, setComparison] = useState<ComparisonData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!taskId || !alternative) {
      setError('Missing task id or alternative company.')
      setLoading(false)
      return
    }

    let mounted = true
    void (async () => {
      try {
        const result = await compareAlternative(taskId, alternative)
        if (mounted) setComparison(result)
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Comparison failed.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [alternative, taskId])

  const primary = comparison?.primary_company || 'Current Target'
  const alt = comparison?.alternative_company || alternative || 'Alternative'

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <AegisSidebar />
      <div className="flex-1 md:ml-[280px] flex flex-col relative h-full">
        <AegisTopBar title="Investment Comparison" subtitle="Dossier-Based Alternative Analysis" status={loading ? 'connecting' : error ? 'error' : 'complete'} />
        <main className="flex-1 overflow-y-auto mt-14 p-8 xl:p-12">
          <div className="max-w-[1100px] mx-auto flex flex-col gap-8">
            <header>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div>
                  <h1 className="font-headline text-headline-lg font-bold text-on-surface tracking-tight mb-2">
                    {primary} vs {alt}
                  </h1>
                  <p className="text-sm text-on-surface-variant max-w-2xl">
                    Competitor scores come from completed Aegis dossiers. If no completed competitor dossier exists, Aegis will ask you to run one instead of inventing a score.
                  </p>
                </div>
                {comparison && <MethodBadge method={comparison.method} />}
              </div>
            </header>

            {loading && (
              <GlassPanel className="p-12 text-center">
                <MonoLabel className="text-amber-agent animate-pulse">GENERATING COMPARISON...</MonoLabel>
                <p className="mt-3 text-sm text-on-surface-variant">Reviewing the completed dossier and alternative candidate.</p>
              </GlassPanel>
            )}

            {error && !loading && (
              <GlassPanel className="p-12 text-center border-l-2 border-l-rose-agent">
                <MonoLabel className="text-rose-agent">COMPARISON UNAVAILABLE</MonoLabel>
                <p className="mt-3 text-sm text-on-surface-variant">{error}</p>
                <Link href="/archive" className="mt-6 inline-flex px-5 py-3 rounded-md bg-primary text-on-primary font-mono text-xs font-bold uppercase tracking-widest">
                  Open Archive
                </Link>
              </GlassPanel>
            )}

            {comparison && !loading && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <GlassPanel className="p-6 border-l-2 border-l-primary">
                    <MonoLabel className="text-primary mb-3">CURRENT TARGET</MonoLabel>
                    <h2 className="font-headline text-3xl font-bold text-on-surface">{comparison.primary_company}</h2>
                    <div className="mt-6 text-6xl font-bold text-primary">{comparison.primary_risk_score}</div>
                    <p className="font-mono text-xs text-on-surface-variant uppercase tracking-widest mt-2">Risk score from completed dossier</p>
                  </GlassPanel>
                  <GlassPanel className="p-6 border-l-2 border-l-cyan-agent">
                    <MonoLabel className="text-cyan-agent mb-3">ALTERNATIVE</MonoLabel>
                    <h2 className="font-headline text-3xl font-bold text-on-surface">{comparison.alternative_company}</h2>
                    <div className="flex flex-col">
                      <span className="font-headline text-4xl text-on-surface font-bold tracking-tight">
                        {comparison.alternative_risk_score ?? 'Pending'}
                      </span>
                      <span className="text-xs text-on-surface-variant font-mono uppercase tracking-widest mt-1">
                        {comparison.alternative_risk_score === null 
                          ? 'Requires completed competitor dossier' 
                          : comparison.method === 'estimated_competitor_dossier'
                            ? 'Estimated risk score'
                            : 'Risk score from completed competitor dossier'}
                      </span>
                    </div>
                  </GlassPanel>
                </div>

                <GlassPanel className="p-6 border-l-2 border-l-emerald-agent">
                  <MonoLabel className="text-emerald-agent mb-3">RECOMMENDATION</MonoLabel>
                  <p className="text-lg text-on-surface leading-relaxed">{comparison.recommendation}</p>
                  <p className="mt-4 text-sm text-on-surface-variant leading-relaxed">{comparison.rationale}</p>
                  <p className="mt-4 font-mono text-xs text-on-surface-variant uppercase tracking-widest">
                    Confidence: {comparison.confidence}%
                  </p>
                </GlassPanel>

                <GlassPanel className="overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container-low border-b border-border-subtle">
                      <tr>
                        <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Criterion</th>
                        <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">{comparison.primary_company}</th>
                        <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">{comparison.alternative_company}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/50">
                      {comparison.criteria.map((row) => (
                        <tr key={row.criterion}>
                          <td className="px-5 py-4 font-mono text-xs text-on-surface-variant uppercase tracking-wider">{row.criterion}</td>
                          <td className="px-5 py-4 text-sm text-on-surface">{row.primary}</td>
                          <td className="px-5 py-4 text-sm text-on-surface">{row.alternative}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </GlassPanel>

                {comparison.next_steps.length > 0 && (
                  <GlassPanel className="p-6">
                    <MonoLabel className="text-on-surface-variant mb-4">NEXT STEPS</MonoLabel>
                    <ul className="space-y-3">
                      {comparison.next_steps.map((step) => (
                        <li key={step} className="flex items-start gap-3 text-sm text-on-surface-variant">
                          <span className="text-primary mt-0.5">-&gt;</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassPanel>
                )}

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/config?company=${encodeURIComponent(comparison.alternative_company)}`}
                    className="px-5 py-3 rounded-md bg-primary text-on-primary font-mono text-xs font-bold tracking-widest uppercase hover:bg-accent-luminous transition-colors"
                  >
                    Start Full Alternative Analysis
                  </Link>
                  <Link
                    href={`/verdict/${encodeURIComponent(taskId)}`}
                    className="px-5 py-3 rounded-md border border-border-subtle text-on-surface-variant font-mono text-xs font-bold tracking-widest uppercase hover:text-on-surface hover:bg-surface-container transition-colors"
                  >
                    Back To Verdict
                  </Link>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <CompareContent />
    </Suspense>
  )
}
