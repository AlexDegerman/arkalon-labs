'use client'

import FeaturePreviewCard from '@/components/ui/FeaturePreviewCard'
import type { FeatureDefinition } from '@/lib/featureRegistry'

interface Props {
  feature: FeatureDefinition
  children: React.ReactNode
}

// Wraps any workspace panel. When locked, shows the preview card overlay.
// When unlocked, renders children normally.
export default function FeatureLockOverlay({ feature, children }: Props) {
  // Lock state is always unlocked at this commit; wired in Commit 4.2
  const isLocked = false

  if (!isLocked) {
    return <>{children}</>
  }

  return (
    <div className="relative w-full h-full min-h-50">
      {/* Blurred content behind */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none blur-sm opacity-30">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-4 bg-(--bg-primary)/60">
        <FeaturePreviewCard feature={feature} />
      </div>
    </div>
  )
}
