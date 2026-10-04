'use client'

import { useGameStore } from '@/app/stores/gameStore'
import CoordinateLauncher from '@/components/excavation/CoordinateLauncher'
import ProbeCard from '@/components/excavation/ProbeCard'

export default function ExcavationWorkspace() {
  const probes = useGameStore((s) => s.probes)
  const artifactDust = useGameStore((s) => s.artifactDust)

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto scrollbar-dark">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
          Excavation Operations
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-(--text-secondary)">
            Dust:
          </span>
          <span className="text-xs font-mono font-bold text-(--text-accent)">
            {artifactDust}
          </span>
        </div>
      </div>

      {/* Probe bay */}
      <CoordinateLauncher />

      <div className="section-divider" />

      {/* Probe list */}
      {probes.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-xs font-mono text-(--text-secondary) text-center">
            No probes deployed. Build a probe above and launch it to a zone.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {probes.map((probe) => (
            <ProbeCard key={probe.id} probe={probe} />
          ))}
        </div>
      )}
    </div>
  )
}
