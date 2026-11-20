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
      {/* Static blueprint backdrop (locked workspaces are not mounted) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-15"
        style={{
          backgroundImage:
            'linear-gradient(var(--border-default) 1px, transparent 1px), linear-gradient(90deg, var(--border-default) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          filter: 'blur(2px)'
        }}
        aria-hidden="true"
      />
      {/* Lock Preview Card Overlay */}
      <div className="relative z-10 p-4">
        <FeaturePreviewCard feature={feature} />
      </div>
    </div>
  )
}
