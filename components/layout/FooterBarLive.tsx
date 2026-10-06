'use client'

// Renders live footer state via direct DOM writes to avoid triggering
// full footer re-renders on high-frequency timer updates.
// FooterBar itself only subscribes to low-frequency state.

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { formatCountdown } from '@/lib/format'

interface Props {
  lastSaveLabel: string
  saveStatus: 'synced' | 'saving' | 'error' | 'offline' | '--'
}

const STATUS_LABELS: Record<string, string> = {
  synced: 'Synced',
  saving: 'Saving...',
  error: 'Save Error',
  offline: 'Offline',
  '--': '--'
}

const STATUS_COLORS: Record<string, string> = {
  synced: 'var(--status-success)',
  saving: 'var(--status-warning)',
  error: '#ef4444',
  offline: 'var(--text-secondary)',
  '--': 'var(--text-secondary)'
}

export default function FooterBarLive({ lastSaveLabel, saveStatus }: Props) {
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const el = document.getElementById('footer-save-status')
    if (!el) return
    const label =
      lastSaveLabel !== '--'
        ? `${STATUS_LABELS[saveStatus]} (${lastSaveLabel})`
        : STATUS_LABELS[saveStatus]
    el.textContent = `Save: ${label}`
    el.style.color = STATUS_COLORS[saveStatus]
  }, [lastSaveLabel, saveStatus])

  useEffect(() => {
    let running = true

    function update() {
      if (!running) return

      const store = useGameStore.getState()
      const el = document.getElementById('footer-anomaly-label')
      if (el) {
        const activeAnomaly = store.activeAnomalyType
        const anomaliesUnlocked = store.unlocks.anomalies
        const o3 = store.completedResearchNodes.includes('O3')

        let label: string
        if (activeAnomaly) {
          label = `Anomaly Detected: ${formatCountdown(store.anomalyTimeRemaining)}`
          el.style.color = '#ef4444'
        } else if (anomaliesUnlocked && o3) {
          label = `Next Anomaly: ${formatCountdown(store.timeToNextAnomalyCheck)}`
          el.style.color = 'var(--text-accent)'
        } else if (anomaliesUnlocked) {
          label = 'Anomaly Scan: Active'
          el.style.color = 'var(--text-secondary)'
        } else {
          label = 'Anomaly Scan: Standby'
          el.style.color = 'var(--text-secondary)'
        }

        if (el.textContent !== label) {
          el.textContent = label
        }
      }

      // Update at ~4fps - enough for countdown display
      rafRef.current = window.setTimeout(update, 250)
    }

    update()
    return () => {
      running = false
      clearTimeout(rafRef.current)
    }
  }, [])

  return null
}
