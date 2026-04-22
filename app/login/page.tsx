'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toEmail, PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import PlayerBall from '@/components/PlayerBall'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const trimmed = username.trim().toLowerCase()
    if (!['adib', 'ahmed', 'godine'].includes(trimmed)) {
      setError('Unknown player name.')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: toEmail(trimmed),
      password,
    })

    if (authError) {
      setError('Wrong password. Try again.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background pool balls (decorative) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-8 -left-8 opacity-10">
          <PlayerBall number={1} color="#f5c518" size={140} />
        </div>
        <div className="absolute top-20 -right-10 opacity-10">
          <PlayerBall number={2} color="#60a5fa" size={110} />
        </div>
        <div className="absolute -bottom-12 left-1/3 opacity-10">
          <PlayerBall number={3} color="#f87171" size={160} />
        </div>
        <div className="absolute bottom-24 -right-6 opacity-8">
          <PlayerBall number={8} color="#1a1a1a" size={90} />
        </div>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <PlayerBall number={8} color="#1a1a1a" size={72} className="drop-shadow-2xl" />
              <div className="absolute inset-0 rounded-full animate-pulse-gold" />
            </div>
          </div>
          <h1 className="font-heading text-5xl tracking-widest text-pool-chalk">
            THONARA
          </h1>
          <p className="font-heading text-2xl tracking-[0.3em] gold-shimmer mt-1">
            LEAGUE 2026
          </p>
          <div className="mt-3 h-px bg-gradient-to-r from-transparent via-pool-gold/40 to-transparent" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-body tracking-widest uppercase text-pool-chalk-dim mb-2">
              Player
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="adib / ahmed / godine"
                autoComplete="username"
                autoCapitalize="none"
                required
                className="w-full bg-pool-surface border border-pool-border rounded-xl px-4 py-4 text-pool-chalk font-body text-base placeholder:text-pool-chalk-dim/50 focus:outline-none focus:border-pool-gold/50 focus:ring-1 focus:ring-pool-gold/30 transition-all"
              />
              {/* Player ball preview */}
              {username && PLAYER_STYLES[username.toLowerCase() as PlayerUsername] && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <PlayerBall
                    number={PLAYER_STYLES[username.toLowerCase() as PlayerUsername].number}
                    color={PLAYER_STYLES[username.toLowerCase() as PlayerUsername].color}
                    size={32}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-body tracking-widest uppercase text-pool-chalk-dim mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full bg-pool-surface border border-pool-border rounded-xl px-4 py-4 text-pool-chalk font-body text-base placeholder:text-pool-chalk-dim/50 focus:outline-none focus:border-pool-gold/50 focus:ring-1 focus:ring-pool-gold/30 transition-all"
            />
          </div>

          {error && (
            <p className="text-pool-red text-sm font-body text-center animate-fade-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pool-gold hover:bg-pool-gold-light disabled:opacity-50 text-pool-bg font-heading text-2xl tracking-widest py-4 rounded-xl transition-all active:scale-[0.98] glow-gold mt-2"
          >
            {loading ? 'SIGNING IN…' : 'RACK EM UP'}
          </button>
        </form>

        <p className="text-center text-pool-chalk-dim text-xs font-body mt-6">
          Ask Adib for your password 🎱
        </p>
      </div>
    </div>
  )
}
