'use client'

import { useGameStore } from '@/app/stores/gameStore'

interface Props {
  targetId: string
  // Position relative to parent: 'above' | 'below' | 'left' | 'right'
  direction?: 'above' | 'below'
}

// Renders a bouncing arrow indicator when the given target is active.
// The arrow uses CSS translateY keyframe from globals.css.
export default function TutorialArrow({
  targetId,
  direction = 'above'
}: Props) {
  const highlightTarget = useGameStore(
    (s) => s.tutorial.tutorialHighlightTarget
  )

  if (highlightTarget !== targetId) return null

  return (
    <div
      className={[
        'flex items-center justify-center pointer-events-none z-30 select-none',
        direction === 'above' ? 'mb-1.5' : 'mt-1.5'
      ].join(' ')}
      aria-hidden="true"
    >
      <span
        className="tutorial-arrow text-(--border-accent) text-xl font-black drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]"
        style={{
          transform: direction === 'below' ? 'rotate(180deg)' : undefined
        }}
      >
        &#x25B2;
      </span>
    </div>
  )
}
