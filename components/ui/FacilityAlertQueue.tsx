'use client'

import { useUIStore } from '@/app/stores/uiStore'
import { useAlertAutoDismiss } from '@/hooks/useFacilityAlerts'
import type { AlertVariant } from '@/types/alerts'

const VARIANT_STYLES: Record<AlertVariant, string> = {
  prestige: 'border-[var(--text-accent)] text-[var(--text-accent)]',
  anomaly: 'border-[#ef4444] text-[#ef4444]',
  unlock: 'border-[var(--border-accent)] text-[var(--border-accent)]',
  achievement: 'border-[#f59e0b] text-[#f59e0b]',
  arkalon: 'border-[var(--text-secondary)] text-[var(--text-secondary)]',
  info: 'border-[var(--border-default)] text-[var(--text-primary)]'
}

const VARIANT_ICONS: Record<AlertVariant, string> = {
  prestige: '⟳',
  anomaly: '!',
  unlock: '+',
  achievement: '★',
  arkalon: '◎',
  info: 'i'
}

export default function FacilityAlertQueue() {
  const activeAlert = useUIStore((s) => s.activeAlert)
  const dismissAlert = useUIStore((s) => s.dismissAlert)

  useAlertAutoDismiss()

  if (!activeAlert) return null

  const variantClass = VARIANT_STYLES[activeAlert.variant]
  const icon = VARIANT_ICONS[activeAlert.variant]

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 pointer-events-none"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={[
          'glass rounded-lg border px-4 py-3 flex items-start gap-3 pointer-events-auto shadow-lg',
          variantClass
        ].join(' ')}
      >
        <span
          className="text-sm font-mono font-bold shrink-0 mt-0.5 w-4 text-center"
          aria-hidden="true"
        >
          {icon}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold font-mono uppercase tracking-wide leading-tight">
            {activeAlert.title}
          </p>
          <p className="text-xs text-(--text-secondary) mt-0.5 leading-snug">
            {activeAlert.message}
          </p>
        </div>

        <button
          onClick={dismissAlert}
          className="text-(--text-secondary) text-sm leading-none shrink-0 mt-0.5 hover:text-(--text-primary) transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent) rounded"
          aria-label="Dismiss alert"
        >
          x
        </button>
      </div>
    </div>
  )
}
