'use client'

import type { FeatureDefinition } from '@/lib/featureRegistry'

interface Props {
  feature: FeatureDefinition
}

export default function FeaturePreviewCard({ feature }: Props) {
  return (
    <div className="card rounded-2xl border border-(--border-default) bg-(--bg-surface)/95 p-6 flex flex-col gap-3 max-w-sm mx-auto shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-2.5 border-b border-(--border-default) pb-3">
        <span
          className="text-xl shrink-0 select-none text-(--status-locked)"
          aria-hidden="true"
        >
          &#x1F512;
        </span>
        <h3 className="text-sm font-black font-mono uppercase tracking-widest text-(--text-primary)">
          {feature.label}
        </h3>
      </div>

      <p className="text-xs text-(--text-secondary) leading-relaxed">
        {feature.description}
      </p>

      <div className="rounded-lg bg-(--bg-elevated) border border-(--border-accent)/30 p-3 mt-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-(--text-secondary) block mb-0.5">
          Unlock Directive:
        </span>
        <p className="text-xs font-mono font-bold text-(--text-accent)">
          {feature.unlockHint}
        </p>
      </div>
    </div>
  )
}
