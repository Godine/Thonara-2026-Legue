'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

interface Standing {
  username: string
  display_name: string
  wins: number
  losses: number
  games_played: number
}

function generateNarrative(standings: Standing[]): string {
  if (!standings.length || standings.every(s => s.games_played === 0))
    return 'No games played yet this season — tonight everything starts.'
  const sorted = [...standings].sort((a, b) => b.wins - a.wins)
  const [first, second, third] = sorted
  const gap12 = first.wins - second.wins
  const gap23 = second.wins - third.wins
  if (gap12 === 0)
    return `${first.display_name} and ${second.display_name} are level at the top. Tonight could split them.`
  if (gap12 >= 4)
    return `${first.display_name} is pulling away with ${first.wins} wins. The others need a big night.`
  if (gap12 === 1 && gap23 === 0)
    return `${first.display_name} leads by one win. ${second.display_name} and ${third.display_name} are right behind.`
  if (gap12 === 1)
    return `${first.display_name} leads by a single win. One bad session and it's level again.`
  if (gap12 === 2)
    return `${first.display_name} is two wins clear. ${second.display_name} needs a perfect night to catch up.`
  return `${first.display_name} leads the table — but ${second.display_name} is right there.`
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
  const router = useRouter()
  const supabase = createClient()

  const [session, setSession] = useState<FullSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [quick, setQuick] = useState<QuickResult | null>(null)
  const [quickSaving, setQuickSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [standings, setStandings] = useState<Standing[]>([])
  const [showPreview, setShowPreview] = useState(true)

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
    supabase.from('league_standings').select('username, display_name, wins, losses, games_played')
      .then(({ data }) => { if (data) setStandings(data as Standing[]) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const deleteSession = async () => {
    setDeleting(true)
    const gameIds = session?.games.map(g => g.id) ?? []
    if (gameIds.length > 0) {
      await supabase.from('shots').delete().in('game_id', gameIds)
      await supabase.from('games').delete().eq('session_id', id)
    }
    await supabase.from('sessions').delete().eq('id', id)
    router.push('/')
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

  // Pre-session hype card — show when no games played yet
  const sortedStandings = [...standings].sort((a, b) => b.wins - a.wins)
  if (showPreview && completedGames.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in flex flex-col min-h-[80vh]">
        {/* Skip */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-pool-chalk-dim text-sm font-body hover:text-pool-gold transition-colors">← Home</Link>
          <button onClick={() => setShowPreview(false)}
            className="text-pool-chalk-dim text-xs font-body hover:text-pool-chalk transition-colors">
            skip →
          </button>
        </div>

        {/* Tonight heading */}
        <div className="text-center mb-8">
          <p className="font-body text-xs tracking-[0.3em] uppercase text-pool-chalk-dim mb-1">
            {format(new Date(session.date + 'T12:00:00'), 'EEEE, MMMM d')}
          </p>
          <h1 className="font-heading text-7xl tracking-widest leading-none text-pool-chalk">TONIGHT</h1>
          <div className="mt-3 h-px bg-gradient-to-r from-transparent via-pool-gold/50 to-transparent" />
        </div>

        {/* Standings */}
        {sortedStandings.length > 0 && (
          <div className="bg-pool-surface rounded-2xl border border-pool-border overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-pool-border">
              <p className="font-heading text-xs tracking-widest text-pool-chalk-dim">THE TABLE</p>
            </div>
            <div className="divide-y divide-pool-border">
              {sortedStandings.map((s, i) => {
                const style = PLAYER_STYLES[s.username as PlayerUsername]
                const badges = ['🥇', '🥈', '🥉']
                return (
                  <div key={s.username} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-lg w-7 text-center">{badges[i] ?? String(i + 1)}</span>
                    {style && <PlayerBall number={style.number} color={style.color} size={34} />}
                    <p className="font-heading text-xl tracking-wide flex-1" style={{ color: style?.color }}>
                      {s.display_name.toUpperCase()}
                    </p>
                    <div className="text-right">
                      <p className="font-heading text-3xl text-pool-gold leading-none">{s.wins}</p>
                      <p className="font-body text-xs text-pool-chalk-dim">{s.losses}L</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Narrative */}
        <div className="bg-pool-gold/10 border border-pool-gold/30 rounded-2xl px-5 py-4 mb-4 text-center">
          <p className="font-heading text-lg tracking-wide text-pool-chalk leading-snug">
            {generateNarrative(standings)}
          </p>
        </div>

        {/* Tonight's schedule */}
        <div className="bg-pool-surface rounded-2xl border border-pool-border overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-pool-border">
            <p className="font-heading text-xs tracking-widest text-pool-chalk-dim">TONIGHT'S GAMES</p>
          </div>
          <div className="divide-y divide-pool-border">
            {session.games.map(g => {
              const p1Style = PLAYER_STYLES[g.player1.username as PlayerUsername]
              const p2Style = PLAYER_STYLES[g.player2.username as PlayerUsername]
              const schedule = GAME_SCHEDULE.find(s => s.gameNumber === g.game_number)
              const scorerStyle = schedule ? PLAYER_STYLES[schedule.scorer as PlayerUsername] : null
              return (
                <div key={g.id} className="flex items-center gap-2 px-4 py-2.5">
                  <span className="font-body text-xs text-pool-chalk-dim w-5">{g.game_number}</span>
                  <div className="flex items-center gap-1.5 flex-1">
                    {p1Style && <PlayerBall number={p1Style.number} color={p1Style.color} size={20} />}
                    <span className="font-heading text-sm tracking-wide" style={{ color: p1Style?.color }}>
                      {g.player1.display_name.toUpperCase()}
                    </span>
                  </div>
                  <span className="font-body text-xs text-pool-chalk-dim">vs</span>
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <span className="font-heading text-sm tracking-wide" style={{ color: p2Style?.color }}>
                      {g.player2.display_name.toUpperCase()}
                    </span>
                    {p2Style && <PlayerBall number={p2Style.number} color={p2Style.color} size={20} />}
                  </div>
                  {scorerStyle && (
                    <span className="font-body text-xs text-pool-chalk-dim w-14 text-right shrink-0">
                      {scorerStyle.label} scores
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => setShowPreview(false)}
          className="w-full bg-pool-gold hover:bg-pool-gold-light text-pool-bg font-heading text-2xl tracking-widest py-5 rounded-2xl transition-all active:scale-[0.98] glow-gold mt-auto"
        >
          ▶ LET'S PLAY
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-pool-chalk-dim text-sm font-body hover:text-pool-gold transition-colors">← Home</Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs font-body text-pool-chalk-dim hover:text-pool-red transition-colors px-2 py-1"
          >
            🗑️ Delete
          </button>
        </div>
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

      {completedGames.length === totalGames && totalGames > 0 && (() => {
        // Aggregate shot stats across all games for each player
        const allShots = completedGames.flatMap(g => g.shots)
        const sessionStats = uniquePlayers.map(player => {
          if (!player) return null
          const st = computeStats(allShots, player.id)
          const acc = st.shots > 0 ? Math.round((st.potted / st.shots) * 100) : 0
          return { player, wins: sessionWins[player.id] ?? 0, acc, potted: st.potted, shots: st.shots }
        }).filter(Boolean) as { player: Player; wins: number; acc: number; potted: number; shots: number }[]

        // MVP = most wins; tie-break by accuracy
        const sorted = [...sessionStats].sort((a, b) => b.wins - a.wins || b.acc - a.acc)
        const mvp = sorted[0]
        const spoon = sorted[sorted.length - 1]
        const mvpStyle = PLAYER_STYLES[mvp.player.username as PlayerUsername]
        const spoonStyle = PLAYER_STYLES[spoon.player.username as PlayerUsername]

        return (
          <div className="mt-5 space-y-3">
            <p className="text-center text-pool-gold font-heading text-xl tracking-wider">ALL GAMES COMPLETE 🎱</p>

            {/* MVP */}
            <div
              className="rounded-2xl border-2 p-4 flex items-center gap-4"
              style={{ borderColor: mvpStyle?.color, background: `${mvpStyle?.color}11` }}
            >
              <div className="text-4xl">🏆</div>
              <div className="flex-1">
                <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-0.5">Session MVP</p>
                <p className="font-heading text-2xl tracking-wide" style={{ color: mvpStyle?.color }}>
                  {mvp.player.display_name.toUpperCase()}
                </p>
                <p className="font-body text-xs text-pool-chalk-dim mt-0.5">
                  {mvp.wins} wins · {mvp.potted} pots · {mvp.acc}% acc
                </p>
              </div>
              {mvpStyle && <PlayerBall number={mvpStyle.number} color={mvpStyle.color} size={44} />}
            </div>

            {/* Wooden spoon */}
            {spoon.player.id !== mvp.player.id && (
              <div className="rounded-2xl border border-pool-border p-4 flex items-center gap-4 opacity-75">
                <div className="text-4xl">🥄</div>
                <div className="flex-1">
                  <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-0.5">Wooden Spoon</p>
                  <p className="font-heading text-xl tracking-wide text-pool-chalk-dim">
                    {spoon.player.display_name.toUpperCase()}
                  </p>
                  <p className="font-body text-xs text-pool-chalk-dim mt-0.5">
                    {spoon.wins} wins · {spoon.potted} pots · {spoon.acc}% acc
                  </p>
                </div>
                {spoonStyle && <PlayerBall number={spoonStyle.number} color={spoonStyle.color} size={36} />}
              </div>
            )}
          </div>
        )
      })()}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 animate-fade-in"
          onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full max-w-lg bg-pool-surface rounded-t-3xl border-t border-pool-border p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">🗑️</div>
              <h2 className="font-heading text-2xl tracking-wider text-pool-chalk mb-1">DELETE SESSION</h2>
              <p className="font-body text-sm text-pool-chalk-dim">
                {format(new Date(session.date + 'T12:00:00'), 'MMMM d, yyyy')} · {totalGames} games · {session.games.flatMap(g => g.shots).length} shots
              </p>
              <p className="font-body text-xs text-pool-red mt-2">This cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-4 rounded-xl border border-pool-border font-heading text-lg tracking-widest text-pool-chalk-dim hover:text-pool-chalk transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={deleteSession}
                disabled={deleting}
                className="flex-1 py-4 rounded-xl bg-pool-red border border-pool-red font-heading text-lg tracking-widest text-white hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                {deleting ? 'DELETING…' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
