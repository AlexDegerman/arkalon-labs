'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { meetsProbeGateRequirements, canBuildProbe } from '@/lib/excavationDefs'
import { formatPoints } from '@/lib/format'
import {
  PROBE_COST_RP,
  MAX_PROBES,
  PROBE_GATE_SERVER_CLUSTERS,
  PROBE_GATE_QUANTUM_COMPUTERS
} from '@/constants/game'
import { buildProbe } from '@/app/stores/actions/excavationActions'

export default function CoordinateLauncher() {
  const generators = useGameStore((s) => s.generators)
  const probes = useGameStore((s) => s.probes)
  const rp = useGameStore((s) => s.researchPoints)

  const meetsGate = meetsProbeGateRequirements({ generators })
  const activeCount = probes.filter((p) => p.status !== 'idle').length
  const idleCount = probes.filter((p) => p.status === 'idle').length
  const totalCount = probes.length
  const canBuild = canBuildProbe({ probes, researchPoints: rp })
  const atMax = totalCount >= MAX_PROBES

  return (
    <div className="card rounded-xl p-2.5 sm:p-3 flex flex-col gap-2 border border-(--border-default) bg-(--bg-surface)">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-(--text-primary)">
          Probe Assembly Bay
        </span>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-(--bg-elevated) border border-(--border-default) text-(--text-secondary)">
          {totalCount}/{MAX_PROBES} Probes
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
          Construct Probe · {formatPoints(PROBE_COST_RP)} RP
        </button>
      ) : (
        <p className="text-[11px] font-mono text-(--text-secondary)/80 text-center py-1">
          Assembly bay at maximum capacity ({MAX_PROBES} probes active).
        </p>
      )}
    </div>
  )
}
