'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Dices, ExternalLink } from 'lucide-react'
import { makeInitialState, useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import {
  exportSave,
  importSave,
  clearLocalStorageSave,
  saveToLocalStorage
} from '@/lib/saveGame'
import { setNotationMode, setDecimalPrecision } from '@/lib/format'
import { rerollPlayerName } from '@/app/actions/rerollPlayerName'
import VolumeControls from '@/components/ui/VolumeControls'
import type { NotationMode } from '@/types/game'

const NOTATION_OPTIONS: {
  value: NotationMode
  label: string
  example: string
}[] = [
  { value: 'suffix', label: 'Suffix', example: '1.50 Million' },
  { value: 'scientific', label: 'Scientific', example: '1.50e6' },
  { value: 'engineering', label: 'Engineering', example: '1.50E6' },
  { value: 'logarithm', label: 'Logarithm', example: 'e6.18' }
]

const PRECISION_OPTIONS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: '1 decimal' },
  { value: 2, label: '2 decimals' },
  { value: 3, label: '3 decimals' }
]

type ConfirmState = 'idle' | 'confirm1' | 'confirm2' | 'typing'

export default function SettingsPanel() {
  const { settingsPanelOpen, setSettingsPanelOpen } = useUIStore()
  const settings = useGameStore((s) => s.settings)

  const [displayName, setDisplayName] = useState<string>('Director')
  const [justRerolled, setJustRerolled] = useState(false)
  const [isRerolling, startReroll] = useTransition()

  const [exportText, setExportText] = useState('')
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState(false)
  const [resetConfirm, setResetConfirm] = useState<ConfirmState>('idle')
  const [resetInput, setResetInput] = useState('')
  const resetInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('arkalon_labs_display_name')
      if (stored) setDisplayName(stored)
    } catch {}

    function onPlayerReady(e: Event) {
      const customEvent = e as CustomEvent<string>
      if (customEvent.detail) {
        setDisplayName(customEvent.detail)
      }
    }

    window.addEventListener('arkalon_player_ready', onPlayerReady)
    return () =>
      window.removeEventListener('arkalon_player_ready', onPlayerReady)
  }, [])

  if (!settingsPanelOpen) return null

  function handleReroll() {
    if (isRerolling) return
    startReroll(async () => {
      const res = await rerollPlayerName()
      if (res.success && res.nickname) {
        setDisplayName(res.nickname)
        try {
          localStorage.setItem('arkalon_labs_display_name', res.nickname)
        } catch {}
        setJustRerolled(true)
        setTimeout(() => setJustRerolled(false), 800)
      }
    })
  }

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
    if (key === 'decimalPrecision') {
      setDecimalPrecision(value as 1 | 2 | 3)
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
    setImportSuccess(true)
    setImportText('')
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

  function handleReset() {
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
      useGameStore.getState().applyState(makeInitialState())
      setResetConfirm('idle')
      setResetInput('')
      setSettingsPanelOpen(false)
    }
  }

  const returnUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : 'https://labs.rpsleague.fi/game'

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
          {/* Identity Section */}
          <div className="flex flex-col gap-2 rounded-xl border border-(--border-default) bg-(--bg-surface) p-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-(--text-secondary) font-mono">
              Arkalon Core Identity
            </span>

            <div
              className="w-full rounded-lg border px-3 py-2 flex items-center justify-between gap-2 transition-all duration-200"
              style={{
                backgroundColor: justRerolled
                  ? 'rgba(0, 240, 255, 0.12)'
                  : 'var(--bg-elevated)',
                borderColor: justRerolled
                  ? 'var(--border-accent)'
                  : 'var(--border-default)'
              }}
            >
              <span
                className="flex-1 whitespace-nowrap tracking-tight font-bold font-mono text-xs text-(--text-accent)"
                style={{
                  fontSize:
                    displayName.length > 18
                      ? '10px'
                      : displayName.length > 13
                        ? '12px'
                        : '14px'
                }}
              >
                {isRerolling ? '...' : displayName}
              </span>

              <button
                type="button"
                onClick={handleReroll}
                disabled={isRerolling}
                title="Reroll procedural nickname"
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-(--border-default) bg-(--bg-surface) text-(--text-secondary) hover:border-(--border-accent) hover:text-(--border-accent) cursor-pointer transition-all disabled:opacity-50"
              >
                <Dices
                  size={12}
                  className={isRerolling ? 'animate-spin' : ''}
                />
                <span>REROLL</span>
              </button>
            </div>

            <p className="text-[11px] text-(--text-secondary) leading-relaxed">
              Your account is anchored across the Arkalon Network. Reveal your
              master recovery code on the Hub.
            </p>

            <a
              href={`https://network.rpsleague.fi/settings?tab=identity&returnTo=${encodeURIComponent(returnUrl)}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-mono font-bold bg-(--border-accent)/10 border border-(--border-accent)/40 text-(--border-accent) hover:bg-(--border-accent)/20 transition-colors cursor-pointer"
            >
              <span>Reveal Recovery Code on Hub</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <VolumeControls />

          {/* Display & Notation */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
              Display & Notation
            </span>

            <div className="grid grid-cols-2 gap-1.5">
              {NOTATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSetting('notationMode', opt.value)}
                  className={[
                    'flex flex-col items-start p-2 rounded-lg border text-left transition-all cursor-pointer select-none',
                    settings.notationMode === opt.value
                      ? 'border-(--border-accent) bg-(--border-accent)/10 shadow-[0_0_8px_rgba(0,240,255,0.15)]'
                      : 'border-(--border-default) bg-(--bg-surface) hover:border-(--text-secondary)'
                  ].join(' ')}
                  aria-pressed={settings.notationMode === opt.value}
                >
                  <span className="text-xs font-bold text-(--text-primary)">
                    {opt.label}
                  </span>
                  <span className="text-[10px] font-mono text-(--text-secondary)">
                    {opt.example}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-1.5">
              {PRECISION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSetting('decimalPrecision', opt.value)}
                  className={[
                    'flex-1 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer',
                    settings.decimalPrecision === opt.value
                      ? 'border-(--border-accent) text-(--border-accent) bg-(--border-accent)/10'
                      : 'border-(--border-default) bg-(--bg-surface) text-(--text-secondary) hover:text-(--text-primary)'
                  ].join(' ')}
                  aria-pressed={settings.decimalPrecision === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              {[
                { key: 'reducedMotion' as const, label: 'Reduced Motion' },
                {
                  key: 'colorBlindMode' as const,
                  label: 'Color-Blind Accessibility'
                }
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center justify-between p-2 rounded-lg bg-(--bg-surface) border border-(--border-default) cursor-pointer"
                >
                  <span className="text-xs font-medium text-(--text-secondary)">
                    {label}
                  </span>
                  <button
                    role="switch"
                    aria-checked={settings[key]}
                    onClick={() => updateSetting(key, !settings[key])}
                    className={[
                      'relative w-9 h-5 rounded-full border transition-colors cursor-pointer',
                      settings[key]
                        ? 'bg-(--status-success) border-(--status-success)'
                        : 'bg-(--bg-elevated) border-(--border-default)'
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute top-0.5 w-4 h-4 rounded-full bg-black transition-transform',
                        settings[key] ? 'translate-x-4' : 'translate-x-0.5'
                      ].join(' ')}
                    />
                  </button>
                </label>
              ))}
            </div>
          </div>

          {/* Save Management */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
              Local File Backups
            </span>

            <button
              onClick={handleManualSave}
              className="w-full py-2 text-xs font-mono font-bold rounded-lg border border-(--border-default) bg-(--bg-surface) text-(--text-secondary) hover:border-(--border-accent) hover:text-(--text-primary) transition-all cursor-pointer"
            >
              Save to Local Storage Now
            </button>

            <button
              onClick={handleExport}
              className="w-full py-2 text-xs font-mono font-bold rounded-lg border border-(--border-default) bg-(--bg-surface) text-(--text-secondary) hover:border-(--border-accent) hover:text-(--text-primary) transition-all cursor-pointer"
            >
              Export Save String (Clipboard)
            </button>
            {exportText && (
              <textarea
                readOnly
                value={exportText}
                rows={2}
                className="w-full bg-(--bg-surface) border border-(--border-default) rounded-lg p-2 text-[10px] font-mono text-(--text-secondary) resize-none focus:outline-none"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
            )}

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={2}
              placeholder="Paste base64 save string here to import..."
              className="w-full bg-(--bg-surface) border border-(--border-default) rounded-lg p-2 text-[10px] font-mono text-(--text-primary) resize-none focus:outline-none focus:border-(--border-accent) placeholder:text-(--text-secondary)/50"
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
                'w-full py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer',
                importText.trim()
                  ? 'border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110'
                  : 'border-(--border-default) bg-(--bg-surface) text-(--text-secondary)/40 cursor-not-allowed opacity-60'
              ].join(' ')}
            >
              Import Save String
            </button>

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
