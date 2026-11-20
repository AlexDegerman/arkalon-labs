'use client'

import { useGameStore } from '@/app/stores/gameStore'

interface Props {
  targetId: string
  // Position relative to parent: 'above' | 'below' | 'left' | 'right'
  direction?: 'above' | 'below'
}

// Renders a bouncing arrow indicator when the given target is active.
export default function TutorialArrow({
  targetId,
  direction = 'above'
}: Props) {
  const highlightTarget = useGameStore(
    (s) => s.tutorial.tutorialHighlightTarget
  )

  if (highlightTarget !== targetId) return null

  // Arrow points toward target: DOWN when above, UP when below
  const arrowChar = direction === 'above' ? '▼' : '▲'

  return (
    <div
      className={[
        'flex items-center justify-center pointer-events-none z-30 select-none',
        direction === 'above' ? 'mb-1' : 'mt-1'
      ].join(' ')}
      aria-hidden="true"
    >
      <span
        className={[
          'text-(--border-accent) text-base font-black drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]',
          direction === 'above' ? 'tutorial-arrow-down' : 'tutorial-arrow-up'
        ].join(' ')}
      >
        {arrowChar}
      </span>
    </div>
  )
}
