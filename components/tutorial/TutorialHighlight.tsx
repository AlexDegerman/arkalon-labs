'use client'

import { useGameStore } from '@/app/stores/gameStore'

interface Props {
  targetId: string
  children: React.ReactNode
  className?: string
}

// Wraps a UI element and applies a steady highlight ring when it is the
// current tutorial target. Uses CSS box-shadow from globals.css.
export default function TutorialHighlight({
  targetId,
  children,
  className
}: Props) {
  const highlightTarget = useGameStore(
    (s) => s.tutorial.tutorialHighlightTarget
  )
  const isHighlighted = highlightTarget === targetId

  return (
    <div
      className={
        [
          className,
          isHighlighted
            ? 'tutorial-highlight rounded-xl ring-2 ring-inset ring-(--border-accent) shadow-[0_0_18px_rgba(0,240,255,0.45)]'
            : ''
        ]
          .filter(Boolean)
          .join(' ') || undefined
      }
      aria-live={isHighlighted ? 'polite' : undefined}
    >
      {children}
    </div>
  )
}