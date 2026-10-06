'use client'

import { useUIStore } from '@/app/stores/uiStore'
import { useAlertAutoDismiss } from '@/hooks/useFacilityAlerts'
import type { AlertVariant } from '@/types/alerts'

const VARIANT_STYLES: Record<AlertVariant, string> = {
  prestige:
    'border-purple-500 bg-purple-950/80 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.3)]',
  anomaly:
    'border-red-500 bg-red-950/80 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.3)]',
  unlock:
    'border-(--border-accent) bg-cyan-950/80 text-(--text-primary) shadow-[0_0_20px_rgba(0,240,255,0.25)]',
  achievement:
    'border-amber-400 bg-amber-950/80 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.25)]',
  arkalon:
    'border-cyan-400 bg-slate-900/90 text-cyan-200 shadow-[0_0_20px_rgba(0,240,255,0.2)]',
  info: 'border-(--border-default) bg-(--bg-elevated)/95 text-(--text-primary)'
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

  const variantClass =
    VARIANT_STYLES[activeAlert.variant] ?? VARIANT_STYLES.info
  const icon = VARIANT_ICONS[activeAlert.variant] ?? 'i'

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-3 pointer-events-none animate-[fade-in_0.15s_ease-out_both]"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={[
          'rounded-xl border px-3.5 py-2.5 flex items-start gap-2.5 pointer-events-auto backdrop-blur-md',
          variantClass
        ].join(' ')}
      >
        <span
          className="text-base font-mono font-black shrink-0 w-5 text-center select-none"
          aria-hidden="true"
        >
          {icon}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-black font-mono uppercase tracking-wider leading-tight">
            {activeAlert.title}
          </p>
          <p className="text-[11px] text-(--text-secondary) mt-0.5 leading-snug">
            {activeAlert.message}
          </p>
        </div>

        <button
          onClick={dismissAlert}
          className="text-(--text-secondary) hover:text-(--text-primary) text-xs font-mono shrink-0 p-1 transition-colors cursor-pointer"
          aria-label="Dismiss alert"
        >
          X
        </button>
      </div>
    </div>
  )
}
