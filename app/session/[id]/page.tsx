'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { GAME_SCHEDULE, PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import PlayerBall from '@/components/PlayerBall'
import type { Session, Game, Player, Shot } from '@/types/database'

interface GameWithPlayers extends Game {
  player1: Player
  player2: Player
  winner: Player | null
  shots: Shot[]
}

interface FullSession extends Session {
  games: GameWithPlayers[]
}

function computeStats(shots: Shot[], playerId: string) {
  const mine = shots.filter(s => s.player_id === playerId)
  const potted = mine.filter(s => s.potted && !s.is_lucky).length
  const lucky = mine.filter(s => s.is_lucky).length
  const errors = mine.filter(s => s.is_error).length
  const total = mine.length
  return { total, potted: potted + lucky, lucky, errors }
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [session, setSession] = useState<FullSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    const { data } = await supabase
      .from('sessions')
      .select(`
        *,
        games (
          *,
          player1:players!games_player1_id_fkey (*),
          player2:players!games_player2_id_fkey (*),
          winner:players!games_winner_id_fkey  (*),
          shots (*)
        )
      `)
      .eq('id', id)
      .single()

    if (data) {
      data.games = data.games.sort((a: Game, b: Game) => a.game_number - b.game_number)
      setSession(data as FullSession)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user?.id ?? null))
    fetchSession()

    // Realtime subscription — refresh games when anything changes
    const channel = supabase
      .channel(`session-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `session_id=eq.${id}` }, fetchSession)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shots' }, fetchSession)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, fetchSession])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-spin">⬤</div>
          <p className="text-pool-chalk-dim font-body text-sm">Loading session…</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-pool-chalk-dim font-body">Session not found.</p>
        <Link href="/" className="text-pool-gold text-sm mt-4 block">← Back to home</Link>
      </div>
    )
  }

  const completedGames = session.games.filter(g => g.is_complete)
  const totalGames = session.games.length

  // Tally wins in this session
  const sessionWins: Record<string, number> = {}
  for (const g of completedGames) {
    if (g.winner_id) sessionWins[g.winner_id] = (sessionWins[g.winner_id] ?? 0) + 1
  }

  const isLocked = new Date().getTime() - new Date(session.created_at).getTime() > 7 * 24 * 60 * 60 * 1000

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-5">
        <Link href="/" className="text-pool-chalk-dim text-sm font-body hover:text-pool-gold transition-colors">
          ← Home
        </Link>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim">Session</p>
            <h1 className="font-heading text-4xl tracking-wider text-pool-chalk">
              {format(new Date(session.date + 'T12:00:00'), 'MMMM d').toUpperCase()}
            </h1>
          </div>
          <div className="text-right">
            <p className="font-heading text-3xl text-pool-gold">{completedGames.length}<span className="text-pool-chalk-dim text-xl">/{totalGames}</span></p>
            <p className="font-body text-xs text-pool-chalk-dim">games done</p>
          </div>
        </div>
        <div className="mt-2 h-px bg-gradient-to-r from-pool-gold/40 to-transparent" />
      </div>

      {/* Progress bar */}
      <div className="bg-pool-surface rounded-full h-1.5 mb-5 overflow-hidden">
        <div
          className="h-full bg-pool-gold rounded-full transition-all duration-500"
          style={{ width: `${(completedGames.length / totalGames) * 100}%` }}
        />
      </div>

      {/* Session scoreboard (only show after some games) */}
      {completedGames.length > 0 && (
        <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 mb-5">
          <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3">SESSION SCORE</p>
          <div className="flex gap-3 justify-center">
            {session.games
              .flatMap(g => [g.player1, g.player2])
              .filter((p, i, arr) => p && arr.findIndex(x => x?.id === p?.id) === i)
              .map(player => {
                if (!player) return null
                const style = PLAYER_STYLES[player.username as PlayerUsername]
                const wins = sessionWins[player.id] ?? 0
                return (
                  <div key={player.id} className="flex-1 text-center">
                    <div className="flex justify-center mb-1">
                      {style && <PlayerBall number={style.number} color={style.color} size={36} />}
                    </div>
                    <p className="font-heading text-3xl text-pool-gold">{wins}</p>
                    <p className="font-body text-xs text-pool-chalk-dim">{player.display_name}</p>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Game cards */}
      <div className="space-y-3">
        {session.games.map(game => {
          const p1Stats = computeStats(game.shots, game.player1_id)
          const p2Stats = computeStats(game.shots, game.player2_id)
          const schedule = GAME_SCHEDULE.find(g => g.gameNumber === game.game_number)
          const p1Style = PLAYER_STYLES[game.player1.username as PlayerUsername]
          const p2Style = PLAYER_STYLES[game.player2.username as PlayerUsername]

          const isActive = !game.is_complete
          const canScore = isActive && !isLocked

          return (
            <div
              key={game.id}
              className={`bg-pool-surface rounded-2xl border overflow-hidden transition-all ${
                game.is_complete
                  ? 'border-pool-border opacity-80'
                  : 'border-pool-gold/30 glow-gold'
              }`}
            >
              {/* Game header */}
              <div className="flex items-center px-4 py-3 border-b border-pool-border">
                <span className="font-heading text-sm text-pool-chalk-dim w-8">G{game.game_number}</span>
                <div className="flex-1 flex items-center gap-2">
                  {p1Style && <PlayerBall number={p1Style.number} color={p1Style.color} size={24} />}
                  <span className="font-heading text-base tracking-wide" style={{ color: p1Style?.color }}>
                    {game.player1.display_name.toUpperCase()}
                  </span>
                </div>
                <span className="font-body text-xs text-pool-chalk-dim px-2">vs</span>
                <div className="flex-1 flex items-center gap-2 justify-end">
                  <span className="font-heading text-base tracking-wide" style={{ color: p2Style?.color }}>
                    {game.player2.display_name.toUpperCase()}
                  </span>
                  {p2Style && <PlayerBall number={p2Style.number} color={p2Style.color} size={24} />}
                </div>
                {/* Status badge */}
                {game.is_complete ? (
                  <span className="ml-3 text-xs font-body text-pool-green-bright bg-pool-green-bright/10 px-2 py-0.5 rounded-full">
                    Done
                  </span>
                ) : game.shots.length > 0 ? (
                  <span className="ml-3 text-xs font-body text-pool-gold bg-pool-gold/10 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                ) : (
                  <span className="ml-3 text-xs font-body text-pool-chalk-dim">–</span>
                )}
              </div>

              {/* Stats row */}
              {(game.shots.length > 0 || game.is_complete) && (
                <div className="grid grid-cols-2 divide-x divide-pool-border px-0 py-2">
                  {[
                    { player: game.player1, stats: p1Stats },
                    { player: game.player2, stats: p2Stats },
                  ].map(({ player, stats }) => {
                    const isWinner = game.winner_id === player.id
                    return (
                      <div key={player.id} className={`px-4 py-1 ${isWinner ? 'bg-pool-gold/5' : ''}`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-body text-xs ${isWinner ? 'text-pool-gold' : 'text-pool-chalk-dim'}`}>
                            {isWinner ? '🏆 ' : ''}{player.display_name}
                          </span>
                          <span className="font-heading text-xl text-pool-chalk">{stats.potted}</span>
                        </div>
                        <div className="flex gap-3 mt-0.5">
                          <span className="text-xs text-pool-chalk-dim font-body">{stats.total} shots</span>
                          {stats.errors > 0 && (
                            <span className="text-xs text-pool-red font-body">{stats.errors} err</span>
                          )}
                          {stats.lucky > 0 && (
                            <span className="text-xs text-pool-gold font-body">{stats.lucky} ★</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Scorer note & action */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-pool-border">
                {schedule && (
                  <p className="text-xs font-body text-pool-chalk-dim">
                    Scored by {PLAYER_STYLES[schedule.scorer as PlayerUsername]?.label}
                  </p>
                )}
                {canScore && (
                  <Link
                    href={`/session/${session.id}/game/${game.id}`}
                    className="bg-pool-gold text-pool-bg font-heading text-sm tracking-widest px-4 py-1.5 rounded-xl hover:bg-pool-gold-light transition-all active:scale-95"
                  >
                    {game.shots.length > 0 ? 'CONTINUE' : 'START'}
                  </Link>
                )}
                {game.is_complete && (
                  <Link
                    href={`/session/${session.id}/game/${game.id}`}
                    className="text-xs font-body text-pool-chalk-dim hover:text-pool-gold transition-colors"
                  >
                    View →
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Complete session */}
      {completedGames.length === totalGames && totalGames > 0 && !session.is_complete && (
        <div className="mt-5 text-center">
          <p className="text-pool-gold font-heading text-xl tracking-wider mb-3">ALL GAMES COMPLETE! 🎱</p>
        </div>
      )}

      {isLocked && (
        <p className="text-center text-pool-chalk-dim text-xs font-body mt-4">
          This session is locked (more than 7 days old).
        </p>
      )}
    </div>
  )
}
