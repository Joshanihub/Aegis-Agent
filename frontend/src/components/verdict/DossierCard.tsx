'use client'

import type { VerdictData } from '@/lib/types'
import VerdictBadge from '@/components/verdict/VerdictBadge'
import VulnerabilityList from '@/components/verdict/VulnerabilityList'
import ReasoningChain from '@/components/verdict/ReasoningChain'
import GlassPanel from '@/components/ui/GlassPanel'
import MonoLabel from '@/components/ui/MonoLabel'
import { motion } from 'framer-motion'

export interface DossierCardProps {
  verdict: VerdictData
}

// Parses the AI's structured report into section blocks with headings
function SummaryNarrative({ text }: { text: string }) {
  if (!text) return null

  // Split on **Heading** — bold markdown headings the AI writes
  const sectionRegex = /\*\*([^*]+)\*\*/g
  const parts: { heading: string | null; body: string }[] = []
  let lastIndex = 0
  let match

  // Collect leading text before first heading
  const firstMatch = sectionRegex.exec(text)
  if (firstMatch && firstMatch.index > 0) {
    parts.push({ heading: null, body: text.slice(0, firstMatch.index).trim() })
  }
  // Reset regex
  sectionRegex.lastIndex = 0

  while ((match = sectionRegex.exec(text)) !== null) {
    const heading = match[1]
    const start = match.index + match[0].length
    // Find next heading or end
    const nextMatch = sectionRegex.exec(text)
    const end = nextMatch ? nextMatch.index : text.length
    // Back up regex so we process the next heading in the next loop iteration
    if (nextMatch) sectionRegex.lastIndex = nextMatch.index
    const body = text.slice(start).split('**')[0].replace(/^\s*[—–-]\s*/, '').trim()
    if (body) parts.push({ heading, body })
  }

  // Fallback: just render as prose if parsing found nothing
  if (parts.length === 0) {
    return (
      <p className="text-sm text-on-surface leading-relaxed font-body">{text}</p>
    )
  }

  const sectionColors: Record<string, string> = {
    'Overview': 'text-primary',
    'Financial Assessment': 'text-amber-agent',
    'Risk Analysis': 'text-rose-agent',
    'Strategic Position': 'text-cyan-agent',
    'Recommendation': 'text-emerald-agent',
  }

  return (
    <div className="flex flex-col gap-5">
      {parts.map((part, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-1"
        >
          {part.heading && (
            <span className={`text-[11px] font-mono font-bold uppercase tracking-widest ${
              sectionColors[part.heading] ?? 'text-on-surface-variant'
            }`}>
              {part.heading}
            </span>
          )}
          <p className="text-sm text-on-surface/90 leading-relaxed font-body">
            {part.body}
          </p>
        </motion.div>
      ))}
    </div>
  )
}


export default function DossierCard({ verdict }: DossierCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-4"
    >
      <div className="glass-panel relative overflow-hidden flex flex-col gap-6 !p-8 border-l-4 border-l-primary ambient-glow">
        <div className="absolute inset-0 bg-gradient-to-r from-surface-glass to-transparent" />
        
        {/* Verdict Header */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <VerdictBadge verdict={verdict.verdict} />
          <div className="shrink-0 md:text-right">
            <MonoLabel className="text-on-surface-variant">Final Risk Score</MonoLabel>
            <div className="mt-2 text-6xl font-bold font-display text-primary tracking-tight">
              {verdict.risk_score}
            </div>
            <div className="text-xs text-on-surface-variant/70 mt-3 font-mono flex items-center md:justify-end gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-agent" />
              Audited &amp; cryptographically signed
            </div>
          </div>
        </div>

        {/* Full Narrative Summary */}
        <div className="relative z-10 border-t border-border-subtle pt-6">
          <MonoLabel className="text-on-surface-variant mb-4 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
            EXECUTIVE SUMMARY
          </MonoLabel>
          <SummaryNarrative text={verdict.summary} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VulnerabilityList vulnerabilities={verdict.vulnerabilities} />
        <ReasoningChain chain={verdict.reasoning_chain} />
      </div>

      {(verdict.historical_context || verdict.future_path) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {verdict.historical_context && (
            <GlassPanel className="p-5">
              <MonoLabel className="text-on-surface-variant mb-2">Historical Context</MonoLabel>
              <p className="text-sm text-on-surface/80 leading-relaxed">{verdict.historical_context}</p>
            </GlassPanel>
          )}
          {verdict.future_path && (
            <GlassPanel className="p-5">
              <MonoLabel className="text-on-surface-variant mb-2">Future Path Projection</MonoLabel>
              <p className="text-sm text-on-surface/80 leading-relaxed">{verdict.future_path}</p>
            </GlassPanel>
          )}
        </div>
      )}

      {verdict.conditions && verdict.conditions.length > 0 && (
        <GlassPanel className="p-5 border-l-2 border-l-amber-agent bg-surface-container/30">
          <MonoLabel className="text-amber-agent mb-3 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            CONDITIONS FOR APPROVAL
          </MonoLabel>
          <ul className="space-y-2">
            {verdict.conditions.map((condition, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-on-surface-variant leading-relaxed">
                <span className="text-amber-agent mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>{condition}</span>
              </li>
            ))}
          </ul>
        </GlassPanel>
      )}

      {verdict.competitive_alternatives && verdict.competitive_alternatives.length > 0 && (
        <GlassPanel className="p-5 border-l-2 border-l-cyan-agent bg-surface-container/30">
          <MonoLabel className="text-cyan-agent mb-3 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20V10M18 20V4M6 20v-4"/>
            </svg>
            COMPETITIVE ALTERNATIVES
          </MonoLabel>
          <div className="flex flex-wrap gap-2">
            {verdict.competitive_alternatives.map((alt, idx) => (
              <span key={idx} className="px-3 py-1.5 rounded-md bg-surface-container border border-border-subtle text-sm text-on-surface">
                {alt}
              </span>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Source Attribution */}
      <GlassPanel className="p-6 bg-surface-container-lowest border-t-2 border-t-primary">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <MonoLabel className="text-on-surface-variant mb-1 text-xs">SOURCE ATTRIBUTION</MonoLabel>
            <p className="text-xs text-on-surface-variant/70 font-mono">Inference engines utilized for this analysis protocol</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {Array.from(new Set(verdict.reasoning_chain.map(r => r.api))).map(api => (
              <div key={api} className="px-3 py-1.5 rounded bg-surface border border-border-subtle flex flex-col">
                <span className="text-[9px] text-on-surface-variant font-mono uppercase tracking-wider mb-0.5">Model Engine</span>
                <span className="text-xs font-bold text-on-surface">{api}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  )
}
