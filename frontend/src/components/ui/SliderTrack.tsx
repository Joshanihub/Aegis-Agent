'use client'

interface SliderTrackProps {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  id: string
  name?: string
}

export default function SliderTrack({ min, max, value, onChange, id, name }: SliderTrackProps) {
  return (
    <div className="relative w-full h-8 flex items-center">
      <input
        type="range"
        id={id}
        name={name}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-surface-container-highest [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:-mt-1.5 focus-visible:outline-none focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-accent-luminous focus-visible:[&::-webkit-slider-thumb]:ring-offset-2 focus-visible:[&::-webkit-slider-thumb]:ring-offset-surface"
      />
      <div 
        className="absolute left-0 h-2 bg-primary rounded-full pointer-events-none" 
        style={{ width: `${((value - min) / (max - min)) * 100}%`, top: '12px' }}
      />
    </div>
  )
}
