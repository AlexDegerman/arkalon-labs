'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/app/stores/uiStore'
import type {
  FacilityAlertPayload,
  AlertPriority,
  AlertVariant
} from '@/types/alerts'

interface PushAlertOptions {
  priority?: AlertPriority
  variant?: AlertVariant
  autoDismissMs?: number
}

// Convenience hook for pushing alerts from anywhere in the component tree
export function useFacilityAlerts() {
  const pushAlert = useUIStore((s) => s.pushAlert)
  const dismissAlert = useUIStore((s) => s.dismissAlert)
  const activeAlert = useUIStore((s) => s.activeAlert)

  function push(
    title: string,
    message: string,
    options: PushAlertOptions = {}
  ): void {
    pushAlert({
      priority: options.priority ?? 2,
      variant: options.variant ?? 'info',
      title,
      message,
      autoDismissMs: options.autoDismissMs ?? 4000
    })
  }

  return { push, dismiss: dismissAlert, activeAlert }
}

// Hook for auto-dismissing the active alert after its autoDismissMs
export function useAlertAutoDismiss() {
  const activeAlert = useUIStore((s) => s.activeAlert)
  const dismissAlert = useUIStore((s) => s.dismissAlert)

  useEffect(() => {
    if (!activeAlert || !activeAlert.autoDismissMs) return

    const timer = setTimeout(() => {
      dismissAlert()
    }, activeAlert.autoDismissMs)

    return () => clearTimeout(timer)
  }, [activeAlert, dismissAlert])
}
