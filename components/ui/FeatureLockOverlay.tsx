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
    <div className="relative w-full h-full min-h-50">
      {/* Blurred background content */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none select-none"
        style={{ filter: 'blur(3px)', opacity: 0.25 }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-4 bg-(--bg-primary)/70">
        <FeaturePreviewCard feature={feature} />
      </div>
    </div>
  )
}
