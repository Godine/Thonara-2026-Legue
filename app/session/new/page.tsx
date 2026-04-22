'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, isPast, isToday, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { GAME_SCHEDULE, PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import PlayerBall from '@/components/PlayerBall'

export default function NewSessionPage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const isPastDate = !isToday(parseISO(date)) && isPast(parseISO(date))

  const createSession = async () => {
    setError('')
    setLoading(true)

    const { data: existing } = await supabase
      .from('sessions')
      .select('id')
      .eq('date', date)
      .maybeSingle()

    if (existing) {
      router.push(`/session/${existing.id}`)
      return
    }

    const { data: players, error: playerErr } = await supabase
      .from('players')
      .select('id, username')

    if (playerErr || !players?.length) {
      setError('Could not load players. Make sure you ran the setup SQL in Supabase.')
      setLoading(false)
      return
    }

    const byUsername = Object.fromEntries(players.map(p => [p.username, p.id]))
    const missingPlayers = GAME_SCHEDULE.flatMap(g => [g.player1, g.player2, g.scorer])
      .filter((u, i, arr) => arr.indexOf(u) === i)
      .filter(u => !byUsername[u])

    if (missingPlayers.length > 0) {
      setError(`Missing players in database: ${missingPlayers.join(', ')}. Run the setup SQL again.`)
      setLoading(false)
      return
    }

    const { data: session, error: sessionErr } = await supabase
      .from('sessions')
      .insert({ date })
      .select('id')
      .single()

    if (sessionErr || !session) {
      setError('Failed to create session.')
      setLoading(false)
      return
    }

    const games = GAME_SCHEDULE.map(g => ({
      session_id: session.id,
      game_number: g.gameNumber,
      player1_id: byUsername[g.player1],
      player2_id: byUsername[g.player2],
    }))

    const { error: gamesErr } = await supabase.from('games').insert(games)

    if (gamesErr) {
      setError('Failed to create games.')
      setLoading(false)
      return
    }

    router.push(`/session/${session.id}`)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      <div className="mb-6">
        <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-1">New session</p>
        <h1 className="font-heading text-4xl tracking-wider text-pool-chalk">THURSDAY NIGHT POOL</h1>
        <div className="mt-2 h-px bg-gradient-to-r from-pool-gold/40 to-transparent" />
      </div>

      {/* Date picker — prominent */}
      <div className="bg-pool-surface rounded-2xl border border-pool-gold/20 p-5 mb-2">
        <label className="block text-xs font-body tracking-widest uppercase text-pool-gold mb-3">
          📅 Session date
        </label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full bg-pool-bg border border-pool-border rounded-xl px-4 py-4 text-pool-chalk font-body text-lg focus:outline-none focus:border-pool-gold/50 focus:ring-1 focus:ring-pool-gold/30 transition-all"
        />
        <p className="text-pool-chalk-dim text-xs font-body mt-2">
          {isPastDate
            ? '📋 Past date — you can enter results directly without shot tracking'
            : '🎱 Today — track shots live as you play'}
        </p>
      </div>

      {isPastDate && (
        <div className="bg-pool-gold/10 border border-pool-gold/30 rounded-xl px-4 py-3 mb-5 text-sm font-body text-pool-gold">
          After creating the session, tap <strong>Set Result</strong> on each game to enter who won.
        </div>
      )}

      {/* Game lineup */}
      <div className="bg-pool-surface rounded-2xl border border-pool-border overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-pool-border">
          <p className="font-heading text-base tracking-widest text-pool-chalk-dim">GAME LINEUP</p>
        </div>
        <div className="divide-y divide-pool-border">
          {GAME_SCHEDULE.map(g => {
            const p1     = PLAYER_STYLES[g.player1 as PlayerUsername]
            const p2     = PLAYER_STYLES[g.player2 as PlayerUsername]
            const scorer = PLAYER_STYLES[g.scorer  as PlayerUsername]
            return (
              <div key={g.gameNumber} className="flex items-center px-4 py-3 gap-2">
                <span className="font-heading text-sm text-pool-chalk-dim w-5">{g.gameNumber}</span>
                <div className="flex items-center gap-2 flex-1">
                  {p1 && <PlayerBall number={p1.number} color={p1.color} size={26} />}
                  <span className="font-heading text-sm tracking-wide" style={{ color: p1?.color }}>
                    {p1?.label.toUpperCase()}
                  </span>
                </div>
                <span className="font-body text-xs text-pool-chalk-dim">vs</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="font-heading text-sm tracking-wide" style={{ color: p2?.color }}>
                    {p2?.label.toUpperCase()}
                  </span>
                  {p2 && <PlayerBall number={p2.number} color={p2.color} size={26} />}
                </div>
                <div className="w-16 text-right shrink-0">
                  <span className="text-xs font-body text-pool-chalk-dim">{scorer?.label} scores</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <p className="text-pool-red text-sm font-body text-center mb-4 animate-fade-in">{error}</p>
      )}

      <button
        onClick={createSession}
        disabled={loading}
        className="w-full bg-pool-gold hover:bg-pool-gold-light disabled:opacity-50 text-pool-bg font-heading text-2xl tracking-widest py-5 rounded-2xl transition-all active:scale-[0.98] glow-gold"
      >
        {loading ? 'CREATING…' : isPastDate ? 'CREATE & ENTER RESULTS' : "LET'S PLAY"}
      </button>
    </div>
  )
}
