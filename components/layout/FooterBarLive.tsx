'use client'

// Live save status overlay rendered by GameBootstrap
// Passes dynamic save info to the static FooterBar via a portal-like approach
// by updating a shared DOM ref - avoids re-rendering the full footer

import { useEffect, useRef } from 'react'

interface Props {
  lastSaveLabel: string
  saveStatus: 'synced' | 'saving' | 'error' | 'offline' | '--'
}

const STATUS_LABELS: Record<string, string> = {
  synced: 'Synced',
  saving: 'Saving...',
  error: 'Save error',
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
  useEffect(() => {
    // Write save status directly to the footer DOM element
    // The FooterBar renders a span with id="footer-save-status"
    const el = document.getElementById('footer-save-status')
    if (!el) return
    const label =
      lastSaveLabel !== '--'
        ? `${STATUS_LABELS[saveStatus]} ${lastSaveLabel}`
        : STATUS_LABELS[saveStatus]
    el.textContent = `Save: ${label}`
    el.style.color = STATUS_COLORS[saveStatus]
  }, [lastSaveLabel, saveStatus])

  return null
}
