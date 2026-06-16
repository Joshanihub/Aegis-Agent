'use client'

export default function DashedGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
      <div 
        className="absolute inset-0 opacity-[0.03] animate-grid-fade"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--on-surface) 1px, transparent 1px),
            linear-gradient(to bottom, var(--on-surface) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
        }}
      />
    </div>
  )
}
