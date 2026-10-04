'use client'

import { useGameStore } from '@/app/stores/gameStore'
import GeneratorModuleCard from '@/components/modules/GeneratorModuleCard'
import { GENERATORS } from '@/constants/generators'

export default function ModulesWorkspace() {
  const generators = useGameStore((s) => s.generators)

  // Only show generators the player has purchased at least one of
  const ownedGeneratorIndices = generators
    .map((g, i) => (g.quantity > 0n ? i : -1))
    .filter((i) => i !== -1)

  if (ownedGeneratorIndices.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 p-4">
        <p className="terminal text-(--text-secondary) text-xs text-center">
          Purchase a Server Cluster to unlock module installation.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto scrollbar-dark h-full">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
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
