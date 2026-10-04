'use client'

import { useState, useRef } from 'react'
import { makeInitialState, useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { exportSave, importSave, clearLocalStorageSave, saveToLocalStorage } from '@/lib/saveGame'
import { setNotationMode, setDecimalPrecision } from '@/lib/format'
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
  const [exportText, setExportText] = useState('')
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState(false)
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
    // Sync notation mode to format.ts module state
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
    } catch {
      // Manual copy fallback - text is shown in textarea
    }
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
      // Perform hard reset
      clearLocalStorageSave()
      useGameStore.getState().applyState(makeInitialState())
      setResetConfirm('idle')
      setResetInput('')
      setSettingsPanelOpen(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div className="glass bg-(--bg-elevated) rounded-t-xl sm:rounded-xl border border-(--border-default) w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-(--border-default) shrink-0">
          <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
            Settings
          </p>
          <button
            onClick={() => setSettingsPanelOpen(false)}
            className="text-(--text-secondary) hover:text-(--text-primary) transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent) rounded"
            aria-label="Close settings"
          >
            x
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-dark p-4 flex flex-col gap-5">
          {/* Volume controls */}
          <VolumeControls />

          {/* Display settings */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
              Display
            </p>

            {/* Notation mode */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-(--text-secondary)">
                Number notation
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {NOTATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateSetting('notationMode', opt.value)}
                    className={[
                      'flex flex-col items-start px-2.5 py-2 rounded border text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent)',
                      settings.notationMode === opt.value
                        ? 'border-(--border-accent) bg-(--border-accent)/10'
                        : 'border-(--border-default) hover:border-(--text-secondary)'
                    ].join(' ')}
                    aria-pressed={settings.notationMode === opt.value}
                  >
                    <span className="text-xs font-semibold text-(--text-primary)">
                      {opt.label}
                    </span>
                    <span className="text-[0.6rem] font-mono text-(--text-secondary)">
                      {opt.example}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Decimal precision */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-(--text-secondary)">
                Decimal places
              </span>
              <div className="flex gap-1.5">
                {PRECISION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateSetting('decimalPrecision', opt.value)}
                    className={[
                      'flex-1 py-1.5 text-xs font-mono rounded border transition-colors',
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent)',
                      settings.decimalPrecision === opt.value
                        ? 'border-(--border-accent) text-(--text-accent) bg-(--border-accent)/10'
                        : 'border-(--border-default) text-(--text-secondary) hover:border-(--text-secondary)'
                    ].join(' ')}
                    aria-pressed={settings.decimalPrecision === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessibility toggles */}
            <div className="flex flex-col gap-1.5">
              {[
                { key: 'reducedMotion' as const, label: 'Reduced motion' },
                { key: 'colorBlindMode' as const, label: 'Color-blind mode' }
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="text-xs text-(--text-secondary)">
                    {label}
                  </span>
                  <button
                    role="switch"
                    aria-checked={settings[key]}
                    onClick={() => updateSetting(key, !settings[key])}
                    className={[
                      'relative size-9 h-5 rounded-full border transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)',
                      settings[key]
                        ? 'bg-(--status-success) border-(--status-success)'
                        : 'bg-(--bg-elevated) border-(--border-default)'
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute top-0.5 size-4 rounded-full bg-white transition-transform',
                        settings[key] ? 'translate-x-4' : 'translate-x-0.5'
                      ].join(' ')}
                    />
                  </button>
                </label>
              ))}
            </div>
          </div>

          {/* Save management */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
              Save Management
            </p>

            {/* Manual save */}
            <button
              onClick={handleManualSave}
              className="w-full py-2 text-xs font-mono rounded border border-(--border-default) text-(--text-secondary) hover:border-(--text-secondary) hover:text-(--text-primary) transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)"
            >
              Save Now
            </button>

            {/* Export */}
            <div className="flex flex-col gap-1.5">
              <button
                onClick={handleExport}
                className="w-full py-2 text-xs font-mono rounded border border-(--border-default) text-(--text-secondary) hover:border-(--text-secondary) hover:text-(--text-primary) transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)"
              >
                Export Save (copies to clipboard)
              </button>
              {exportText && (
                <textarea
                  readOnly
                  value={exportText}
                  rows={3}
                  className="w-full bg-(--bg-elevated) border border-(--border-default) rounded p-2 text-[0.6rem] font-mono text-(--text-secondary) resize-none focus:outline-none"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  aria-label="Exported save data"
                />
              )}
            </div>

            {/* Import */}
            <div className="flex flex-col gap-1.5">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={3}
                placeholder="Paste save string here..."
                className="w-full bg-(--bg-elevated) border border-(--border-default) rounded p-2 text-[0.6rem] font-mono text-(--text-primary) resize-none focus:outline-none focus:border-(--border-accent) placeholder:text-(--text-secondary)"
                aria-label="Import save data"
              />
              {importError && (
                <p className="text-[0.65rem] text-#ef4444">{importError}</p>
              )}
              {importSuccess && (
                <p className="text-[0.65rem] text-(--status-success)">
                  Save imported successfully.
                </p>
              )}
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className={[
                  'w-full py-2 text-xs font-mono rounded border transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)',
                  importText.trim()
                    ? 'border-(--text-accent) text-(--text-accent) hover:bg-(--text-accent)/10'
                    : 'border-(--status-locked) text-(--status-locked) cursor-not-allowed opacity-60'
                ].join(' ')}
              >
                Import Save
              </button>
            </div>

            {/* Hard reset */}
            <div className="flex flex-col gap-1.5 mt-2">
              {resetConfirm === 'typing' ? (
                <>
                  <p className="text-[0.65rem] text-#ef4444">
                    Type RESET to confirm. This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <input
                      ref={resetInputRef}
                      type="text"
                      value={resetInput}
                      onChange={(e) => setResetInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                      placeholder="Type RESET"
                      className="flex-1 bg-(--bg-elevated) border border-#ef4444 rounded px-3 py-1.5 text-xs font-mono text-(--text-primary) focus:outline-none"
                    />
                    <button
                      onClick={handleReset}
                      className="px-3 py-1.5 text-xs font-mono rounded border border-#ef4444 text-#ef4444 hover:bg-#ef4444/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-#ef4444"
                    >
                      Confirm
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={handleReset}
                  className={[
                    'w-full py-2 text-xs font-mono rounded border transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-#ef4444',
                    resetConfirm !== 'idle'
                      ? 'border-#ef4444 text-#ef4444 bg-#ef4444/10'
                      : 'border-(--border-default) text-(--text-secondary) hover:border-#ef4444 hover:text-#ef4444'
                  ].join(' ')}
                >
                  {resetConfirm === 'idle'
                    ? 'Hard Reset'
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
