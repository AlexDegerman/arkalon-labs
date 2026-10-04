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
    <footer className="h-8 flex items-center justify-between px-4 border-t border-(--border-default) bg-(--bg-surface) shrink-0 gap-2">
      <span className="text-xs font-mono text-(--text-secondary) truncate">
        {prestige1Done ? `Op Cycle ${operationCycle}` : 'Arkalon Laboratories'}
      </span>

      {/* Anomaly label - updated by FooterBarLive via DOM write */}
      <span
        id="footer-anomaly-label"
        className="text-xs font-mono text-(--text-secondary) shrink-0"
      >
        {anomaliesUnlocked ? 'Anomaly scan: active' : 'Anomaly scan: standby'}
      </span>

      <span
        id="footer-save-status"
        className="text-xs font-mono text-(--text-secondary) shrink-0"
      >
        Save: --
      </span>
    </footer>
  )
}

export default memo(FooterBar)
