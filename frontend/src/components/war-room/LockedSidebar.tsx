'use client'

import RiskRing from '@/components/verdict/RiskRing'
import GlassPanel from '@/components/ui/GlassPanel'

export interface LockedSidebarProps {
  currentRisk: number
}

export default function LockedSidebar({ currentRisk }: LockedSidebarProps) {
  return (
    <div className="w-full md:w-[280px] shrink-0 flex flex-col gap-6">
      <GlassPanel className="flex flex-col items-center text-center !p-6" delay={0.1}>
        <RiskRing score={currentRisk} size={160} strokeWidth={12} />
      </GlassPanel>
      <div className="hidden md:block">
        <GlassPanel delay={0.2}>
          <h3 className="font-headline text-sm font-semibold mb-3 text-on-surface">Protocol Active</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
            Aegis Agent is running a strict multi-agent workflow. The Analyst and Reviewer agents are cross-verifying data before Finalizer approval.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
              <div className="w-1.5 h-1.5 bg-accent-luminous rounded-full" /> Immutable Audit Trail
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
              <div className="w-1.5 h-1.5 bg-accent-luminous rounded-full" /> Zero Knowledge Proof
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
              <div className="w-1.5 h-1.5 bg-accent-luminous rounded-full" /> Consensus Required
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
