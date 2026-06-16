'use client'

interface StatusBadgeProps {
  status: string
  variant?: 'cyan' | 'rose' | 'emerald' | 'amber' | 'indigo' | 'default'
  className?: string
}

export default function StatusBadge({ status, variant = 'default', className = '' }: StatusBadgeProps) {
  const variantStyles = {
    cyan: 'bg-cyan-agent/10 text-cyan-agent border-cyan-agent/30',
    rose: 'bg-rose-agent/10 text-rose-agent border-rose-agent/30',
    emerald: 'bg-emerald-agent/10 text-emerald-agent border-emerald-agent/30',
    amber: 'bg-amber-agent/10 text-amber-agent border-amber-agent/30',
    indigo: 'bg-indigo-init/10 text-indigo-init border-indigo-init/30',
    default: 'bg-surface-bright text-on-surface border-border-subtle'
  }

  return (
    <div className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-label-caps tracking-widest ${variantStyles[variant]} ${className}`}>
      {status.toUpperCase()}
    </div>
  )
}
