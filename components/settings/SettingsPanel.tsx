'use client'

import { useState, useRef } from 'react'
import { makeInitialState, useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import {
  exportSave,
  importSave,
  clearLocalStorageSave,
  saveToLocalStorage,
  serialiseState
} from '@/lib/saveGame'
import { saveState } from '@/app/actions/saveState'
import { setNotationMode } from '@/lib/format'
import VolumeControls from '@/components/ui/VolumeControls'
import type { NotationMode, UITheme } from '@/types/game'
import { markUnlocksDirty, markAchievementsDirty, resetDirtyFlags } from '@/lib/dirtyFlags'
import { resetCloudState } from '@/app/actions/saveState'
import { resetTickSession } from '@/app/stores/actions/tickActions'
import { resetUnlockSessionCaches } from '@/lib/unlockWatcher'
import { useMusicStore } from '@/app/stores/musicStore'

export const THEME_CONFIG: Record<
  UITheme,
  {
    label: string
    borderAccent: string
    textAccent: string
  }
> = {
  default: {
    label: 'Electric Cyan',
    borderAccent: '#00f0ff',
    textAccent: '#00f0ff',
  },
  matrix: {
    label: 'Matrix Green',
    borderAccent: '#22c55e',
    textAccent: '#4ade80',
  },
  vaporwave: {
    label: 'Vaporwave',
    borderAccent: '#f43f5e',
    textAccent: '#fb7185',
  },
  solar: {
    label: 'Solar Amber',
    borderAccent: '#f59e0b',
    textAccent: '#fbbf24',
  },
  void: {
    label: 'Absolute Void',
    borderAccent: '#cbd5e1',
    textAccent: '#f1f5f9',
  }
}

export function applyThemeVariables(theme: UITheme): void {
  if (typeof document === 'undefined') return
  const cfg = THEME_CONFIG[theme] ?? THEME_CONFIG.default
  document.documentElement.style.setProperty(
    '--border-accent',
    cfg.borderAccent
  )
  document.documentElement.style.setProperty('--text-accent', cfg.textAccent)
  document.documentElement.setAttribute('data-facility-theme', theme)
}

const NOTATION_OPTIONS: {
  value: NotationMode
  label: string
}[] = [
  { value: 'suffix', label: 'Suffix (1.50M)' },
  { value: 'scientific', label: 'Scientific (1.50e6)' }
]

type ConfirmState = 'idle' | 'confirm1' | 'confirm2' | 'typing'

export default function SettingsPanel() {
  const settingsPanelOpen = useUIStore((s) => s.settingsPanelOpen)
  const setSettingsPanelOpen = useUIStore((s) => s.setSettingsPanelOpen)
  const settings = useGameStore((s) => s.settings)

  const [exportText, setExportText] = useState('')
  const [importText, setImportText] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState(false)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<
    'idle' | 'syncing' | 'synced' | 'rate_limited' | 'offline' | 'error'
  >('idle')
  const [resetConfirm, setResetConfirm] = useState<ConfirmState>('idle')
  const [resetInput, setResetInput] = useState('')
  const resetInputRef = useRef<HTMLInputElement>(null)

  if (!settingsPanelOpen) return null

  function updateSetting<K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) {
    useGameStore.setState((s) => ({
      settings: { ...s.settings, [key]: value }
    }))
    if (key === 'notationMode') {
      setNotationMode(value as NotationMode)
    }
    if (key === 'currentUITheme') {
      applyThemeVariables(value as UITheme)
    }
    if (key === 'neonBloom') {
      document.documentElement.setAttribute('data-neon-bloom', String(value))
    }
    if (key === 'reducedMotion') {
      document.documentElement.setAttribute(
        'data-reduced-motion',
        String(value)
      )
    }
  }

  function handleExport() {
    const state = useGameStore.getState()
    const b64 = exportSave(state)
    setExportText(b64)
    try {
      navigator.clipboard.writeText(b64)
    } catch {}
  }

  function handleImport() {
    setImportError('')
    setImportSuccess(false)

    if (!importText.trim()) {
      setImportError('Paste a save string first.')
      return
    }

    const loaded = importSave(importText.trim())
    if (!loaded) {
      setImportError('Invalid save string. Check that it was copied correctly.')
      return
    }

    useGameStore.getState().applyState(loaded)
    resetUnlockSessionCaches()
    resetTickSession()
    resetDirtyFlags()
    setNotationMode(loaded.settings.notationMode)
    applyThemeVariables(
      (loaded.settings.currentUITheme ?? 'default') as UITheme
    )
    document.documentElement.setAttribute(
      'data-neon-bloom',
      String(loaded.settings.neonBloom)
    )
    document.documentElement.setAttribute(
      'data-reduced-motion',
      String(loaded.settings.reducedMotion)
    )
    useUIStore.setState({
      terminalLines: [],
      alertQueue: [],
      activeAlert: null,
      unseenUnlockedTabs: []
    })
    const music = useMusicStore.getState()
    music.setContext(loaded.activeAnomalyType ? 'anomaly' : 'idle')
    music.setMuted(Boolean(loaded.settings.audioMuted))
    music.setVolumeBGM(loaded.settings.volumeMusic)
    music.setVolumeSFX(loaded.settings.volumeSFX)
    music.setVolumeVoice(loaded.settings.volumeVoice)
    saveToLocalStorage(useGameStore.getState())
    markUnlocksDirty()
    markAchievementsDirty()
    setImportSuccess(true)
    setImportText('')
    setImportOpen(false)
  }

  function handleManualSave() {
    const state = useGameStore.getState()
    saveToLocalStorage(state)
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'info',
      title: 'Saved',
      message: 'Game saved to local storage.',
      autoDismissMs: 2000
    })
  }

  async function handleCloudSync() {
    if (cloudSyncStatus === 'syncing') return
    const state = useGameStore.getState()
    saveToLocalStorage(state)
    setCloudSyncStatus('syncing')
    try {
      const serialized = serialiseState(state)
      const res = await saveState({
        save: serialized,
        lastSavedTime: serialized.lastSavedTime,
        lifetimePoints: serialized.lifetimePoints,
        currentPoints: serialized.researchPoints,
        cachedPPS: serialized.cachedPointsPerSecond
      })
      if (res.success) {
        setCloudSyncStatus('synced')
      } else if (res.error === 'Rate limited') {
        setCloudSyncStatus('rate_limited')
      } else if (res.error === 'Database offline') {
        setCloudSyncStatus('offline')
      } else {
        setCloudSyncStatus('error')
      }
    } catch {
      setCloudSyncStatus('offline')
    }
    setTimeout(() => setCloudSyncStatus('idle'), 3500)
  }

  function handleDownloadSave() {
    const state = useGameStore.getState()
    const b64 = exportSave(state)
    const blob = new Blob([b64], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const dateStr = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `arkalon-labs-save-${dateStr}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        setImportText(content.trim())
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleReset() {
    if (resetConfirm === 'idle') {
      setResetConfirm('confirm1')
      return
    }
    if (resetConfirm === 'confirm1') {
      setResetConfirm('confirm2')
      return
    }
    if (resetConfirm === 'confirm2') {
      setResetConfirm('typing')
      setTimeout(() => resetInputRef.current?.focus(), 50)
      return
    }
    if (resetConfirm === 'typing') {
      if (resetInput.trim().toUpperCase() !== 'RESET') {
        setResetInput('')
        return
      }
      clearLocalStorageSave()
      const freshState = makeInitialState()
      useGameStore.getState().applyState(freshState)
      saveToLocalStorage(useGameStore.getState())
      resetUnlockSessionCaches()
      resetTickSession()
      resetDirtyFlags()
      setNotationMode(freshState.settings.notationMode)
      applyThemeVariables(freshState.settings.currentUITheme as UITheme)
      document.documentElement.setAttribute(
        'data-neon-bloom',
        String(freshState.settings.neonBloom)
      )
      document.documentElement.setAttribute(
        'data-reduced-motion',
        String(freshState.settings.reducedMotion)
      )
      useUIStore.setState({
        terminalLines: [],
        alertQueue: [],
        activeAlert: null,
        unseenUnlockedTabs: []
      })
      const music = useMusicStore.getState()
      music.setContext('idle')
      music.setMuted(false)
      music.setVolumeBGM(freshState.settings.volumeMusic)
      music.setVolumeSFX(freshState.settings.volumeSFX)
      music.setVolumeVoice(freshState.settings.volumeVoice)
      setResetConfirm('idle')
      setResetInput('')
      setSettingsPanelOpen(false)
      try {
        const cloudRes = await resetCloudState()
        if (!cloudRes.success && cloudRes.error !== 'Database offline') {
          useUIStore.getState().pushAlert({
            priority: 1,
            variant: 'info',
            title: 'Cloud Reset Warning',
            message:
              'Local facility reset, but cloud deletion failed. Sync manually once online.',
            autoDismissMs: 6000
          })
        }
      } catch {
        useUIStore.getState().pushAlert({
          priority: 1,
          variant: 'info',
          title: 'Cloud Reset Warning',
          message:
            'Local facility reset, but cloud deletion could not be reached.',
          autoDismissMs: 6000
        })
      }
    }
  }

  const returnUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : 'https://labs.rpsleague.fi'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs animate-[fade-in_0.15s_ease-out_both]"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div className="card bg-(--bg-elevated) rounded-t-2xl sm:rounded-2xl border border-(--border-default) w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="h-1.5 w-full shrink-0 bg-linear-to-r from-(--border-accent) via-white to-(--border-accent)" />

        <div className="flex items-center justify-between px-4 py-3 border-b border-(--border-default) shrink-0 bg-(--bg-surface)">
          <p className="text-xs font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
            Facility Configuration
          </p>
          <button
            onClick={() => setSettingsPanelOpen(false)}
            className="text-(--text-secondary) hover:text-(--text-primary) p-1 rounded font-mono text-sm leading-none cursor-pointer"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-dark p-4 flex flex-col gap-4">
          {/* Arkalon Core Network Account & Recovery Card */}
          <div className="w-full rounded-xl border border-(--border-default) bg-(--bg-surface) p-3.5">
            <p className="mb-1 text-xs uppercase tracking-wider text-(--text-secondary) font-bold font-mono">
              Arkalon Core Identity
            </p>
            <p className="mb-3 text-xs text-(--text-secondary) leading-relaxed font-sans">
              Your profile is anchored by Arkalon Core. Access your recovery
              code or switch devices on the Network Hub.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1 font-mono">
              <a
                href={`https://network.rpsleague.fi/settings?returnTo=${encodeURIComponent(returnUrl)}`}
                className="flex-1 inline-flex items-center justify-center rounded-lg border border-(--border-default) px-3 py-2 text-xs font-semibold text-(--text-primary) hover:border-(--border-accent) hover:text-(--text-accent) transition-colors cursor-pointer"
              >
                Reroll Nickname ↗
              </a>
              <a
                href={`https://network.rpsleague.fi/settings?tab=identity&returnTo=${encodeURIComponent(returnUrl)}`}
                className="flex-1 inline-flex items-center justify-center rounded-lg bg-(--border-accent)/10 border border-(--border-accent)/40 px-3 py-2 text-xs font-semibold text-(--text-accent) hover:bg-(--border-accent)/20 transition-colors cursor-pointer"
              >
                Reveal Recovery Code ↗
              </a>
            </div>
          </div>

          <VolumeControls />

          {/* Facility UI Themes */}
          <div className="flex flex-col gap-1.5 font-mono">
            <span className="text-[10px] font-bold text-(--text-secondary) uppercase tracking-widest">
              Interface Color Theme
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {(Object.keys(THEME_CONFIG) as UITheme[]).map((thm) => {
                const cfg = THEME_CONFIG[thm]
                const isSelected =
                  (settings.currentUITheme ?? 'default') === thm

                return (
                  <button
                    key={thm}
                    onClick={() => updateSetting('currentUITheme', thm)}
                    className={[
                      'py-1.5 px-2 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer',
                      isSelected
                        ? 'border-(--border-accent) bg-(--border-accent)/15 text-(--border-accent)'
                        : 'border-(--border-default) bg-(--bg-surface) text-(--text-secondary) hover:text-(--text-primary)'
                    ].join(' ')}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cfg.borderAccent }}
                    />
                    <span className="truncate">{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Visual FX & Accessibility */}
          <div className="flex flex-col gap-2 font-mono p-3 rounded-xl bg-(--bg-surface) border border-(--border-default)">
            <span className="text-[10px] font-bold text-(--text-secondary) uppercase tracking-widest">
              Visual FX & Optics
            </span>

            <div className="flex items-center justify-between text-xs">
              <span className="text-(--text-secondary)">
                Neon Bloom Bloom Filter:
              </span>
              <button
                onClick={() => updateSetting('neonBloom', !settings.neonBloom)}
                className={[
                  'px-2 py-0.5 rounded border text-[10px] font-bold cursor-pointer transition-colors',
                  settings.neonBloom
                    ? 'border-(--status-success) bg-(--status-success)/15 text-(--status-success)'
                    : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)'
                ].join(' ')}
              >
                {settings.neonBloom ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-(--text-secondary)">
                CRT Scanlines Layer:
              </span>
              <button
                onClick={() =>
                  updateSetting('crtScanlines', !settings.crtScanlines)
                }
                className={[
                  'px-2 py-0.5 rounded border text-[10px] font-bold cursor-pointer transition-colors',
                  settings.crtScanlines
                    ? 'border-cyan-400 bg-cyan-400/15 text-cyan-300'
                    : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)'
                ].join(' ')}
              >
                {settings.crtScanlines ? 'ACTIVE' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-(--text-secondary)">
                Reduced Motion Mode:
              </span>
              <button
                onClick={() =>
                  updateSetting('reducedMotion', !settings.reducedMotion)
                }
                className={[
                  'px-2 py-0.5 rounded border text-[10px] font-bold cursor-pointer transition-colors',
                  settings.reducedMotion
                    ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                    : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)'
                ].join(' ')}
              >
                {settings.reducedMotion ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Hotkey Cheat Sheet Modal Trigger */}
          <button
            onClick={() => {
              setSettingsPanelOpen(false)
              useUIStore.getState().setHotkeyModalOpen(true)
            }}
            className="w-full py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg border border-(--border-default) bg-(--bg-surface) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-accent) transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Keyboard Shortcuts Matrix</span>
            <kbd className="text-[9px] px-1 py-0.2 rounded bg-black/40 border border-(--border-default) font-mono">
              ?
            </kbd>
          </button>

          {/* Number Format */}
          <div className="flex flex-col gap-1.5 font-mono">
            <span className="text-[10px] font-bold text-(--text-secondary) uppercase tracking-widest">
              Number Format
            </span>
            <div className="grid grid-cols-2 gap-2">
              {NOTATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSetting('notationMode', opt.value)}
                  className={[
                    'py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center',
                    settings.notationMode === opt.value
                      ? 'border-(--border-accent) bg-(--border-accent)/10 text-(--border-accent)'
                      : 'border-(--border-default) bg-(--bg-surface) text-(--text-secondary) hover:text-(--text-primary)'
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save Management */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
              Save & Backup
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleManualSave}
                className="py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg border border-(--border-accent)/40 bg-(--border-accent)/10 text-(--text-accent) hover:bg-(--border-accent) hover:text-[#080c14] transition-all cursor-pointer"
              >
                Save Locally
              </button>
              <button
                onClick={handleCloudSync}
                disabled={cloudSyncStatus === 'syncing'}
                className="py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg border border-(--status-success)/50 bg-(--status-success)/10 text-(--status-success) hover:bg-(--status-success) hover:text-[#080c14] transition-all cursor-pointer disabled:opacity-50"
              >
                {cloudSyncStatus === 'syncing'
                  ? 'Syncing...'
                  : cloudSyncStatus === 'synced'
                    ? 'Cloud Synced!'
                    : cloudSyncStatus === 'rate_limited'
                      ? 'Cooldown (30s)'
                      : cloudSyncStatus === 'offline'
                        ? 'Cloud Offline'
                        : cloudSyncStatus === 'error'
                          ? 'Sync Failed'
                          : 'Sync Now'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExport}
                className="py-2 text-xs font-mono font-bold rounded-lg border border-(--border-default) bg-(--bg-surface) text-(--text-secondary) hover:border-(--border-accent) hover:text-(--text-primary) transition-all cursor-pointer"
              >
                {exportText ? 'Copied to Clipboard!' : 'Export Save'}
              </button>

              <button
                onClick={() => {
                  setImportSuccess(false)
                  setImportError('')
                  setImportOpen((prev) => !prev)
                }}
                className="py-2 text-xs font-mono font-bold rounded-lg border border-(--border-default) bg-(--bg-surface) text-(--text-secondary) hover:border-(--border-accent) hover:text-(--text-primary) transition-all cursor-pointer"
              >
                Import Save
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadSave}
                className="py-2 text-xs font-mono font-bold rounded-lg border border-(--border-default) bg-(--bg-surface) text-(--text-secondary) hover:border-(--border-accent) hover:text-(--text-primary) transition-all cursor-pointer"
              >
                Download (.txt)
              </button>

              <label className="py-2 text-xs font-mono font-bold rounded-lg border border-(--border-default) bg-(--bg-surface) text-(--text-secondary) hover:border-(--border-accent) hover:text-(--text-primary) transition-all cursor-pointer text-center">
                Upload File
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {importOpen && (
              <div className="flex flex-col gap-2 p-2.5 rounded-lg border border-(--border-default) bg-(--bg-surface)">
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={2}
                  placeholder="Paste base64 save string here..."
                  className="w-full bg-(--bg-elevated) border border-(--border-default) rounded-lg p-2 text-[10px] font-mono text-(--text-primary) resize-none focus:outline-none focus:border-(--border-accent) placeholder:text-(--text-secondary)/50"
                  autoFocus
                />
                {importError && (
                  <p className="text-[11px] text-red-400 font-mono">
                    {importError}
                  </p>
                )}
                {importSuccess && (
                  <p className="text-[11px] text-(--status-success) font-mono">
                    Save imported successfully.
                  </p>
                )}
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className={[
                    'w-full py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer',
                    importText.trim()
                      ? 'border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110'
                      : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-60'
                  ].join(' ')}
                >
                  Confirm Import
                </button>
              </div>
            )}

            {/* Hard Reset */}
            <div className="pt-2">
              {resetConfirm === 'typing' ? (
                <div className="flex flex-col gap-2 p-3 rounded-lg border border-red-500/50 bg-red-950/20">
                  <p className="text-[11px] text-red-400 font-mono">
                    Type RESET to confirm. This clears all local progress and
                    cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <input
                      ref={resetInputRef}
                      type="text"
                      value={resetInput}
                      onChange={(e) => setResetInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                      placeholder="Type RESET"
                      className="flex-1 bg-(--bg-surface) border border-red-500/60 rounded px-2.5 py-1.5 text-xs font-mono text-(--text-primary) focus:outline-none"
                    />
                    <button
                      onClick={handleReset}
                      className="px-3 py-1.5 text-xs font-mono font-bold rounded border border-red-500 bg-red-500 text-black cursor-pointer"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleReset}
                  className={[
                    'w-full py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer',
                    resetConfirm !== 'idle'
                      ? 'border-red-500 bg-red-500/20 text-red-400'
                      : 'border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10'
                  ].join(' ')}
                >
                  {resetConfirm === 'idle'
                    ? 'Hard Reset Facility'
                    : resetConfirm === 'confirm1'
                      ? 'Click again to confirm'
                      : 'Are you sure? Click once more'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}