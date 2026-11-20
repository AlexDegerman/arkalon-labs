'use client'

import { useGameStore } from '@/app/stores/gameStore'
import CoordinateLauncher from '@/components/excavation/CoordinateLauncher'
import ProbeCard from '@/components/excavation/ProbeCard'

function SectorStarmap() {
  const probes = useGameStore((s) => s.probes)
  const safeCount = probes.filter(
    (p) => p.zone === 'safe' && p.status === 'scanning'
  ).length
  const unstableCount = probes.filter(
    (p) => p.zone === 'unstable' && p.status === 'scanning'
  ).length
  const voidCount = probes.filter(
    (p) => p.zone === 'void' && p.status === 'scanning'
  ).length

  return (
    <div className="@container card rounded-xl p-2.5 bg-(--bg-surface) border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.08)] flex flex-col gap-2 font-mono">
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-(--border-default)/50 pb-1.5">
        <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider">
          ✦ Tactical Sub-Space Sector Topology
        </span>
        <span className="text-[9px] text-(--text-secondary)">
          Telemetry Grid // RA 14h 29m Dec -62°
        </span>
      </div>

      <div className="grid grid-cols-1 @[420px]:grid-cols-3 gap-1.5 text-xs">
        <div className="p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-950/20 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 text-[11px]">
              Safe Sectors
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
              STABLE
            </span>
          </div>
          <span className="text-[10px] text-(--text-secondary)">
            Risk Factor: 0% · 1h Duration
          </span>
          <div className="flex justify-between items-center text-[10px] pt-1 border-t border-emerald-500/20 text-emerald-200">
            <span>Active Probes:</span>
            <strong className="font-bold">{safeCount}</strong>
          </div>
        </div>

        <div className="p-2.5 rounded-lg border border-orange-500/40 bg-orange-950/20 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-orange-400 text-[11px]">
              Unstable Rifts
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-orange-500/20 text-orange-300">
              HAZARD
            </span>
          </div>
          <span className="text-[10px] text-(--text-secondary)">
            25% Repair Risk · 4h Duration
          </span>
          <div className="flex justify-between items-center text-[10px] pt-1 border-t border-orange-500/20 text-orange-200">
            <span>Active Probes:</span>
            <strong className="font-bold">{unstableCount}</strong>
          </div>
        </div>

        <div className="p-2.5 rounded-lg border border-purple-500/40 bg-purple-950/20 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-300 text-[11px]">
              Void Depths
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-200">
              EXTREME
            </span>
          </div>
          <span className="text-[10px] text-(--text-secondary)">
            50% Loss Risk (Repair w/ Shield) · 12h Duration
          </span>
          <div className="flex justify-between items-center text-[10px] pt-1 border-t border-purple-500/20 text-purple-200">
            <span>Active Probes:</span>
            <strong className="font-bold">{voidCount}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ExcavationWorkspace() {
  const probes = useGameStore((s) => s.probes)
  const hasRelic9 = useGameStore((s) => s.unlockedRelics.includes(9))
  const relic9Pity = useGameStore((s) => s.stats.relic9PityCount ?? 0)

  return (
    <div className="flex flex-col gap-2 p-2 sm:p-3 h-full overflow-y-auto scrollbar-dark bg-(--bg-primary)/40">
      <SectorStarmap />
      {!hasRelic9 && (
        <div className="px-2.5 py-1.5 rounded-xl border border-cyan-400/30 bg-cyan-950/20 font-mono text-[10px] text-cyan-200 flex items-center justify-between gap-2">
          <span>Void Compass Relic Pity (Unstable/Void Scans):</span>
          <strong className="text-cyan-300 font-black">
            {Math.min(8, relic9Pity)}/8 Guaranteed
          </strong>
        </div>
      )}
      <CoordinateLauncher />

      {probes.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1">
          <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest px-0.5">
            Active Probe Fleet ({probes.length})
          </p>
          <div className="flex flex-col gap-2">
            {probes.map((probe) => (
              <ProbeCard key={probe.id} probe={probe} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
