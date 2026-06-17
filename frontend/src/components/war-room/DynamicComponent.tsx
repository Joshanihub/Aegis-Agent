'use client'

import { motion } from 'framer-motion'
import MonoLabel from '@/components/ui/MonoLabel'

interface ChartDataPoint {
  label: string
  value: number
  unit?: string
}

export interface DynamicUIPayload {
  type: string
  title: string
  data: ChartDataPoint[]
}

interface DynamicComponentProps {
  payload: DynamicUIPayload
}

export default function DynamicComponent({ payload }: DynamicComponentProps) {
  if (payload.type === 'BarChart') {
    const maxValue = Math.max(...payload.data.map(d => d.value))

    return (
      <div className="bg-surface border border-border-subtle rounded-xl p-5 mt-4">
        <MonoLabel className="text-on-surface-variant mb-4 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          {payload.title.toUpperCase()}
        </MonoLabel>

        <div className="flex items-end gap-6 h-32 mt-2 pt-2">
          {payload.data.map((point, idx) => {
            const heightPct = maxValue > 0 ? (point.value / maxValue) * 100 : 0
            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-2 h-full group">
                <div className="text-[10px] font-mono text-on-surface-variant/80 opacity-0 group-hover:opacity-100 transition-opacity">
                  {point.value}{point.unit || ''}
                </div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-[40px] bg-indigo-init/20 border border-indigo-init/40 rounded-t-sm relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-indigo-init/20 pointer-events-none" />
                </motion.div>
                <div className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-wider">
                  {point.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-container border border-border-subtle border-dashed rounded-lg p-4 mt-4 text-xs font-mono text-on-surface-variant/50">
      [Unsupported Dynamic Component: {payload.type}]
    </div>
  )
}
