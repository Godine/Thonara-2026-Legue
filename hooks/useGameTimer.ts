import { useEffect, useRef, useState } from 'react'
import type { Shot } from '@/types/database'

/**
 * Live elapsed-time counter for a game. Starts from the first shot's
 * timestamp and ticks every second until the game completes. Behaviour is
 * identical to the original two effects on the game page.
 */
export function useGameTimer(shots: Shot[], isComplete: boolean | undefined) {
  const [elapsed, setElapsed] = useState(0)
  const [started, setStarted] = useState(false)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (shots.length > 0 && !started) {
      startRef.current = new Date(shots[0].created_at).getTime()
      setStarted(true)
    }
  }, [shots, started])

  useEffect(() => {
    if (!started || isComplete) return
    const tick = () => setElapsed(Math.floor((Date.now() - startRef.current!) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [started, isComplete])

  return { elapsed, started }
}
