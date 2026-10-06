'use client'

import { useGameStore } from '@/app/stores/gameStore'

interface Props {
  targetId: string
  children: React.ReactNode
}

// Wraps a UI element and applies a pulsing highlight when it is the
// current tutorial target. Uses CSS box-shadow keyframe from globals.css.
export default function TutorialHighlight({ targetId, children }: Props) {
  const highlightTarget = useGameStore(
    (s) => s.tutorial.tutorialHighlightTarget
  )
  const isHighlighted = highlightTarget === targetId

  return (
    <div
      className={
        isHighlighted
          ? 'tutorial-highlight rounded-xl ring-2 ring-(--border-accent) shadow-[0_0_18px_rgba(0,240,255,0.45)]'
          : undefined
      }
      aria-live={isHighlighted ? 'polite' : undefined}
    >
      {children}
    </div>
  )
}
