'use client'

import { useUIStore } from '@/app/stores/uiStore'
import { formatDuration, formatPoints } from '@/lib/format'
import { ACHIEVEMENTS } from '@/lib/achievementDefs'
import { playSound } from '@/hooks/useSound'

export default function VictoryModal() {
  const isOpen = useUIStore((s) => s.victoryModalOpen)
  const payload = useUIStore((s) => s.victoryPayload)
  const setOpen = useUIStore((s) => s.setVictoryModalOpen)

  if (!isOpen || !payload) return null

  function handleContinue() {
    playSound('collect')
    setOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-[fade-in_0.25s_ease-out_both]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
    >
      <div className="card w-full max-w-md max-h-[90dvh] rounded-2xl border border-amber-400/70 bg-(--bg-surface)/95 overflow-hidden flex flex-col shadow-[0_0_50px_rgba(251,191,36,0.28)] backdrop-blur-md">
        <div className="h-1.5 w-full shrink-0 bg-linear-to-r from-amber-400 via-cyan-300 to-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.8)]" />

        <div className="p-4 sm:p-5 flex flex-col gap-3.5 overflow-y-auto scrollbar-dark">
          <div className="flex items-center justify-between border-b border-(--border-default)/60 pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)] shrink-0" />
              <h3
                id="victory-title"
                className="text-xs sm:text-sm font-mono font-black uppercase tracking-widest g-tqgs truncate"
              >
                Omega Convergence // Complete
              </h3>
            </div>
            <button
              onClick={handleContinue}
              className="text-(--text-secondary) hover:text-(--text-primary) p-1 cursor-pointer font-mono text-sm shrink-0"
              aria-label="Close victory summary"
            >
              ✕
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-(--bg-elevated) border border-amber-400/40 text-center flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold">
              Trequinquagintillion & Node O10 Synchronized
            </span>
            <span className="text-lg sm:text-xl font-black font-mono g-tqgs select-all">
              {formatPoints(payload.lifetimePoints)} RP
            </span>
            <p className="text-[11px] text-(--text-secondary) leading-relaxed mt-1">
              You have reached the theoretical boundary of the Arkalon construct
              and completed the Final Observation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-(--bg-elevated)/70 border border-(--border-default) flex flex-col gap-0.5">
              <span className="text-[9px] text-(--text-secondary) uppercase tracking-wider">
                Session Playtime
              </span>
              <span className="font-bold text-(--text-primary)">
                {formatDuration(payload.totalPlaytimeSeconds)}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-(--bg-elevated)/70 border border-(--border-default) flex flex-col gap-0.5 text-right">
              <span className="text-[9px] text-(--text-secondary) uppercase tracking-wider">
                Total Prestiges
              </span>
              <span className="font-bold text-cyan-300">
                {payload.totalPrestiges.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-(--bg-elevated)/70 border border-(--border-default) flex flex-col gap-0.5">
              <span className="text-[9px] text-(--text-secondary) uppercase tracking-wider">
                Relics Recovered
              </span>
              <span className="font-bold text-amber-300">
                {payload.relicsCount}/20
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-(--bg-elevated)/70 border border-(--border-default) flex flex-col gap-0.5 text-right">
              <span className="text-[9px] text-(--text-secondary) uppercase tracking-wider">
                Achievements
              </span>
              <span className="font-bold text-(--status-success)">
                {payload.achievementsCount}/{ACHIEVEMENTS.length}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-(--bg-elevated)/70 border border-(--border-default) flex flex-col gap-0.5">
              <span className="text-[9px] text-(--text-secondary) uppercase tracking-wider">
                Dyson Swarm
              </span>
              <span className="font-bold text-amber-300">
                Level {payload.dysonSwarmLevel ?? 0} → Next: Lv
                {(payload.dysonSwarmLevel ?? 0) + 1}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-(--bg-elevated)/70 border border-(--border-default) flex flex-col gap-0.5 text-right">
              <span className="text-[9px] text-(--text-secondary) uppercase tracking-wider">
                Challenge Tiers
              </span>
              <span className="font-bold text-cyan-300">
                {payload.challengeTiersCompleted ?? 0}/
                {payload.challengeTiersTotal ?? 0}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-400/30 text-[11px] font-mono text-cyan-200 leading-snug">
            Endless Mode remains open: push Dyson Swarm Level{' '}
            {(payload.dysonSwarmLevel ?? 0) + 1}, finish remaining Challenge
            tiers, or run custom builds in the Mutator Sandbox.
          </div>

          <button
            onClick={handleContinue}
            className="w-full py-2.5 text-xs font-mono font-black uppercase tracking-widest rounded-xl border border-amber-400 bg-amber-400 text-[#080c14] hover:brightness-110 active:scale-[0.99] cursor-pointer shadow-[0_0_18px_rgba(251,191,36,0.4)] transition-all"
          >
            Continue Endless Mode
          </button>
        </div>
      </div>
    </div>
  )
}
