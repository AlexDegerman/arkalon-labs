'use client'

import { useGameStore } from '@/app/stores/gameStore'
import FeaturePreviewCard from '@/components/ui/FeaturePreviewCard'
import type { FeatureDefinition } from '@/lib/featureRegistry'

interface Props {
  feature: FeatureDefinition
  children: React.ReactNode
}

// Wraps any workspace panel. When locked, shows the preview card overlay.
// When unlocked, renders children normally.
export default function FeatureLockOverlay({ feature, children }: Props) {
  const isUnlocked = useGameStore((s) => s.unlocks[feature.key])

  if (isUnlocked) {
    return <>{children}</>
  }

  return (
    <div className="relative w-full h-full min-h-56 flex items-center justify-center">
      {/* Blurred background content */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none select-none"
        style={{ filter: 'blur(5px)', opacity: 0.15 }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Lock Preview Card Overlay */}
      <div className="relative z-10 p-4">
        <FeaturePreviewCard feature={feature} />
      </div>
    </div>
  )
}
