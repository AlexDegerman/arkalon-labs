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

const TYPEWRITER_SPEED = 24
let lineIdCounter = 0

export default function ArkalonTerminal({ lines, maxLines = 3 }: Props) {
  const [displayedLines, setDisplayedLines] = useState<TerminalLine[]>([])
  const queueRef = useRef<string[]>([])
  const isTypingRef = useRef<boolean>(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevLinesLengthRef = useRef<number>(0)

  const processNextInQueue = () => {
    if (queueRef.current.length === 0) {
      isTypingRef.current = false
      return
    }

    isTypingRef.current = true
    const nextText = queueRef.current.shift()!
    const currentId = ++lineIdCounter

    setDisplayedLines((curr) =>
      [
        ...curr,
        { id: currentId, text: nextText, displayedText: '', complete: false }
      ].slice(-maxLines)
    )

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
        timerRef.current = setTimeout(typeChar, TYPEWRITER_SPEED)
      } else {
        timerRef.current = setTimeout(processNextInQueue, 80)
      }
    }

    timerRef.current = setTimeout(typeChar, TYPEWRITER_SPEED)
  }

  useEffect(() => {
    if (lines.length < prevLinesLengthRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current)
      queueRef.current = []
      isTypingRef.current = false
      setDisplayedLines([])
      prevLinesLengthRef.current = 0
    }

    const newItems = lines.slice(prevLinesLengthRef.current)
    prevLinesLengthRef.current = lines.length

    if (newItems.length > 0) {
      queueRef.current.push(...newItems)
      if (!isTypingRef.current) {
        processNextInQueue()
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [lines, maxLines])

  return (
    <div
      className="w-full rounded-xl border border-(--border-default) bg-(--bg-surface)/95 p-3 flex flex-col gap-1 min-h-18 font-mono text-[13px] shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]"
      aria-live="polite"
      aria-label="Arkalon communications terminal"
    >
      {displayedLines.length === 0 ? (
        <p className="text-(--text-secondary)/50">
          &gt; Awaiting signal...
        </p>
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
  )
}
