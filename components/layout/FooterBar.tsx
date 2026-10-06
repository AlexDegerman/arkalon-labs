'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'

// FooterBar subscribes only to low-frequency state changes (not timers)
// Timer-based updates (anomaly countdown, save time) go through FooterBarLive
// via direct DOM writes to avoid per-tick re-renders

function FooterBar() {
  const operationCycle = useGameStore((s) => s.currentOperationCycle)
  const prestige1Done = useGameStore((s) => s.stats.totalPrestigesTier1 > 0)
  const anomaliesUnlocked = useGameStore((s) => s.unlocks.anomalies)

  return (
    <footer className="h-8 flex items-center justify-between px-3 sm:px-4 border-t border-(--border-default) bg-(--bg-surface)/90 shrink-0 gap-2 text-[11px] font-mono text-(--text-secondary)">
      <span className="truncate">
        {prestige1Done ? `Op Cycle ${operationCycle}` : 'Arkalon Laboratories'}
      </span>

      {/* Dynamic DOM written by FooterBarLive */}
      <span
        id="footer-anomaly-label"
        className="shrink-0 text-(--text-secondary)"
      >
        {anomaliesUnlocked ? 'Anomaly: Scanning' : 'Anomaly: Standby'}
      </span>

      <span
        id="footer-save-status"
        className="shrink-0 text-(--text-secondary)"
      >
        Save: --
      </span>
    </footer>
  )
}

export default memo(FooterBar)
