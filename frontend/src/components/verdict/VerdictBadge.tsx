'use client'

import type { VerdictType } from '@/lib/types'
import MonoLabel from '@/components/ui/MonoLabel'

export interface VerdictBadgeProps {
  verdict: VerdictType
}

export default function VerdictBadge({ verdict }: VerdictBadgeProps) {
  const style = (() => {
    if (verdict === 'approve') return 'bg-emerald-agent/10 border-emerald-agent/30 text-emerald-agent'
    if (verdict === 'caution') return 'bg-amber-agent/10 border-amber-agent/30 text-amber-agent'
    return 'bg-crimson-reject/10 border-crimson-reject/30 text-crimson-reject'
  })()

  const headline =
    verdict === 'approve'
      ? 'INVESTMENT APPROVED'
      : verdict === 'caution'
        ? 'PROCEED WITH CONDITIONS'
        : 'INVESTMENT REJECTED'

  const baseStyle = 'inline-flex items-center px-6 py-2.5 rounded-full border border-b-2 shadow-sm font-semibold tracking-[0.05em] clip-aperture-wipe'
  
  return (
    <div className={`${baseStyle} ${style}`}>
      <span className="relative flex items-center justify-center w-2.5 h-2.5 mr-3">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${verdict === 'approve' ? 'bg-emerald-agent' : verdict === 'caution' ? 'bg-amber-agent' : 'bg-crimson-reject'}`}></span>
        <span className={`relative inline-flex rounded-full w-1.5 h-1.5 ${verdict === 'approve' ? 'bg-emerald-agent' : verdict === 'caution' ? 'bg-amber-agent' : 'bg-crimson-reject'}`}></span>
      </span>
      <MonoLabel className="text-[14px]">{headline}</MonoLabel>
    </div>
  )
}
