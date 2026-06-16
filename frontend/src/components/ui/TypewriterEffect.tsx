'use client'

import { useState, useEffect } from 'react'

export interface TypewriterEffectProps {
  text: string
  speed?: number
  className?: string
}

export default function TypewriterEffect({ text, speed = 15, className = '' }: TypewriterEffectProps) {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    setDisplayedText('')
    
    let currentText = ''
    let i = 0
    
    const interval = setInterval(() => {
      if (i < text.length) {
        currentText += text.charAt(i)
        setDisplayedText(currentText)
        i++
      } else {
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed])

  const isDone = displayedText.length === text.length

  return (
    <span className={className}>
      {displayedText}
      {!isDone && <span className="animate-pulse ml-1 text-accent-luminous">█</span>}
    </span>
  )
}
