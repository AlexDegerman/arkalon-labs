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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-title"
    >
      <div className="w-full max-w-sm animate-[fade-in_0.2s_ease-out_both]">
        <div className="rounded-xl border border-[#1c2738] bg-[#0f1622] shadow-2xl overflow-hidden max-h-[70svh] flex flex-col">
          <div className="h-1.5 w-full shrink-0 bg-[#00d4ff]" />
          <div className="px-6 pt-4 pb-1 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1 text-[#00d4ff]">
                  New Update
                </span>
                <h2
                  id="update-title"
                  className="text-lg font-black leading-tight text-[#e8edf4]"
                >
                  v{LATEST_UPDATE.version}
                </h2>
              </div>
              <button
                onClick={handleDismiss}
                aria-label="Close update notes"
                className="p-2 rounded-full transition-colors duration-150 cursor-pointer hover:bg-[#162030] text-[#7c8ba1]"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
            <div className="rounded-lg p-4 border border-[#1c2738] bg-[#080b10]">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 text-[#7c8ba1] font-mono">
                {LATEST_UPDATE.date}
              </h3>
              <ul className="space-y-3.5">
                {LATEST_UPDATE.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
                    <p className="text-[11px] font-medium leading-relaxed text-[#e8edf4]">
                      {change}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="px-6 pb-6 pt-1 shrink-0 z-20 relative">
            <button
              onClick={handleDismiss}
              autoFocus
              className="w-full py-3 rounded-lg text-[11px] font-black uppercase tracking-widest border border-[#00d4ff]/40 bg-[#00d4ff]/10 text-[#00d4ff] transition-colors hover:bg-[#00d4ff]/20 active:scale-[0.98] cursor-pointer font-mono"
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
