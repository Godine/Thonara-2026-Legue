'use client'

import { useEffect, useState } from 'react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)
  const [showBackOnline, setShowBackOnline] = useState(false)

  useEffect(() => {
    setOffline(!navigator.onLine)

    const handleOffline = () => {
      setOffline(true)
      setWasOffline(true)
      setShowBackOnline(false)
    }

    const handleOnline = () => {
      setOffline(false)
      if (wasOffline) {
        setShowBackOnline(true)
        setTimeout(() => setShowBackOnline(false), 3000)
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [wasOffline])

  if (!offline && !showBackOnline) return null

  return (
    <div
      className="fixed top-14 inset-x-0 z-40 flex items-center justify-center gap-2 py-2 font-body text-xs tracking-wide transition-all"
      style={{
        background: offline ? '#7a2020' : '#1a4731',
        color: '#f0ede6',
      }}
    >
      {offline ? (
        <>
          <span>📵</span>
          <span>You&apos;re offline — showing cached data</span>
        </>
      ) : (
        <>
          <span>✓</span>
          <span>Back online</span>
        </>
      )}
    </div>
  )
}
