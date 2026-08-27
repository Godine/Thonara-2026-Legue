import { useRef } from 'react'

interface LongPressOptions<T> {
  /** Fired when the press is held past `delay` ms. Receives the value passed to `start`. */
  onLongPress: (arg: T) => void
  /** Fired on release when the long-press did NOT trigger (i.e. a normal tap). */
  onClick: (arg: T) => void
  /** Hold duration in milliseconds before `onLongPress` fires. */
  delay?: number
}

/**
 * Press-and-hold detection for a button whose target value (e.g. the active
 * player id) is only known at event time. Mirrors the original inline
 * handlers: a hold past `delay` fires `onLongPress` and suppresses the tap;
 * a quick release fires `onClick`.
 */
export function useLongPress<T>({ onLongPress, onClick, delay = 400 }: LongPressOptions<T>) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggered = useRef(false)

  const clear = () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  const start = (arg: T, disabled = false) => {
    if (disabled) return
    triggered.current = false
    timer.current = setTimeout(() => {
      triggered.current = true
      onLongPress(arg)
    }, delay)
  }

  const end = (arg: T) => {
    clear()
    if (!triggered.current) onClick(arg)
  }

  return { start, end, cancel: clear }
}
