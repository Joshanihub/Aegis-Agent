'use client'

export interface TraceLineProps {
  className?: string
}

export default function TraceLine({ className = '' }: TraceLineProps) {
  return (
    <div className={`relative h-[2px] w-full overflow-hidden bg-surface-bright rounded-full ${className}`}>
      <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-accent-luminous blur-[2px] animate-trace-line rounded-full" style={{ animation: 'trace-line-flow 1.5s cubic-bezier(0.16, 1, 0.3, 1) infinite', animationDirection: 'normal', transformOrigin: 'left' }} />
    </div>
  )
}
