'use client'

import type { VerdictData, ReasoningStep } from '@/lib/types'
import VerdictBadge from '@/components/verdict/VerdictBadge'
import VulnerabilityList from '@/components/verdict/VulnerabilityList'
import ReasoningChain from '@/components/verdict/ReasoningChain'
import ExportDossier from '@/components/verdict/ExportDossier'
import GlassPanel from '@/components/ui/GlassPanel'
import MonoLabel from '@/components/ui/MonoLabel'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export interface DossierCardProps {
  verdict: VerdictData
  companyName?: string
}

// Maps **Heading** bold-markdown into structured sections
function parseSections(text: string): { heading: string | null; body: string }[] {
  if (!text) return []
  const parts: { heading: string | null; body: string }[] = []
  // Split on lines that start with ** (heading lines)
  const lines = text.split('\n')
  let currentHeading: string | null = null
  let currentBody: string[] = []

  for (const line of lines) {
    const headingMatch = line.match(/^\*\*([^*]+)\*\*\s*$/)
    if (headingMatch) {
      if (currentBody.length > 0 || currentHeading !== null) {
        parts.push({ heading: currentHeading, body: currentBody.join('\n').trim() })
      }
      currentHeading = headingMatch[1].trim()
      currentBody = []
    } else {
      // Also handle inline **Heading** — text
      const inlineMatch = line.match(/^\*\*([^*]+)\*\*\s*[—–-]?\s*(.*)$/)
      if (inlineMatch && inlineMatch[1].length < 40) {
        if (currentBody.length > 0 || currentHeading !== null) {
          parts.push({ heading: currentHeading, body: currentBody.join('\n').trim() })
        }
        currentHeading = inlineMatch[1].trim()
        currentBody = inlineMatch[2] ? [inlineMatch[2]] : []
      } else {
        currentBody.push(line)
      }
    }
  }

  if (currentHeading !== null || currentBody.length > 0) {
    parts.push({ heading: currentHeading, body: currentBody.join('\n').trim() })
  }

  // Fallback: if parsing produced nothing useful, return raw text
  const hasContent = parts.some(p => p.body.length > 20)
  if (!hasContent) {
    return [{ heading: null, body: text.trim() }]
  }

  return parts.filter(p => p.body.trim().length > 0)
}

const SECTION_COLORS: Record<string, string> = {
  'Overview': 'text-primary',
  'Financial Assessment': 'text-amber-agent',
  'Risk Analysis': 'text-rose-agent',
  'Strategic Position': 'text-cyan-agent',
  'Recommendation': 'text-emerald-agent',
  'Market Position': 'text-indigo-init',
  'Competitive Landscape': 'text-cyan-agent',
  'Historical Context': 'text-amber-agent',
  'Future Path': 'text-indigo-init',
  'Conditions': 'text-amber-agent',
}

function SummaryNarrative({ text }: { text: string }) {
  const sections = parseSections(text)

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          {section.heading && (
            <div className={`text-[11px] font-mono font-bold uppercase tracking-[0.15em] mb-2 flex items-center gap-2 ${SECTION_COLORS[section.heading] ?? 'text-on-surface-variant'}`}>
              <div className={`w-1 h-3 rounded-full ${SECTION_COLORS[section.heading] ? 'bg-current' : 'bg-on-surface-variant'}`} />
              {section.heading}
            </div>
          )}
          <p className="text-sm text-on-surface/90 leading-relaxed font-body whitespace-pre-wrap">
            {section.body}
          </p>
        </motion.div>
      ))}
    </div>
  )
}

// Removed AgentProfileCard as it is now handled by ReasoningChain

