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
import { useState } from 'react'
import {
  buildProbe,
  launchAllIdleProbes
} from '@/app/stores/actions/excavationActions'
import { SUBSYSTEM_DEFINITIONS } from '@/lib/excavationDefs'
import type { ExcavationZone, ProbeSubsystem } from '@/types/game'

export default function CoordinateLauncher() {
  const isCompact = useIsCompactViewport()
  const fmt = isCompact ? formatPointsShort : formatPoints
  const probes = useGameStore((s) => s.probes)
  const meetsGate = useGameStore(meetsProbeGateRequirements)
  const maxProbes = useGameStore(getMaxProbes)
  const canBuild = useGameStore(canBuildProbe)
  const singUnlocked = useGameStore((s) => isZoneUnlocked('singularity', s))
  const omegaUnlocked = useGameStore((s) => isZoneUnlocked('omega', s))
  const autoLaunchUnlocked = useGameStore(
    (s) => (s.challengeRecords['SC12']?.completedTiers ?? 0) >= 3
  )
  const autoLaunchEnabled = useGameStore((s) => s.automation.autoLaunchProbe)
  const autoLaunchZone = useGameStore((s) => s.autoLaunchZone ?? 'safe')
  const excavationDisabled = useGameStore(
    (s) => s.activeChallengeRestrictions?.excavationDisabled ?? false
  )
  const [bulkZone, setBulkZone] = useState<ExcavationZone>('safe')
  const [bulkSubsystem, setBulkSubsystem] = useState<ProbeSubsystem>('none')
  const [confirmBatch, setConfirmBatch] = useState(false)

  const activeCount = probes.filter((p) => p.status !== 'idle').length
  const idleCount = probes.filter((p) => p.status === 'idle').length
  const totalCount = probes.length
  const probeCost = getProbeCost(totalCount)
  const atMax = totalCount >= maxProbes
  const isBatchLongZone =
    bulkZone === 'void' || bulkZone === 'singularity' || bulkZone === 'omega'

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
              const unlocked =
                z.zone === 'singularity'
                  ? singUnlocked
                  : z.zone === 'omega'
                    ? omegaUnlocked
                    : true
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

      {!excavationDisabled && idleCount >= 2 && (
        <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-(--bg-elevated)/60 border border-(--border-default) font-mono text-[10px]">
          <span className="text-(--text-secondary) uppercase tracking-wider font-bold">
            Batch Deploy ({idleCount} Idle)
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={bulkSubsystem}
              onChange={(e) =>
                setBulkSubsystem(e.target.value as ProbeSubsystem)
              }
              aria-label="Batch probe subsystem"
              className="bg-(--bg-surface) border border-(--border-default) rounded px-2 py-1 text-[11px] text-(--text-primary) cursor-pointer"
            >
              {SUBSYSTEM_DEFINITIONS.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.label}
                </option>
              ))}
            </select>
            <select
              value={bulkZone}
              onChange={(e) => {
                setConfirmBatch(false)
                setBulkZone(e.target.value as ExcavationZone)
              }}
              aria-label="Batch probe sector"
              className="bg-(--bg-surface) border border-(--border-default) rounded px-2 py-1 text-[11px] text-(--text-primary) cursor-pointer"
            >
              {ZONE_DEFINITIONS.filter((z) =>
                z.zone === 'singularity'
                  ? singUnlocked
                  : z.zone === 'omega'
                    ? omegaUnlocked
                    : true
              ).map((z) => (
                <option key={z.zone} value={z.zone}>
                  {z.label}
                </option>
              ))}
            </select>
            {confirmBatch && isBatchLongZone ? (
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => {
                    setConfirmBatch(false)
                    launchAllIdleProbes(bulkZone, bulkSubsystem)
                  }}
                  className="px-2.5 py-1 rounded border border-amber-400 bg-amber-400 text-black font-bold uppercase cursor-pointer"
                >
                  Confirm All ({idleCount})
                </button>
                <button
                  onClick={() => setConfirmBatch(false)}
                  className="px-2 py-1 rounded border border-(--border-default) bg-(--bg-surface) text-(--text-secondary) cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() =>
                  isBatchLongZone
                    ? setConfirmBatch(true)
                    : launchAllIdleProbes(bulkZone, bulkSubsystem)
                }
                className="ml-auto px-2.5 py-1 rounded border border-(--border-accent) bg-(--border-accent)/15 text-(--border-accent) hover:bg-(--border-accent) hover:text-[#080c14] font-bold uppercase cursor-pointer transition-colors"
              >
                Launch All ({idleCount})
              </button>
            )}
          </div>
        </div>
      )}

      {!atMax ? (
        <button
          onClick={() => buildProbe()}
          disabled={excavationDisabled || !meetsGate || !canBuild}
          className={[
            'w-full py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer select-none',
            !excavationDisabled && meetsGate && canBuild
              ? 'border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-60'
          ].join(' ')}
        >
          {excavationDisabled
            ? 'Excavation Restricted'
            : `Construct Probe · ${fmt(probeCost)} RP`}
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
