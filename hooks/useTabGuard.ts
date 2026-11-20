'use client'

import { useEffect, useRef, useState } from 'react'

const HEARTBEAT_INTERVAL_MS = 3000
const HEARTBEAT_TIMEOUT_MS = 8000

// Detects duplicate browser tabs using BroadcastChannel with heartbeat takeover
// if the primary tab closes unexpectedly without firing unload events.
export function useTabGuard(onDuplicateTab?: () => void): boolean {
  const [isDuplicate, setIsDuplicate] = useState(false)
  const isDuplicateRef = useRef(false)
  const lastOwnerHeartbeatRef = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return
    const channel = new BroadcastChannel('arkalon_labs_tab')
    const tabId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Math.random().toString(36).slice(2)}-${Date.now()}`
    const ownerKey = `${String(Date.now()).padStart(15, '0')}-${tabId}`

    const demoteSelf = () => {
      if (isDuplicateRef.current) return
      isDuplicateRef.current = true
      setIsDuplicate(true)
      onDuplicateTab?.()
    }

    const announceOpen = () =>
      channel.postMessage({ type: 'tab-open', tabId, ownerKey })
    const announceOwner = () =>
      channel.postMessage({ type: 'tab-exists', tabId, ownerKey })
    const announceClose = () => {
      if (!isDuplicateRef.current) {
        channel.postMessage({ type: 'tab-closed', tabId, ownerKey })
      }
    }

    announceOpen()

    channel.onmessage = (event) => {
      const msg = event.data
      if (!msg || msg.tabId === tabId) return
      const msgType = msg.type
      const remoteKey = typeof msg.ownerKey === 'string' ? msg.ownerKey : ''

      if (msgType === 'tab-open') {
        if (!isDuplicateRef.current) {
          if (remoteKey && remoteKey < ownerKey) {
            lastOwnerHeartbeatRef.current = Date.now()
            demoteSelf()
          } else {
            announceOwner()
          }
        }
      } else if (msgType === 'tab-exists' || msgType === 'tab-heartbeat') {
        lastOwnerHeartbeatRef.current = Date.now()
        if (!isDuplicateRef.current) {
          if (
            msgType === 'tab-heartbeat' ||
            !remoteKey ||
            remoteKey < ownerKey
          ) {
            demoteSelf()
          } else {
            announceOwner()
          }
        }
      } else if (msgType === 'tab-closed' && isDuplicateRef.current) {
        isDuplicateRef.current = false
        setIsDuplicate(false)
        announceOpen()
      }
    }

    const heartbeatTimer = setInterval(() => {
      if (!isDuplicateRef.current) {
        channel.postMessage({ type: 'tab-heartbeat', tabId, ownerKey })
      } else if (
        lastOwnerHeartbeatRef.current > 0 &&
        Date.now() - lastOwnerHeartbeatRef.current > HEARTBEAT_TIMEOUT_MS
      ) {
        isDuplicateRef.current = false
        setIsDuplicate(false)
        announceOwner()
      }
    }, HEARTBEAT_INTERVAL_MS)

    window.addEventListener('beforeunload', announceClose)
    window.addEventListener('pagehide', announceClose)

    return () => {
      clearInterval(heartbeatTimer)
      announceClose()
      window.removeEventListener('beforeunload', announceClose)
      window.removeEventListener('pagehide', announceClose)
      channel.close()
    }
  }, [onDuplicateTab])

  return isDuplicate
}