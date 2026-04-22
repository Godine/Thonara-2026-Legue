'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { GAME_SCHEDULE, PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import PlayerBall from '@/components/PlayerBall'
import type { Session, Game, Player, Shot } from '@/types/database'

interface GameFull extends Game {
  player1: Player
  player2: Player
  winner: Player | null
  shots: Shot[]
}

interface FullSession extends Session {
  games: GameFull[]
}

interface QuickResult {
  gameId: string
  winnerId: string
  blackBall: boolean
}

function computeStats(shots: Shot[], playerId: string) {
  const mine = shots.filter(s => s.player_id === playerId)
  return {
    potted: mine.filter(s => s.potted).length,
    shots: mine.length,
    errors: mine.filter(s => s.is_error).length,
    lucky: mine.filter(s => s.is_lucky).length,
  }
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [session, setSession] = useState<FullSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [quick, setQuick] = useState<QuickResult | null>(null)
  const [quickSaving, setQuickSaving] = useState(false)

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
    fetchSession()
    const channel = supabase
      .channel(`session-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games',  filter: `session_id=eq.${id}` }, fetchSession)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shots' }, fetchSession)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id, fetchSession])

  const openQuick = (game: GameFull) => {
    setQuick({ gameId: game.id, winnerId: game.player1_id, blackBall: false })
  }

  const submitQuickResult = async () => {
    if (!quick?.winnerId || quickSaving) return
    setQuickSaving(true)
    await supabase.from('games').update({
      winner_id: quick.winnerId,
      is_complete: true,
      loser_potted_black: quick.blackBall,
    }).eq('id', quick.gameId)
    setQuick(null)
    setQuickSaving(false)
  }

  const clearResult = async (gameId: string) => {
    await supabase.from('games').update({
      winner_id: null,
      is_complete: false,
      loser_potted_black: false,
    }).eq('id', gameId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-pool-chalk-dim font-body animate-pulse">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-pool-chalk-dim font-body">Session not found.</p>
        <Link href="/" className="text-pool-gold text-sm mt-4 block">← Home</Link>
      </div>
    )
  }

  const completedGames = session.games.filter(g => g.is_complete)
  const totalGames = session.games.length

  const sessionWins: Record<string, number> = {}
  for (const g of completedGames) {
    if (g.winner_id) sessionWins[g.winner_id] = (sessionWins[g.winner_id] ?? 0) + 1
  }

  const uniquePlayers = session.games
    .flatMap(g => [g.player1, g.player2])
    .filter((p, i, arr) => p && arr.findIndex(x => x?.id === p?.id) === i)

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-5">
        <Link href="/" className="text-pool-chalk-dim text-sm font-body hover:text-pool-gold transition-colors">← Home</Link>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim">Session</p>
            <h1 className="font-heading text-4xl tracking-wider text-pool-chalk">
              {format(new Date(session.date + 'T12:00:00'), 'MMMM d').toUpperCase()}
            </h1>
          </div>
          <div className="text-right">
            <p className="font-heading text-3xl text-pool-gold">
              {completedGames.length}<span className="text-pool-chalk-dim text-xl">/{totalGames}</span>
            </p>
            <p className="font-body text-xs text-pool-chalk-dim">games done</p>
          </div>
        </div>
        <div className="mt-2 h-px bg-gradient-to-r from-pool-gold/40 to-transparent" />
      </div>

      {/* Progress bar */}
      <div className="bg-pool-surface rounded-full h-1.5 mb-5 overflow-hidden">
        <div className="h-full bg-pool-gold rounded-full transition-all duration-500"
          style={{ width: `${(completedGames.length / totalGames) * 100}%` }} />
      </div>

      {/* Session scoreboard */}
      {completedGames.length > 0 && (
        <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 mb-5">
          <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3">SESSION SCORE</p>
          <div className="flex gap-3 justify-center">
            {uniquePlayers.map(player => {
              if (!player) return null
              const style = PLAYER_STYLES[player.username as PlayerUsername]
              return (
                <div key={player.id} className="flex-1 text-center">
                  <div className="flex justify-center mb-1">
                    {style && <PlayerBall number={style.number} color={style.color} size={36} />}
                  </div>
                  <p className="font-heading text-3xl text-pool-gold">{sessionWins[player.id] ?? 0}</p>
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
          const isQuickOpen = quick?.gameId === game.id

          return (
            <div key={game.id}
              className={`bg-pool-surface rounded-2xl border overflow-hidden transition-all ${
                game.is_complete ? 'border-pool-border' : 'border-pool-gold/20'
              }`}
            >
              {/* Game header row */}
              <div className="flex items-center px-4 py-3 gap-2">
                <span className="font-heading text-sm text-pool-chalk-dim w-5">{game.game_number}</span>

                <div className="flex items-center gap-2 flex-1">
                  {p1Style && <PlayerBall number={p1Style.number} color={p1Style.color} size={22} />}
                  <span className="font-heading text-sm tracking-wide" style={{ color: p1Style?.color }}>
                    {game.player1.display_name.toUpperCase()}
                  </span>
                </div>

                <span className="font-body text-xs text-pool-chalk-dim">vs</span>

                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="font-heading text-sm tracking-wide" style={{ color: p2Style?.color }}>
                    {game.player2.display_name.toUpperCase()}
                  </span>
                  {p2Style && <PlayerBall number={p2Style.number} color={p2Style.color} size={22} />}
                </div>

                {/* Status */}
                {game.is_complete ? (
                  <span className="ml-1 text-xs font-body text-pool-green-bright">✓</span>
                ) : game.shots.length > 0 ? (
                  <span className="ml-1 text-xs font-body text-pool-gold">●</span>
                ) : (
                  <span className="ml-1 text-xs font-body text-pool-chalk-dim">–</span>
                )}
              </div>

              {/* Winner banner (completed) */}
              {game.is_complete && game.winner && (
                <div className="flex items-center justify-between px-4 py-2 bg-pool-gold/5 border-t border-pool-border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏆</span>
                    <span className="font-heading text-base tracking-wide text-pool-gold">
                      {game.winner.display_name.toUpperCase()} WINS
                    </span>
                    {game.loser_potted_black && (
                      <span className="text-xs font-body text-pool-chalk-dim">(black ball)</span>
                    )}
                  </div>
                  <button
                    onClick={() => clearResult(game.id)}
                    className="text-xs font-body text-pool-chalk-dim hover:text-pool-red transition-colors"
                  >
                    Edit
                  </button>
                </div>
              )}

              {/* Shot stats row (if any shots recorded) */}
              {game.shots.length > 0 && (
                <div className="grid grid-cols-2 divide-x divide-pool-border border-t border-pool-border">
                  {[{ player: game.player1, stats: p1Stats }, { player: game.player2, stats: p2Stats }].map(({ player, stats }) => (
                    <div key={player.id} className="px-4 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-body text-xs text-pool-chalk-dim">{player.display_name}</span>
                        <span className="font-heading text-lg text-pool-chalk">{stats.potted}</span>
                      </div>
                      <div className="flex gap-2 text-xs font-body text-pool-chalk-dim">
                        <span>{stats.shots} shots</span>
                        {stats.errors > 0 && <span className="text-pool-red">{stats.errors} err</span>}
                        {stats.lucky > 0  && <span className="text-pool-gold">{stats.lucky}★</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick result entry (inline) */}
              {isQuickOpen && (
                <div className="border-t border-pool-gold/30 bg-pool-bg px-4 py-4 animate-fade-in">
                  <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3">WHO WON?</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[game.player1, game.player2].map(player => {
                      const style = PLAYER_STYLES[player.username as PlayerUsername]
                      const selected = quick?.winnerId === player.id
                      return (
                        <button
                          key={player.id}
                          onClick={() => setQuick(q => q ? { ...q, winnerId: player.id } : q)}
                          className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 font-heading text-base tracking-wide transition-all active:scale-95 ${
                            selected
                              ? 'border-pool-gold bg-pool-gold/15 text-pool-gold'
                              : 'border-pool-border text-pool-chalk-dim hover:border-pool-chalk/30'
                          }`}
                        >
                          {style && <PlayerBall number={style.number} color={style.color} size={28} />}
                          {player.display_name.toUpperCase()}
                        </button>
                      )
                    })}
                  </div>

                  {/* Black ball toggle */}
                  <button
                    onClick={() => setQuick(q => q ? { ...q, blackBall: !q.blackBall } : q)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border mb-3 text-sm font-body transition-all ${
                      quick?.blackBall
                        ? 'border-pool-red/50 bg-pool-red/10 text-pool-chalk'
                        : 'border-pool-border text-pool-chalk-dim'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${quick?.blackBall ? 'bg-pool-red border-pool-red' : 'border-pool-chalk-dim'}`}>
                      {quick?.blackBall && <span className="text-[10px] text-white">✓</span>}
                    </div>
                    <span>Loser potted the black ball</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setQuick(null)}
                      className="flex-1 py-2.5 rounded-xl border border-pool-border font-heading text-sm tracking-widest text-pool-chalk-dim hover:text-pool-chalk transition-all"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={submitQuickResult}
                      disabled={quickSaving}
                      className="flex-1 py-2.5 rounded-xl bg-pool-gold text-pool-bg font-heading text-sm tracking-widest hover:bg-pool-gold-light disabled:opacity-50 transition-all active:scale-95"
                    >
                      {quickSaving ? 'SAVING…' : 'CONFIRM'}
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {!game.is_complete && !isQuickOpen && (
                <div className="flex items-center justify-between px-4 py-2 border-t border-pool-border gap-2">
                  {schedule && (
                    <p className="text-xs font-body text-pool-chalk-dim">
                      {PLAYER_STYLES[schedule.scorer as PlayerUsername]?.label} scores
                    </p>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => openQuick(game)}
                      className="px-3 py-1.5 rounded-lg border border-pool-border font-heading text-xs tracking-wider text-pool-chalk-dim hover:text-pool-chalk hover:border-pool-chalk/30 transition-all active:scale-95"
                    >
                      ⚡ SET RESULT
                    </button>
                    <Link
                      href={`/session/${session.id}/game/${game.id}`}
                      className="px-3 py-1.5 rounded-lg bg-pool-gold text-pool-bg font-heading text-xs tracking-wider hover:bg-pool-gold-light transition-all active:scale-95"
                    >
                      {game.shots.length > 0 ? 'CONTINUE' : 'START'}
                    </Link>
                  </div>
                </div>
              )}

              {/* View completed game */}
              {game.is_complete && (
                <div className="flex justify-end px-4 py-2 border-t border-pool-border">
                  <Link
                    href={`/session/${session.id}/game/${game.id}`}
                    className="text-xs font-body text-pool-chalk-dim hover:text-pool-gold transition-colors"
                  >
                    View details →
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {completedGames.length === totalGames && totalGames > 0 && (
        <p className="text-center text-pool-gold font-heading text-xl tracking-wider mt-5">
          ALL GAMES COMPLETE 🎱
        </p>
      )}
    </div>
  )
}
