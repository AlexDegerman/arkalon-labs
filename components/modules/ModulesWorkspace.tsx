'use client'

import { useGameStore } from '@/app/stores/gameStore'
import GeneratorModuleCard from '@/components/modules/GeneratorModuleCard'

export default function ModulesWorkspace() {
  const generators = useGameStore((s) => s.generators)

  // Only show generators the player has purchased at least one of
  const ownedGeneratorIndices = generators
    .map((g, i) => (g.quantity > 0n ? i : -1))
    .filter((i) => i !== -1)

  if (ownedGeneratorIndices.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 p-4">
        <div className="card rounded-xl p-6 border border-dashed border-(--border-default) bg-(--bg-surface)/40 text-center max-w-sm">
          <p className="text-xs font-mono text-(--text-secondary) leading-relaxed">
            Purchase a Server Cluster to unlock module installation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 overflow-y-auto scrollbar-dark h-full bg-(--bg-primary)/40">
      <div className="flex flex-col gap-0.5 px-1">
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
          Generator Modules
        </p>
        <p className="text-xs text-(--text-secondary)">
          Install specialized modules to compound generator efficiency and
          unlock cross-generator synergies.
        </p>
      </div>

      <div className="section-divider" />

      <div className="flex flex-col gap-3">
        {ownedGeneratorIndices.map((index) => (
          <GeneratorModuleCard key={index} generatorIndex={index} />
        ))}
      </div>
    </div>
  )
}
