'use client'

import { useUIStore } from '@/app/stores/uiStore'
import { formatPoints, formatDuration, getAmountColor } from '@/lib/format'
import ProgressBar from '@/components/ui/ProgressBar'
import { playSound } from '@/hooks/useSound'
import { MEGAPROJECT_MAP } from '@/lib/megaprojectDefs'

export default function OfflineModal() {
  const isOpen = useUIStore((s) => s.offlineModalOpen)
  const payload = useUIStore((s) => s.offlinePayload)
  const welcomeModalOpen = useUIStore((s) => s.welcomeModalOpen)
  const updateModalOpen = useUIStore((s) => s.updateModalOpen)
  const setOpen = useUIStore((s) => s.setOfflineModalOpen)

  if (!isOpen || !payload || welcomeModalOpen || updateModalOpen) return null

  const isCapped = payload.actualElapsedSeconds > payload.elapsedSeconds + 1
  const pointTierClass = getAmountColor(payload.rpEarned)
  const capacityPercent = Math.min(
    100,
    Math.round(
      (payload.elapsedSeconds / Math.max(1, payload.maxOfflineWindowSeconds)) *
        100
    )
  )

  function handleClaim() {
    playSound('collect')
    setOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-[fade-in_0.2s_ease-out_both]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offline-title"
    >
      <div className="card rounded-2xl border border-(--border-accent)/60 bg-(--bg-surface)/95 w-full max-w-md p-4 sm:p-5 flex flex-col gap-3.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-(--border-default)/50 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-(--border-accent)" />
            <h3
              id="offline-title"
              className="text-xs sm:text-sm font-mono font-black uppercase tracking-wider text-(--text-primary)"
            >
              Facility Diagnostic // Reintegration
            </h3>
          </div>
          <button
            onClick={handleClaim}
            className="text-(--text-secondary) hover:text-(--text-primary) p-1 cursor-pointer font-mono text-sm"
            aria-label="Dismiss summary"
          >
            ✕
          </button>
        </div>

        {/* RP Accumulation Hero */}
        <div className="flex flex-col items-center justify-center py-2 px-3 rounded-xl bg-(--bg-elevated) border border-(--border-default) text-center gap-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-(--text-secondary)">
            Research Points Generated
          </span>
          <span
            className={`text-xl sm:text-2xl font-black font-mono tracking-tight select-all ${
              pointTierClass || 'text-(--text-accent)'
            }`}
          >
            +{formatPoints(payload.rpEarned)} RP
          </span>
          {payload.megaprojectRPEarned !== undefined &&
            payload.megaprojectRPEarned > 0n && (
              <span className="text-[10px] font-mono text-cyan-400 font-bold">
                +{formatPoints(payload.megaprojectRPEarned)} RP absorbed into
                Megaproject
              </span>
            )}
        </div>

        {payload.megaprojectCompletedId && (
          <div className="p-2.5 rounded-xl bg-(--status-success)/10 border border-(--status-success)/30 font-mono text-center">
            <span className="text-[10px] text-(--status-success) uppercase tracking-wider font-black">
              ★ Structure Complete:{' '}
              {MEGAPROJECT_MAP[payload.megaprojectCompletedId]?.name ??
                'Megaproject'}
            </span>
            <p className="text-[10px] text-(--text-secondary) mt-0.5">
              Construction finished during absentia. Reward perk synchronized.
            </p>
          </div>
        )}

        {((payload.researchCompletedNames?.length ?? 0) > 0 ||
          (payload.probesCompletedCount ?? 0) > 0 ||
          (payload.dustEarned ?? 0) > 0 ||
          (payload.operationPointsEarned ?? 0) > 0) && (
          <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-400/30 font-mono flex flex-col gap-1 text-[11px]">
            {(payload.dustEarned ?? 0) > 0 && (
              <p className="text-amber-400 font-bold">
                ◆ +{payload.dustEarned!.toLocaleString()} Artifact Dust
                Synthesized
              </p>
            )}
            {(payload.operationPointsEarned ?? 0) > 0 && (
              <p className="text-cyan-300 font-bold">
                ◉ +{payload.operationPointsEarned!.toLocaleString()} Operation
                Points Decoded
              </p>
            )}
            {(payload.researchCompletedNames?.length ?? 0) > 0 && (
              <p className="text-cyan-300 font-bold">
                ◈ Research Completed:{' '}
                <span className="text-(--text-primary)">
                  {payload.researchCompletedNames!.join(', ')}
                </span>
              </p>
            )}
            {(payload.probesCompletedCount ?? 0) > 0 && (
              <p className="text-amber-300 font-bold">
                ⊙ {payload.probesCompletedCount} Probe Scan
                {payload.probesCompletedCount === 1 ? '' : 's'} Completed
              </p>
            )}
          </div>
        )}

        {/* Offline Time Capacity Display */}
        {isCapped ? (
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                ⚠️ Storage Limit Reached
              </span>
              <span className="text-amber-300 font-bold text-[11px]">
                {formatDuration(payload.elapsedSeconds)} credited /{' '}
                {formatDuration(payload.actualElapsedSeconds)} away
              </span>
            </div>
            <ProgressBar
              progress={1}
              variant="warning"
              height={4}
              animated={false}
            />
            <p className="text-[10px] text-(--text-secondary) leading-tight mt-0.5">
              {payload.maxOfflineWindowSeconds >= 86400
                ? 'Accumulation capped at maximum facility capacity (24h).'
                : payload.maxOfflineWindowSeconds >= 43200
                  ? 'Accumulation capped at your 12h limit. Expand to 24h via Research Node R9.'
                  : `Accumulation capped at your ${formatDuration(payload.maxOfflineWindowSeconds)} limit. Expand maximum window via Chronos Loom and Node R9.`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-(--bg-elevated) border border-(--border-default) font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-(--text-secondary) text-[10px] uppercase tracking-wider">
                Time In Absentia
              </span>
              <span className="text-(--text-primary) font-bold text-[11px]">
                {formatDuration(payload.elapsedSeconds)} ({capacityPercent}% of{' '}
                {formatDuration(payload.maxOfflineWindowSeconds)} cap)
              </span>
            </div>
            <ProgressBar
              progress={
                payload.elapsedSeconds /
                Math.max(1, payload.maxOfflineWindowSeconds)
              }
              variant="default"
              height={4}
              animated={false}
            />
          </div>
        )}

        {/* Diagnostic Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-(--bg-elevated)/60 border border-(--border-default) flex flex-col gap-0.5">
            <span className="text-[9px] text-(--text-secondary) uppercase tracking-wider">
              Core Efficiency
            </span>
            <span className="font-bold text-(--text-primary)">
              {Math.round(payload.efficiencyApplied * 100)}% Rate
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-(--bg-elevated)/60 border border-(--border-default) flex flex-col gap-0.5 text-right">
            <span className="text-[9px] text-(--text-secondary) uppercase tracking-wider">
              Simulation Status
            </span>
            <span className="font-bold text-(--status-success)">
              Synchronized
            </span>
          </div>
        </div>

        <button
          onClick={handleClaim}
          className="w-full py-2.5 text-xs font-mono font-black uppercase tracking-widest rounded-xl border border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110 active:scale-[0.99] cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.35)] transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
