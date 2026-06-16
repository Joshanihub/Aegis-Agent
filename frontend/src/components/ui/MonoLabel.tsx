'use client'

interface MonoLabelProps {
  children: React.ReactNode
  className?: string
}

export default function MonoLabel({ children, className = '' }: MonoLabelProps) {
  return (
    <span className={`font-mono text-[12px] uppercase tracking-[0.1em] font-medium ${className}`}>
      {children}
    </span>
  )
}
