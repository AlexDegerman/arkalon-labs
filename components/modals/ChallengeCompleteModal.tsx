'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { enterChallenge } from '@/app/stores/actions/challengeActions'
import { formatDuration, formatPoints, getAmountColor } from '@/lib/format'
import { playSound } from '@/hooks/useSound'

const CATEGORY_BADGES: Record<string, { label: string; cls: string }> = {
  standard: {
    label: 'Standard // T1',
    cls: 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300'
  },
  advanced: {
    label: 'Advanced // T2',
    cls: 'border-purple-400/50 bg-purple-400/10 text-purple-300'
  },
  extreme: {
    label: 'Extreme // T3',
    cls: 'border-amber-400/50 bg-amber-400/10 text-amber-300'
  },
  sandbox: {
    label: 'Custom Sandbox',
    cls: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300'
  }
}

export default function ChallengeCompleteModal() {
  const isOpen = useUIStore((s) => s.challengeCompleteModalOpen)
  const payload = useUIStore((s) => s.challengeCompletePayload)
  const setOpen = useUIStore((s) => s.setChallengeCompleteModalOpen)
  const activeChallengeId = useGameStore((s) => s.activeChallengeId)

  if (!isOpen || !payload) return null

  const badge = CATEGORY_BADGES[payload.category] ?? CATEGORY_BADGES.standard
  const targetColor = getAmountColor(payload.targetReached)
  const canStartNextTier =
    payload.category !== 'sandbox' &&
    payload.tierCompleted < payload.maxTiers &&
    !activeChallengeId

  function handleDismiss() {
    playSound('collect')
    setOpen(false)
  }

  function handleNextTier() {
    if (!payload) return
    const nextId = payload.challengeId
    setOpen(false)
    enterChallenge(nextId)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-[fade-in_0.2s_ease-out_both]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-complete-title"
    >
      <div className="card w-full max-w-md max-h-[90dvh] rounded-2xl border border-(--status-success)/60 bg-(--bg-surface)/95 overflow-hidden flex flex-col shadow-[0_0_40px_rgba(57,255,138,0.2)] backdrop-blur-md">
        {/* Top Labs Accent Stripe */}
        <div className="h-1.5 w-full shrink-0 bg-linear-to-r from-(--status-success) via-(--border-accent) to-(--status-success) shadow-[0_0_14px_rgba(57,255,138,0.65)]" />

        <div className="p-4 sm:p-5 flex flex-col gap-3.5 overflow-y-auto scrollbar-dark">
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-(--border-default)/60 pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-(--status-success) shadow-[0_0_8px_rgba(57,255,138,0.9)] shrink-0" />
              <h3
                id="challenge-complete-title"
                className="text-xs sm:text-sm font-mono font-black uppercase tracking-widest text-(--status-success) truncate"
              >
                Challenge Complete
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-(--text-secondary) hover:text-(--text-primary) p-1 cursor-pointer font-mono text-sm shrink-0"
              aria-label="Close challenge summary"
            >
              ✕
            </button>
          </div>

          {/* Hero Identity & Tier Pips */}
          <div className="p-3 rounded-xl bg-(--bg-elevated) border border-(--border-default) flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-black text-(--text-primary)">
                {payload.name}
              </span>
              <span
                className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded border ${badge.cls}`}
              >
                {badge.label}
              </span>
            </div>

            {payload.category !== 'sandbox' && (
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <div className="flex items-center gap-1">
                  {Array.from({ length: payload.maxTiers }, (_, i) => (
                    <span
                      key={i}
                      className={[
                        'w-2.5 h-2.5 rounded-full border',
                        i < payload.tierCompleted
                          ? 'bg-(--status-success) border-(--status-success) shadow-[0_0_6px_rgba(57,255,138,0.7)]'
                          : 'bg-(--bg-surface) border-(--border-default)'
                      ].join(' ')}
                    />
                  ))}
                </div>
                <span className="text-(--status-success) font-bold">
                  Tier {payload.tierCompleted}/{payload.maxTiers} Cleared
                </span>
              </div>
            )}

            <p className="text-[11px] font-mono text-amber-300/90 leading-snug pt-1 border-t border-(--border-default)/50">
              Constraint: {payload.restrictionSummary}
            </p>
          </div>

          {/* Permanent Reward Card */}
          <div className="p-3 rounded-xl bg-(--border-accent)/10 border border-(--border-accent)/45 flex flex-col gap-1 font-mono">
            <span className="text-[10px] uppercase tracking-widest font-bold text-(--text-secondary)">
              Permanent Facility Reward
            </span>
            <p className="text-xs font-bold text-(--text-accent) leading-snug">
              ✦ {payload.rewardDescription}
            </p>
            {payload.arEarned > 0 && (
              <p className="text-[11px] font-bold text-purple-300 mt-0.5">
                + {payload.arEarned.toLocaleString()} Arkalon Resonance Earned
              </p>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-(--bg-elevated)/70 border border-(--border-default) flex flex-col gap-0.5">
              <span className="text-[9px] text-(--text-secondary) uppercase tracking-wider">
                Target Cleared
              </span>
              <span
                className={`font-bold ${targetColor || 'text-(--text-primary)'}`}
              >
                {formatPoints(payload.targetReached)} RP
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-(--bg-elevated)/70 border border-(--border-default) flex flex-col gap-0.5 text-right">
              <span className="text-[9px] text-(--text-secondary) uppercase tracking-wider">
                Completion Time
              </span>
              <span className="font-bold text-(--text-primary)">
                {formatDuration(payload.durationSeconds)}
              </span>
            </div>
          </div>

          {/* Run Restoration Confirmation */}
          {payload.runRestored && (
            <div className="px-3 py-2 rounded-lg bg-(--status-success)/10 border border-(--status-success)/35 font-mono text-[11px] text-(--status-success) text-center">
              ✓ Pre-challenge RP, equipment, research & megaproject restored.
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            {canStartNextTier && (
              <button
                onClick={handleNextTier}
                className="flex-1 py-2.5 text-xs font-mono font-black uppercase tracking-widest rounded-xl border border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110 active:scale-[0.99] cursor-pointer shadow-[0_0_14px_rgba(0,240,255,0.3)] transition-all"
              >
                Start Tier {payload.tierCompleted + 1}
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 text-xs font-mono font-black uppercase tracking-widest rounded-xl border border-(--status-success) bg-(--status-success) text-[#080c14] hover:brightness-110 active:scale-[0.99] cursor-pointer shadow-[0_0_16px_rgba(57,255,138,0.35)] transition-all"
            >
              Acknowledge & Resume Run
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
