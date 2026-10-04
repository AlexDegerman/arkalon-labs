'use client'

import type { FeatureDefinition } from '@/lib/featureRegistry'

interface Props {
  feature: FeatureDefinition
}

export default function FeaturePreviewCard({ feature }: Props) {
  return (
    <div className="glass rounded-lg border border-(--border-default) p-6 flex flex-col gap-3 max-w-sm mx-auto">
      <div className="flex items-center gap-2">
        <span
          className="text-(--status-locked) text-lg"
          aria-hidden="true"
        >
          &#x1F512;
        </span>
        <h3 className="text-sm font-semibold text-(--text-primary)">
          {feature.label}
        </h3>
      </div>

      <p className="text-xs text-(--text-secondary) leading-relaxed">
        {feature.description}
      </p>

      <div className="border-t border-(--border-default) pt-3">
        <p className="text-xs text-(--text-accent) font-mono">
          {feature.unlockHint}
        </p>
      </div>
    </div>
  )
}
