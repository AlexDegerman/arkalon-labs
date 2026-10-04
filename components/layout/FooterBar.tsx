'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { formatCountdown } from '@/lib/format'

interface Props {
  lastSaveLabel?: string
}

export default function FooterBar({ lastSaveLabel = '--' }: Props) {
  const operationCycle = useGameStore((s) => s.currentOperationCycle)
  const anomalyTimeRemaining = useGameStore((s) => s.anomalyTimeRemaining)
  const activeAnomalyType = useGameStore((s) => s.activeAnomalyType)
  const timeToNextCheck = useGameStore((s) => s.timeToNextAnomalyCheck)
  const anomaliesUnlocked = useGameStore((s) => s.unlocks.anomalies)
  const o3Completed = useGameStore((s) =>
    s.completedResearchNodes.includes('O3')
  )
  const prestige1Done = useGameStore((s) => s.stats.totalPrestigesTier1 > 0)
  const timeSincePrestige = useGameStore((s) => s.stats.lastPrestigeTime)

  // Anomaly center label
  let anomalyLabel: string
  if (activeAnomalyType) {
    anomalyLabel = `Anomaly: ${formatCountdown(anomalyTimeRemaining)}`
  } else if (anomaliesUnlocked && o3Completed) {
    anomalyLabel = `Next anomaly: ${formatCountdown(timeToNextCheck)}`
  } else if (anomaliesUnlocked) {
    anomalyLabel = 'Anomaly scan: active'
  } else {
    anomalyLabel = 'Anomaly scan: standby'
  }

  // Time since last prestige
  let prestigeLabel = ''
  if (prestige1Done && timeSincePrestige > 0) {
    const elapsed = Math.floor((Date.now() - timeSincePrestige) / 1000)
    prestigeLabel = `Run: ${formatCountdown(elapsed)}`
  }

  return (
    <footer className="h-8 flex items-center justify-between px-4 border-t border-(--border-default) bg-(--bg-surface) shrink-0 gap-2">
      <span className="text-xs font-mono text-(--text-secondary) truncate">
        {prestige1Done
          ? `Op Cycle ${operationCycle}${prestigeLabel ? ` // ${prestigeLabel}` : ''}`
          : `Arkalon Laboratories // Cycle ${operationCycle}`}
      </span>

      <span className="text-xs font-mono text-(--text-secondary) shrink-0">
        {anomalyLabel}
      </span>

      <span
        id="footer-save-status"
        className="text-xs font-mono text-(--text-secondary) shrink-0"
      >
        Save: {lastSaveLabel}
      </span>
    </footer>
  )
}
