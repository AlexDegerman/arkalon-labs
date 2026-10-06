'use client'

import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { useUIStore } from '@/app/stores/uiStore'
import { LATEST_UPDATE, UPDATES_VERSION } from '@/lib/updates'

const VERSION_KEY = 'arkalon_labs_version'
const PLAYER_ID_KEY = 'arkalon_labs_player_id'

export function UpdateModal() {
  const showUpdateModal = useUIStore((s) => s.updateModalOpen)
  const setShowUpdateModal = useUIStore((s) => s.setUpdateModalOpen)

  // Returning players whose acknowledged version stamp is behind get the notes
  useEffect(() => {
    try {
      const playerId = localStorage.getItem(PLAYER_ID_KEY)
      const storedVersion = localStorage.getItem(VERSION_KEY)
      if (playerId && storedVersion && storedVersion !== UPDATES_VERSION) {
        setShowUpdateModal(true)
      }
    } catch {
      // localStorage unavailable
    }
  }, [setShowUpdateModal])

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(VERSION_KEY, UPDATES_VERSION)
    } catch {
      // localStorage unavailable
    }
    setShowUpdateModal(false)
  }, [setShowUpdateModal])

  if (!showUpdateModal) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-title"
    >
      <div className="w-full max-w-sm animate-[fade-in_0.2s_ease-out_both]">
        <div className="rounded-2xl border border-(--border-default) bg-(--bg-surface)/95 shadow-2xl overflow-hidden max-h-[75svh] flex flex-col backdrop-blur-md">
          {/* Top Accent Highlight Stripe (Cyan Glow) */}
          <div className="h-1.5 w-full shrink-0 bg-linear-to-r from-(--border-accent) via-white to-(--border-accent) shadow-[0_0_14px_rgba(0,240,255,0.7)]" />

          <div className="px-5 pt-4 pb-2 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1 text-(--text-accent) font-mono">
                  New Update
                </span>
                <h2
                  id="update-title"
                  className="text-lg font-black leading-tight text-(--text-primary) font-mono"
                >
                  v{LATEST_UPDATE.version}
                </h2>
              </div>
              <button
                onClick={handleDismiss}
                aria-label="Close update notes"
                className="p-1.5 rounded-lg text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated) transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
            <div className="rounded-xl p-3.5 border border-(--border-default) bg-(--bg-elevated)/70">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 text-(--text-secondary) font-mono">
                {LATEST_UPDATE.date}
              </h3>
              <ul className="space-y-3">
                {LATEST_UPDATE.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-(--border-accent) shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
                    <p className="text-[11px] font-medium leading-relaxed text-(--text-secondary)">
                      {change}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="px-5 pb-5 pt-1 shrink-0 z-20 relative">
            <button
              onClick={handleDismiss}
              autoFocus
              className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border border-(--border-accent)/40 bg-(--border-accent)/10 text-(--border-accent) transition-all hover:bg-(--border-accent) hover:text-[#080c14] active:scale-[0.98] cursor-pointer font-mono"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpdateModal
