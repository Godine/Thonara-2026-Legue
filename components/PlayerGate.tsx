'use client'

import { useEffect, useState } from 'react'
import { PLAYER_STYLES, PLAYERS, type PlayerUsername } from '@/lib/game-config'
import PlayerAvatar from './PlayerAvatar'
import PlayerBall from './PlayerBall'

export const PLAYER_KEY = 'thonara_player'

export function getStoredPlayer(): PlayerUsername | null {
  if (typeof window === 'undefined') return null
  const val = localStorage.getItem(PLAYER_KEY) as PlayerUsername | null
  return val && PLAYER_STYLES[val] ? val : null
}

export function setStoredPlayer(username: PlayerUsername) {
  localStorage.setItem(PLAYER_KEY, username)
}

export function clearStoredPlayer() {
  localStorage.removeItem(PLAYER_KEY)
}

export default function PlayerGate() {
  const [checked,   setChecked]   = useState(false)
  const [playerSet, setPlayerSet] = useState(false)
  const [hovered,   setHovered]   = useState<PlayerUsername | null>(null)

  useEffect(() => {
    setPlayerSet(!!getStoredPlayer())
    setChecked(true)
  }, [])

  const pick = (username: PlayerUsername) => {
    setStoredPlayer(username)
    setPlayerSet(true)
  }

  if (!checked || playerSet) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-5 animate-fade-in overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0e1e12 0%, #060d08 70%)' }}
    >
      {/* Decorative background balls */}
      <div className="absolute -top-8 -left-8 opacity-[0.06] pointer-events-none">
        <PlayerBall number={8} color="#ffffff" size={160} />
      </div>
      <div className="absolute -bottom-10 -right-10 opacity-[0.06] pointer-events-none">
        <PlayerBall number={9} color="#c9a227" size={200} />
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 -right-16 opacity-[0.04] pointer-events-none">
        <PlayerBall number={1} color="#f5c518" size={180} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl opacity-30" style={{ background: '#c9a227' }} />
              <PlayerBall number={8} color="#c9a227" size={64} className="relative" />
            </div>
          </div>
          <p className="font-body text-xs tracking-[0.35em] uppercase text-pool-chalk-dim mb-2">
            Welcome to
          </p>
          <h1 className="font-heading text-6xl tracking-widest text-pool-chalk leading-none mb-1">
            THONARA
          </h1>
          <p className="font-heading text-2xl tracking-[0.5em] gold-shimmer mb-6">
            LEAGUE
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-pool-gold/30 to-transparent" />
        </div>

        <p className="font-body text-sm text-pool-chalk-dim text-center mb-5 tracking-wide">
          Who are you playing as today?
        </p>

        {/* Player cards */}
        <div className="flex flex-col gap-3">
          {PLAYERS.map(username => {
            const style = PLAYER_STYLES[username]
            const isHovered = hovered === username
            return (
              <button
                key={username}
                onClick={() => pick(username)}
                onMouseEnter={() => setHovered(username)}
                onMouseLeave={() => setHovered(null)}
                className="flex items-center gap-4 rounded-2xl px-5 py-4 border transition-all duration-200 active:scale-[0.97] text-left"
                style={{
                  background: isHovered
                    ? `linear-gradient(135deg, ${style.color}18 0%, ${style.color}08 100%)`
                    : 'rgba(14,30,18,0.8)',
                  borderColor: isHovered ? `${style.color}60` : '#1f3525',
                  boxShadow: isHovered ? `0 0 28px ${style.color}20` : 'none',
                }}
              >
                {/* Avatar with glow */}
                <div className="relative shrink-0">
                  {isHovered && (
                    <div
                      className="absolute inset-0 rounded-full blur-md opacity-50"
                      style={{ background: style.color, transform: 'scale(1.1)' }}
                    />
                  )}
                  <PlayerAvatar username={username} size={52} className="relative" />
                </div>

                {/* Name */}
                <div className="flex-1">
                  <p
                    className="font-heading text-3xl tracking-widest transition-colors duration-200"
                    style={{ color: isHovered ? style.color : '#c8c4b5' }}
                  >
                    {style.label.toUpperCase()}
                  </p>
                  <p className="font-body text-xs text-pool-chalk-dim mt-0.5">
                    Ball #{style.number}
                  </p>
                </div>

                {/* Arrow */}
                <svg
                  width="20" height="20" viewBox="0 0 20 20"
                  className="shrink-0 transition-all duration-200"
                  style={{ opacity: isHovered ? 1 : 0.3 }}
                >
                  <path
                    d="M7 4 L13 10 L7 16"
                    stroke={isHovered ? style.color : '#7a786f'}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )
          })}
        </div>

        <p className="text-pool-chalk-dim text-xs font-body text-center mt-6 opacity-50">
          Your choice is saved on this device
        </p>
      </div>
    </div>
  )
}
