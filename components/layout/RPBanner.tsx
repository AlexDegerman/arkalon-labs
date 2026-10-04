'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useAnimatedBigInt } from '@/hooks/useAnimatedBigInt'
import { formatPoints, formatRate } from '@/lib/format'
import { getCurrentEra } from '@/lib/eraThresholds'
import { useProgressionTier, useReducedMotion } from '@/hooks/useProgressionTier'
import TutorialHighlight from '@/components/tutorial/TutorialHighlight'

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
  const projectedAR =
    lifetimePoints >= 1_000_000_000n
      ? Math.floor(5 * Math.sqrt(Number(lifetimePoints) / 1_000_000_000))
      : 0

  return (
    <div className="px-3 py-2 border-b border-(--border-default) bg-(--bg-surface) shrink-0">
      {/* Main RP display - highlighted on first_buy beat */}
      <TutorialHighlight targetId="rp-banner">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl lg:text-3xl font-bold font-mono leading-none">
            <span
              ref={displayRef}
              aria-live="polite"
              aria-label="Research Points"
            >
              {formatPoints(researchPoints)}
            </span>
            <span className="text-sm font-normal text-(--text-secondary) ml-1">
              RP
            </span>
          </span>

          <span className="text-sm font-mono text-(--text-accent)">
            +{formatRate(pps)}
          </span>
        </div>
      </TutorialHighlight>

      {/* Era badge and secondary info */}
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span className="era-badge">
          Era {era.era} - {era.name}
        </span>

        {arkalonResonance > 0 && (
          <span className="chip border-(--text-accent) text-(--text-accent)">
            {arkalonResonance} AR
          </span>
        )}

        {/* Projected prestige gain hint */}
        {projectedAR > 0 && !prestige1Done && (
          <span className="text-xs font-mono text-(--text-secondary)">
            Prestige: ~{projectedAR} AR
          </span>
        )}
      </div>
    </div>
  )
}
