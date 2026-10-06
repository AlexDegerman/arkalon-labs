'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useAnimatedBigInt } from '@/hooks/useAnimatedBigInt'
import { formatPoints, formatRate } from '@/lib/format'
import { getCurrentEra } from '@/lib/eraThresholds'
import {
  useProgressionTier,
  useReducedMotion
} from '@/hooks/useProgressionTier'
import TutorialHighlight from '@/components/tutorial/TutorialHighlight'
import { calculateARGain } from '@/lib/prestigeCalc'

export default function RPBanner() {
  const researchPoints = useGameStore((s) => s.researchPoints)
  const lifetimePoints = useGameStore((s) => s.lifetimePoints)
  const pps = useGameStore((s) => s.cachedPointsPerSecond)
  const arkalonResonance = useGameStore((s) => s.arkalonResonance)
  const prestige1Done = useGameStore((s) => s.stats.totalPrestigesTier1 > 0)

  // Apply data-tier attribute to <html> based on lifetime points
  useProgressionTier(lifetimePoints)
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion)
  useReducedMotion(reducedMotion)
  const displayRef = useAnimatedBigInt(researchPoints)
  const era = getCurrentEra(lifetimePoints)

  // Projected AR for prestige hint
  const projectedAR = calculateARGain(useGameStore.getState())

  return (
    <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-(--border-default) bg-(--bg-surface)/95 backdrop-blur-md shrink-0">
      {/* Main RP display */}
      <TutorialHighlight targetId="rp-banner">
        <div className="flex items-baseline justify-between sm:justify-start gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-2xl min-[360px]:text-3xl lg:text-4xl font-black font-mono leading-none tracking-tight">
              <span
                ref={displayRef}
                aria-live="polite"
                aria-label="Research Points"
                className="select-all"
              >
                {formatPoints(researchPoints)}
              </span>
              <span className="text-xs sm:text-sm font-bold text-(--text-secondary) ml-1.5 font-mono">
                RP
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-(--border-accent)/30 bg-(--border-accent)/10 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-(--border-accent) animate-pulse" />
            <span className="text-xs sm:text-sm font-mono font-bold text-(--text-accent)">
              +{formatRate(pps)}
            </span>
          </div>
        </div>
      </TutorialHighlight>

      {/* Era badge and secondary telemetry */}
      <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
        <span className="inline-flex items-center gap-1 bg-(--bg-elevated) border border-(--border-accent)/40 text-(--text-accent) px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider">
          <span className="text-[10px] opacity-75">ERA {era.era}:</span>
          <span>{era.name}</span>
        </span>

        {arkalonResonance > 0 && (
          <span className="inline-flex items-center gap-1 bg-(--bg-elevated) border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold">
            <span>{formatPoints(BigInt(Math.floor(arkalonResonance)))}</span>
            <span className="opacity-75">AR</span>
          </span>
        )}

        {/* Projected prestige gain */}
        {projectedAR > 0 && (
          <span className="text-[11px] font-mono text-(--text-secondary) ml-auto sm:ml-0">
            {prestige1Done ? 'Recalibrate:' : 'Prestige:'}{' '}
            <strong className="text-(--status-success) font-bold">
              ~{projectedAR} AR
            </strong>
          </span>
        )}
      </div>
    </div>
  )
}
