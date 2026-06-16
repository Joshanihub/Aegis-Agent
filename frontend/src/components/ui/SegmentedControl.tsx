'use client'

import { motion } from 'framer-motion'

interface SegmentedControlProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  name: string
}

export default function SegmentedControl({ options, value, onChange, name }: SegmentedControlProps) {
  return (
    <div className="flex p-1 bg-surface-container-highest rounded-lg border border-border-subtle" role="radiogroup" aria-label={name}>
      {options.map((opt) => {
        const isSelected = value === opt.value
        return (
          <motion.label
            key={opt.value}
            className={`relative flex-1 py-2 text-center text-sm font-medium cursor-pointer rounded-md`}
            animate={{ 
              color: isSelected ? 'var(--surface)' : 'var(--on-surface-variant)' 
            }}
            whileHover={!isSelected ? { color: 'var(--on-surface)' } : {}}
            transition={{ duration: 0.2 }}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isSelected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {isSelected && (
              <motion.div
                layoutId={`segmented-bg-${name}`}
                className="absolute inset-0 bg-primary rounded-md"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 font-body">{opt.label}</span>
          </motion.label>
        )
      })}
    </div>
  )
}
