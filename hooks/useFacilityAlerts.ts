'use client'
import { useEffect } from 'react'
import { useUIStore } from '@/app/stores/uiStore'

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