export default function DossierCard({ verdict, companyName = 'Target Company' }: DossierCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6"
    >
      {/* ── VERDICT HEADER ── */}
      <div className="glass-panel relative overflow-hidden flex flex-col gap-6 p-8 border-l-4 border-l-primary">
        <div className="absolute inset-0 bg-gradient-to-r from-surface-glass to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <VerdictBadge verdict={verdict.verdict} />
          <div className="flex flex-col items-end gap-4">
            <div className="shrink-0 md:text-right">
              <MonoLabel className="text-on-surface-variant">Final Risk Score</MonoLabel>
              <div className="mt-1 text-6xl font-bold text-primary tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                {verdict.risk_score}
              </div>
              <div className="text-xs text-on-surface-variant/60 mt-2 font-mono flex items-center md:justify-end gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-agent" />
                Audited &amp; cryptographically signed
              </div>
            </div>
            <ExportDossier verdict={verdict} companyName={companyName} />
          </div>
        </div>

        {/* Executive Summary */}
        <div className="relative z-10 border-t border-border-subtle pt-6">
          <MonoLabel className="text-on-surface-variant mb-5 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            EXECUTIVE SUMMARY
          </MonoLabel>
          <SummaryNarrative text={verdict.summary} />
        </div>
      </div>

      {/* ── REASONING CHAIN & CITATIONS ── */}
      {verdict.reasoning_chain && verdict.reasoning_chain.length > 0 && (
        <GlassPanel className="p-6">
          <ReasoningChain steps={verdict.reasoning_chain} citations={verdict.citations} />
        </GlassPanel>
      )}

      {/* ── VULNERABILITIES ── */}
      <VulnerabilityList vulnerabilities={verdict.vulnerabilities} />

      {/* ── HISTORICAL CONTEXT + FUTURE PATH ── */}
      {(verdict.historical_context || verdict.future_path) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {verdict.historical_context && (
            <GlassPanel className="p-6 border-l-2 border-l-amber-agent/50">
              <MonoLabel className="text-amber-agent mb-4 flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                HISTORICAL CONTEXT
              </MonoLabel>
              <p className="text-sm text-on-surface/80 leading-relaxed whitespace-pre-wrap">{verdict.historical_context}</p>
            </GlassPanel>
          )}
          {verdict.future_path && (
            <GlassPanel className="p-6 border-l-2 border-l-indigo-init/50">
              <MonoLabel className="text-indigo-init mb-4 flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                FUTURE PATH PROJECTION
              </MonoLabel>
              <p className="text-sm text-on-surface/80 leading-relaxed whitespace-pre-wrap">{verdict.future_path}</p>
            </GlassPanel>
          )}
        </div>
      )}

      {/* ── CONDITIONS FOR APPROVAL ── */}
      {verdict.conditions && verdict.conditions.length > 0 && (
        <GlassPanel className="p-6 border-l-2 border-l-amber-agent">
          <MonoLabel className="text-amber-agent mb-4 flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            CONDITIONS FOR APPROVAL
          </MonoLabel>
          <ul className="space-y-3">
            {verdict.conditions.map((condition, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-on-surface-variant leading-relaxed">
                <span className="text-amber-agent mt-0.5 shrink-0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span>{condition}</span>
              </li>
            ))}
          </ul>
        </GlassPanel>
      )}

      {/* ── COMPETITIVE ALTERNATIVES ── */}
      {verdict.competitive_alternatives && verdict.competitive_alternatives.length > 0 && (
        <GlassPanel className="p-6 border-l-2 border-l-cyan-agent">
          <MonoLabel className="text-cyan-agent mb-4 flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
            COMPETITIVE ALTERNATIVES
          </MonoLabel>
          <div className="flex flex-wrap gap-2">
            {verdict.competitive_alternatives.map((alt, idx) => (
              <span key={idx} className="px-3 py-1.5 rounded-md bg-surface-container border border-border-subtle text-sm text-on-surface font-mono">
                {alt}
              </span>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* ── SOURCE ATTRIBUTION ── */}
      <GlassPanel className="p-5 border-t-2 border-t-primary bg-surface-container/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <MonoLabel className="text-on-surface-variant text-[10px] mb-1">SOURCE ATTRIBUTION</MonoLabel>
            <p className="text-xs text-on-surface-variant/50 font-mono">Inference engines utilized for this analysis protocol</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(verdict.reasoning_chain.map(r => r.api))).map(api => (
              <div key={api} className="px-3 py-2 rounded-lg bg-surface border border-border-subtle flex flex-col">
                <span className="text-[9px] text-on-surface-variant/50 font-mono uppercase tracking-wider mb-0.5">Engine</span>
                <span className="text-xs font-bold text-on-surface font-mono">{api}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  )
}
