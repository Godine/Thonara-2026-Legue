import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { insertShot, type ShotInsert } from '@/lib/queries'

/**
 * Offline-tolerant queue for shot inserts. When a write fails (offline), the
 * caller enqueues the row; the queue is flushed automatically when the browser
 * fires the `online` event. Rows that still fail on flush are re-queued.
 */
export function usePendingShots(db: SupabaseClient) {
  const [pendingCount, setPendingCount] = useState(0)
  const queue = useRef<ShotInsert[]>([])
  const flushing = useRef(false)

  useEffect(() => {
    async function flushPending() {
      if (flushing.current || queue.current.length === 0) return
      flushing.current = true
      const batch = [...queue.current]
      queue.current = []
      setPendingCount(0)
      const failed: ShotInsert[] = []
      for (const shot of batch) {
        try {
          await insertShot(db, shot)
        } catch {
          failed.push(shot)
        }
      }
      if (failed.length > 0) {
        queue.current = [...failed, ...queue.current]
        setPendingCount(queue.current.length)
      }
      flushing.current = false
    }
    window.addEventListener('online', flushPending)
    return () => window.removeEventListener('online', flushPending)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const enqueue = (shot: ShotInsert) => {
    queue.current.push(shot)
    setPendingCount(queue.current.length)
  }

  const enqueueMany = (shots: ShotInsert[]) => {
    shots.forEach(s => queue.current.push(s))
    setPendingCount(queue.current.length)
  }

  /** Drop the most recently queued row (used when undoing an unsynced shot). */
  const dropLast = () => {
    queue.current = queue.current.slice(0, -1)
    setPendingCount(queue.current.length)
  }

  return { pendingCount, enqueue, enqueueMany, dropLast }
}
