'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PlayerBall from '@/components/PlayerBall'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login')
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError("Passwords don't match."); return }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/'), 2500)
    }
  }

  if (done) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-4">🎱</div>
        <h2 className="font-heading text-3xl text-pool-gold tracking-wider mb-2">PASSWORD UPDATED</h2>
        <p className="text-pool-chalk-dim font-body text-sm">Taking you to the league…</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <PlayerBall number={8} color="#1a1a1a" size={64} className="drop-shadow-2xl" />
          </div>
          <h1 className="font-heading text-4xl tracking-widest text-pool-chalk">SET NEW PASSWORD</h1>
          <div className="mt-3 h-px bg-gradient-to-r from-transparent via-pool-gold/40 to-transparent" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-body tracking-widest uppercase text-pool-chalk-dim mb-2">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-pool-surface border border-pool-border rounded-xl px-4 py-4 text-pool-chalk font-body text-base placeholder:text-pool-chalk-dim/50 focus:outline-none focus:border-pool-gold/50 focus:ring-1 focus:ring-pool-gold/30 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-body tracking-widest uppercase text-pool-chalk-dim mb-2">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-pool-surface border border-pool-border rounded-xl px-4 py-4 text-pool-chalk font-body text-base placeholder:text-pool-chalk-dim/50 focus:outline-none focus:border-pool-gold/50 focus:ring-1 focus:ring-pool-gold/30 transition-all"
            />
          </div>

          {error && (
            <p className="text-pool-red text-sm font-body text-center animate-fade-in">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pool-gold hover:bg-pool-gold-light disabled:opacity-50 text-pool-bg font-heading text-2xl tracking-widest py-4 rounded-xl transition-all active:scale-[0.98] glow-gold mt-2"
          >
            {loading ? 'SAVING…' : 'CONFIRM'}
          </button>
        </form>
      </div>
    </div>
  )
}
