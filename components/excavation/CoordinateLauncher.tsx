'use client'

import { useGameStore } from '@/app/stores/gameStore'
import {
  meetsProbeGateRequirements,
  canBuildProbe,
  getMaxProbes,
  getProbeCost,
  isZoneUnlocked,
  ZONE_DEFINITIONS
} from '@/lib/excavationDefs'
import { formatPoints, formatPointsShort } from '@/lib/format'
import { useIsCompactViewport } from '@/hooks/useIsCompactViewport'
import {
  PROBE_GATE_SERVER_CLUSTERS,
  PROBE_GATE_QUANTUM_COMPUTERS
} from '@/constants/game'
import { buildProbe } from '@/app/stores/actions/excavationActions'
import type { ExcavationZone } from '@/types/game'

export default function CoordinateLauncher() {
  const isCompact = useIsCompactViewport()
  const fmt = isCompact ? formatPointsShort : formatPoints
  const generators = useGameStore((s) => s.generators)
  const probes = useGameStore((s) => s.probes)
  const rp = useGameStore((s) => s.researchPoints)
  const lifetimePoints = useGameStore((s) => s.lifetimePoints)
  const stats = useGameStore((s) => s.stats)
  const completedResearchNodes = useGameStore((s) => s.completedResearchNodes)
  const autoLaunchUnlocked = useGameStore(
    (s) => (s.challengeRecords['SC12']?.completedTiers ?? 0) >= 3
  )
  const autoLaunchEnabled = useGameStore((s) => s.automation.autoLaunchProbe)
  const autoLaunchZone = useGameStore((s) => s.autoLaunchZone ?? 'safe')

  const meetsGate = meetsProbeGateRequirements({ generators })
  const activeCount = probes.filter((p) => p.status !== 'idle').length
  const idleCount = probes.filter((p) => p.status === 'idle').length
  const totalCount = probes.length
  const maxProbes = getMaxProbes({
    lifetimePoints,
    stats,
    completedResearchNodes
  })
  const probeCost = getProbeCost(totalCount)
  const canBuild = canBuildProbe({
    probes,
    researchPoints: rp,
    lifetimePoints,
    stats,
    completedResearchNodes
  })
  const atMax = totalCount >= maxProbes

  return (
    <div className="card rounded-xl p-2.5 sm:p-3 flex flex-col gap-2 border border-(--border-default) bg-(--bg-surface)">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-(--text-primary)">
          Probe Assembly Bay
        </span>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-(--bg-elevated) border border-(--border-default) text-(--text-secondary)">
          {totalCount}/{maxProbes} Probes
        </span>
      </div>

      {!meetsGate && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono">
          ⚠️ Requires {PROBE_GATE_SERVER_CLUSTERS.toString()} Server Clusters
          and {PROBE_GATE_QUANTUM_COMPUTERS.toString()} Quantum Computers to
          manufacture probes.
        </div>
      )}

      {totalCount > 0 && (
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 rounded-lg bg-(--bg-elevated) border border-(--border-default) flex items-center justify-between">
            <span className="text-(--text-secondary)">Active Scanning:</span>
            <span className="font-bold text-(--text-accent)">
              {activeCount}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-(--bg-elevated) border border-(--border-default) flex items-center justify-between">
            <span className="text-(--text-secondary)">Stationary/Idle:</span>
            <span className="font-bold text-(--text-primary)">{idleCount}</span>
          </div>
        </div>
      )}

      {autoLaunchUnlocked && (
        <div className="flex items-center justify-between gap-2 flex-wrap p-2 rounded-lg bg-(--bg-elevated)/60 border border-(--border-default) font-mono text-[10px]">
          <span className="text-(--text-secondary)">
            Auto-Launch Target{!autoLaunchEnabled ? ' (Paused)' : ''}:
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {ZONE_DEFINITIONS.map((z) => {
              const unlocked = isZoneUnlocked(z.zone, {
                lifetimePoints,
                stats
              })
              if (!unlocked) return null
              const active = autoLaunchZone === z.zone
              return (
                <button
                  key={z.zone}
                  onClick={() =>
                    useGameStore.setState({
                      autoLaunchZone: z.zone as ExcavationZone
                    })
                  }
                  className={[
                    'px-2 py-0.5 rounded border font-bold uppercase cursor-pointer transition-colors',
                    active
                      ? 'border-(--border-accent) bg-(--border-accent)/15 text-(--border-accent)'
                      : 'border-(--border-default) text-(--text-secondary) hover:text-(--text-primary)'
                  ].join(' ')}
                >
                  {z.zone}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!atMax ? (
        <button
          onClick={() => buildProbe()}
          disabled={!meetsGate || !canBuild}
          className={[
            'w-full py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer select-none',
            meetsGate && canBuild
              ? 'border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-60'
          ].join(' ')}
        >
          Construct Probe · {fmt(probeCost)} RP
        </button>
      ) : (
        <p className="text-[11px] font-mono text-(--text-secondary)/80 text-center py-1">
          Assembly bay at capacity ({maxProbes} probes).
          {maxProbes < 8 && ' Higher Tiers unlock up to 8 probes.'}
        </p>
      )}
    </div>
  )
}
