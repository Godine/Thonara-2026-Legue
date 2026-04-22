'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import { getStoredPlayer, clearStoredPlayer, PLAYER_KEY } from './PlayerGate'
import PlayerBall from './PlayerBall'

export default function Navbar() {
  const [username, setUsername] = useState<PlayerUsername | null>(null)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    setUsername(getStoredPlayer())

    const onStorage = () => setUsername(getStoredPlayer())
    window.addEventListener('storage', onStorage)

    // Also poll so the ball appears immediately after PlayerGate selection
    const interval = setInterval(() => setUsername(getStoredPlayer()), 500)
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(interval)
    }
  }, [])

  const switchPlayer = () => {
    clearStoredPlayer()
    setSwitching(false)
    setUsername(null)
  }

  const style = username ? PLAYER_STYLES[username] : null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-pool-bg/95 backdrop-blur-sm border-b border-pool-border">
      <div className="max-w-lg mx-auto h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-pool-gold text-xl leading-none">⬤</span>
          <span className="font-heading text-lg tracking-widest text-pool-chalk group-hover:text-pool-gold transition-colors">
            THONARA
          </span>
          <span className="font-heading text-lg tracking-widest text-pool-gold">2026</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="text-sm font-body text-pool-chalk-dim hover:text-pool-chalk transition-colors"
          >
            History
          </Link>

          {style && username && (
            <div className="relative">
              <button
                onClick={() => setSwitching(s => !s)}
                className="flex items-center gap-2 bg-pool-surface border border-pool-border rounded-xl px-3 py-1.5 hover:border-pool-gold/40 transition-all"
              >
                <PlayerBall number={style.number} color={style.color} size={22} />
                <span className="font-heading text-sm tracking-wide" style={{ color: style.color }}>
                  {style.label.toUpperCase()}
                </span>
              </button>

              {switching && (
                <div className="absolute right-0 top-full mt-2 bg-pool-surface border border-pool-border rounded-xl overflow-hidden shadow-xl z-50 animate-fade-in">
                  <button
                    onClick={switchPlayer}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm font-body text-pool-chalk-dim hover:text-pool-chalk hover:bg-pool-border transition-colors whitespace-nowrap"
                  >
                    Switch player
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
