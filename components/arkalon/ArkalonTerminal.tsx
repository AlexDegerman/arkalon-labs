'use client'

import { useEffect, useRef, useState } from 'react'

interface TerminalLine {
  id: number
  text: string
  displayedText: string
  complete: boolean
}

interface Props {
  lines: string[]
  maxLines?: number
}

const TYPEWRITER_SPEED = 68
const PUNCTUATION_PAUSE_MS = 280
const COMMA_PAUSE_MS = 130
let lineIdCounter = 0

export default function ArkalonTerminal({ lines, maxLines = 3 }: Props) {
  const [displayedLines, setDisplayedLines] = useState<TerminalLine[]>(() =>
    lines.slice(-maxLines).map((text) => ({
      id: ++lineIdCounter,
      text,
      displayedText: text,
      complete: true
    }))
  )
  const queueRef = useRef<string[]>([])
  const activeTextRef = useRef<string | null>(null)
  const isTypingRef = useRef<boolean>(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevLinesRef = useRef<string[]>(lines)

  const processNextInQueue = () => {
    if (queueRef.current.length === 0) {
      activeTextRef.current = null
      isTypingRef.current = false
      return
    }

    isTypingRef.current = true
    const nextText = queueRef.current.shift()!
    activeTextRef.current = nextText
    const currentId = ++lineIdCounter

    setDisplayedLines((curr) => {
      const last = curr[curr.length - 1]
      if (last && !last.complete && last.text === nextText) {
        return curr.map((l, idx) =>
          idx === curr.length - 1
            ? { ...l, id: currentId, displayedText: '' }
            : l
        )
      }
      return [
        ...curr,
        { id: currentId, text: nextText, displayedText: '', complete: false }
      ].slice(-maxLines)
    })

    let charIndex = 0

    const typeChar = () => {
      charIndex++
      const isComplete = charIndex >= nextText.length

      setDisplayedLines((curr) =>
        curr.map((line) =>
          line.id === currentId
            ? {
                ...line,
                displayedText: nextText.slice(0, charIndex),
                complete: isComplete
              }
            : line
        )
      )

      if (!isComplete) {
        const hasBacklog = queueRef.current.length > 0
        const typedChar = nextText[charIndex - 1]
        let delay = hasBacklog ? 28 : TYPEWRITER_SPEED
        if (!hasBacklog) {
          if ('.!?;:'.includes(typedChar)) delay += PUNCTUATION_PAUSE_MS
          else if (typedChar === ',') delay += COMMA_PAUSE_MS
        }
        timerRef.current = setTimeout(typeChar, delay)
      } else {
        activeTextRef.current = null
        timerRef.current = setTimeout(processNextInQueue, 120)
      }
    }

    timerRef.current = setTimeout(typeChar, 50)
  }

  useEffect(() => {
    const prev = prevLinesRef.current
    prevLinesRef.current = lines

    if (lines.length === 0) {
      if (timerRef.current) clearTimeout(timerRef.current)
      queueRef.current = []
      activeTextRef.current = null
      isTypingRef.current = false
      setDisplayedLines([])
      return
    }

    // Identify incoming lines by finding the last observed overlap
    let newItems: string[] = []
    if (prev.length === 0) {
      newItems = [...lines]
    } else {
      const lastLine = prev[prev.length - 1]
      let matchIdx = -1
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i] === lastLine) {
          matchIdx = i
          break
        }
      }
      if (matchIdx !== -1 && matchIdx < lines.length - 1) {
        newItems = lines.slice(matchIdx + 1)
      } else if (matchIdx === -1) {
        newItems = [lines[lines.length - 1]]
      }
    }

    if (newItems.length > 0) {
      queueRef.current.push(...newItems)
    }
    if (queueRef.current.length > 0 && !isTypingRef.current) {
      processNextInQueue()
    }
  }, [lines, maxLines])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (activeTextRef.current) {
        queueRef.current.unshift(activeTextRef.current)
        activeTextRef.current = null
      }
      isTypingRef.current = false
    }
  }, [])

  const isTransmitting = displayedLines.some((l) => !l.complete)

  return (
    <div
      className="w-full rounded-xl border border-(--border-default) bg-(--bg-surface)/95 overflow-hidden flex flex-col font-mono text-[13px] shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]"
      aria-live="polite"
      aria-label="Arkalon communications terminal"
    >
      <div className="flex items-center justify-between px-3 py-1.5 bg-(--bg-elevated) border-b border-(--border-default)/70 select-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-(--border-accent) shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-wider text-(--text-accent) truncate">
            ARKALON // OVERSEER FEED
          </span>
        </div>
        <span className="text-[9px] font-bold text-(--text-secondary)/70 uppercase tracking-widest shrink-0">
          {isTransmitting ? 'TRANSMITTING' : 'ONLINE'}
        </span>
      </div>

      <div className="p-3 flex flex-col gap-1 min-h-18">
        {displayedLines.length === 0 ? (
          <p className="text-(--text-secondary)/50">&gt; Awaiting signal...</p>
        ) : (
          displayedLines.map((line) => (
            <p
              key={line.id}
              className={`leading-relaxed ${
                line.complete
                  ? 'text-(--text-secondary)'
                  : 'text-(--text-primary)'
              }`}
            >
              <span
                className="text-(--text-accent) mr-1.5 select-none font-bold"
                aria-hidden="true"
              >
                &gt;
              </span>
              {line.displayedText}
              {!line.complete && (
                <span
                  className="cursor-blink inline-block w-1.5 h-3.5 ml-0.5 align-middle bg-(--text-accent) shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                  aria-hidden="true"
                />
              )}
            </p>
          ))
        )}
      </div>
    </div>
  )
}
