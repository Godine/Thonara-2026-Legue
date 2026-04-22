'use client'

import { useEffect, useState } from 'react'
import { PLAYER_STYLES, PLAYERS, type PlayerUsername } from '@/lib/game-config'
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
  const [checked, setChecked] = useState(false)
  const [playerSet, setPlayerSet] = useState(false)

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
    <div className="fixed inset-0 z-[200] bg-pool-bg flex flex-col items-center justify-center px-6 animate-fade-in">
      {/* Decorative balls */}
      <div className="absolute top-8 left-6 opacity-10">
        <PlayerBall number={8} color="#1a1a1a" size={100} />
      </div>
      <div className="absolute bottom-12 right-4 opacity-10">
        <PlayerBall number={9} color="#f5c518" size={120} />
      </div>

      <div className="relative z-10 w-full max-w-sm text-center">
        <p className="font-body text-xs tracking-[0.3em] uppercase text-pool-chalk-dim mb-3">
          Welcome to
        </p>
        <h1 className="font-heading text-5xl tracking-widest text-pool-chalk leading-none">
          THONARA
        </h1>
        <p className="font-heading text-2xl tracking-[0.4em] gold-shimmer mb-2">
          LEAGUE 2026
        </p>
        <div className="h-px bg-gradient-to-r from-transparent via-pool-gold/40 to-transparent mb-10" />

        <p className="font-heading text-xl tracking-widest text-pool-chalk-dim mb-6">
          WHO ARE YOU?
        </p>

        <div className="flex flex-col gap-4">
          {PLAYERS.map(username => {
            const style = PLAYER_STYLES[username]
            return (
              <button
                key={username}
                onClick={() => pick(username)}
                className="flex items-center gap-5 bg-pool-surface border border-pool-border hover:border-pool-gold/40 rounded-2xl px-6 py-5 transition-all active:scale-[0.97] group"
              >
                <PlayerBall number={style.number} color={style.color} size={52} />
                <span
                  className="font-heading text-3xl tracking-widest group-hover:brightness-125 transition-all"
                  style={{ color: style.color }}
                >
                  {style.label.toUpperCase()}
                </span>
                <span className="ml-auto text-pool-chalk-dim text-xl group-hover:text-pool-gold transition-colors">
                  →
                </span>
              </button>
            )
          })}
        </div>

        <p className="text-pool-chalk-dim text-xs font-body mt-8">
          Your choice is saved on this device
        </p>
      </div>
    </div>
  )
}
