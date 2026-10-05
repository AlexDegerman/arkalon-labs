'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { buildProbe } from '@/app/stores/actions'
import { meetsProbeGateRequirements, canBuildProbe } from '@/lib/excavationDefs'
import { formatPoints } from '@/lib/format'
import { PROBE_COST_RP, MAX_PROBES } from '@/constants/game'

export default function CoordinateLauncher() {
  const store = useGameStore.getState()
  const probes = useGameStore((s) => s.probes)
  const rp = useGameStore((s) => s.researchPoints)

  const meetsGate = meetsProbeGateRequirements(store)
  const activeCount = probes.filter((p) => p.status !== 'idle').length
  const idleCount = probes.filter((p) => p.status === 'idle').length
  const totalCount = probes.length
  const canBuild = canBuildProbe({ probes, researchPoints: rp })
  const atMax = totalCount >= MAX_PROBES

  return (
    <div className="card rounded-lg p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
          Probe Bay
        </p>
        <span className="chip border-(--border-default) text-(--text-secondary) text-[0.6rem]">
          {totalCount}/{MAX_PROBES} probes
        </span>
      </div>

      {/* Gate requirement message */}
      {!meetsGate && (
        <p className="text-[0.65rem] text-(--status-warning)">
          Requires 100 Server Clusters and 10 Quantum Computers to build probes.
        </p>
      )}

      {/* Probe stats */}
      {totalCount > 0 && (
        <div className="flex items-center gap-4 text-[0.65rem] font-mono">
          <span className="text-(--text-secondary)">
            Active: <span className="text-(--text-accent)">{activeCount}</span>
          </span>
          <span className="text-(--text-secondary)">
            Idle: <span className="text-(--text-primary)">{idleCount}</span>
          </span>
        </div>
      )}

      {/* Build button */}
      {!atMax && (
        <button
          onClick={() => buildProbe()}
          disabled={!meetsGate || !canBuild}
          className={[
            'w-full py-2 text-xs font-mono rounded border transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)',
            meetsGate && canBuild
              ? 'border-(--status-success) text-(--status-success) hover:bg-(--status-success)/10'
              : 'border-(--status-locked) text-(--status-locked) cursor-not-allowed opacity-60'
          ].join(' ')}
        >
          Build Probe - {formatPoints(PROBE_COST_RP)} RP
          {!meetsGate && ' (Requirements not met)'}
          {meetsGate && rp < PROBE_COST_RP && ' (Insufficient RP)'}
        </button>
      )}
      {atMax && (
        <p className="text-[0.65rem] text-(--text-secondary) text-center">
          Maximum probe count reached ({MAX_PROBES}).
        </p>
      )}
    </div>
  )
}
