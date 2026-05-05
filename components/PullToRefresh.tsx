'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const THRESHOLD = 70   // px of pull needed to trigger
const RESISTANCE = 0.45 // how much drag slows the pull

export default function PullToRefresh() {
  const router = useRouter()
  const [pullY, setPullY]       = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const startYRef  = useRef(0)
  const pullingRef = useRef(false)
  const pullYRef   = useRef(0)

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 2) return
      startYRef.current  = e.touches[0].clientY
      pullingRef.current = true
    }

    const onMove = (e: TouchEvent) => {
      if (!pullingRef.current) return
      const dy = e.touches[0].clientY - startYRef.current
      if (dy <= 0) { pullingRef.current = false; return }
      const clamped = Math.min(dy * RESISTANCE, THRESHOLD + 24)
      pullYRef.current = clamped
      setPullY(clamped)
    }

    const onEnd = () => {
      if (!pullingRef.current) return
      pullingRef.current = false
      if (pullYRef.current >= THRESHOLD) {
        setRefreshing(true)
        setPullY(THRESHOLD)
        router.refresh()
        setTimeout(() => {
          setRefreshing(false)
          setPullY(0)
          pullYRef.current = 0
        }, 1400)
      } else {
        setPullY(0)
        pullYRef.current = 0
      }
    }

    window.addEventListener('touchstart', onStart,  { passive: true })
    window.addEventListener('touchmove',  onMove,   { passive: true })
    window.addEventListener('touchend',   onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove',  onMove)
      window.removeEventListener('touchend',   onEnd)
    }
  }, [router])

  if (pullY === 0 && !refreshing) return null

  const progress = Math.min(pullY / THRESHOLD, 1)
  const isReady  = pullY >= THRESHOLD

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex items-end justify-center pb-2 pointer-events-none overflow-hidden"
      style={{
        height: pullY,
        background: 'linear-gradient(to bottom, #1a4731 0%, transparent 100%)',
        transition: refreshing ? 'none' : 'height 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}
    >
      <div className="flex items-center gap-2" style={{ opacity: progress }}>
        <span
          className="text-base"
          style={{
            display: 'inline-block',
            animation: refreshing ? 'ptr-spin 0.7s linear infinite' : 'none',
            transform: refreshing ? 'none' : `rotate(${progress * 180}deg)`,
            transition: 'transform 0.1s',
          }}
        >
          🎱
        </span>
        <span className="font-heading text-xs tracking-widest text-pool-gold">
          {refreshing ? 'REFRESHING…' : isReady ? 'RELEASE' : 'PULL TO REFRESH'}
        </span>
      </div>

      <style>{`@keyframes ptr-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
