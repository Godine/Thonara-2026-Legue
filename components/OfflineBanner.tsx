'use client'

import { useEffect, useRef, useState } from 'react'

export default function OfflineBanner() {
  const [status, setStatus] = useState<'online' | 'offline' | 'reconnected'>('online')
  const wasOfflineRef = useRef(false)

  useEffect(() => {
    if (!navigator.onLine) {
      wasOfflineRef.current = true
      setStatus('offline')
    }

    const handleOffline = () => {
      wasOfflineRef.current = true
      setStatus('offline')
    }

    const handleOnline = () => {
      if (wasOfflineRef.current) {
        setStatus('reconnected')
        setTimeout(() => setStatus('online'), 3000)
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (status === 'online') return null

  return (
    <div
      className="fixed top-14 inset-x-0 z-40 flex items-center justify-center gap-2 py-2 font-body text-xs tracking-wide"
      style={{
        background: status === 'offline' ? '#7a2020' : '#1a4731',
        color: '#f0ede6',
      }}
    >
      {status === 'offline' ? (
        <>
          <span>📵</span>
          <span>You&apos;re offline — shots will sync when reconnected</span>
        </>
      ) : (
        <>
          <span>✓</span>
          <span>Back online — syncing</span>
        </>
      )}
    </div>
  )
}
