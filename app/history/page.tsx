export const revalidate = 60

import { createClient } from '@/lib/supabase/server'
import { fetchAllSessions } from '@/lib/queries'
import Link from 'next/link'
import PullToRefresh from '@/components/PullToRefresh'
import PlayerAvatar from '@/components/PlayerAvatar'
import { format } from 'date-fns'
import { PLAYER_STYLES, PLAYERS, type PlayerUsername } from '@/lib/game-config'
import { formatTime } from '@/lib/stats'
import type { Player, Shot } from '@/types/database'
import type { SessionFull } from '@/lib/queries/sessions'

function potPct(shots: Shot[], playerId: string): string {
  const mine = shots.filter(s => s.player_id === playerId)
  if (mine.length === 0) return '—'
  const potted = mine.reduce((n, s) => n + (s.balls_potted ?? (s.potted ? 1 : 0)), 0)
  return `${Math.round((potted / mine.length) * 100)}%`
}

interface SeasonStanding {
  player: Player
  wins: number
  losses: number
  played: number
}

function computeSeasonStandings(sessions: SessionFull[], allPlayers: Record<string, Player>): SeasonStanding[] {
  const wins: Record<string, number>   = {}
  const losses: Record<string, number> = {}
  const played: Record<string, number> = {}

  for (const s of sessions) {
    for (const g of s.games) {
      if (!g.is_complete) continue
      const ids = [g.player1_id, g.player2_id]
      for (const id of ids) {
        played[id] = (played[id] ?? 0) + 1
        if (g.winner_id === id) wins[id] = (wins[id] ?? 0) + 1
        else losses[id] = (losses[id] ?? 0) + 1
      }
    }
  }

  return PLAYERS
    .map(u => {
      const player = Object.values(allPlayers).find(p => p.username === u)
      if (!player) return null
      return {
        player,
        wins:   wins[player.id]   ?? 0,
        losses: losses[player.id] ?? 0,
        played: played[player.id] ?? 0,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b!.wins - a!.wins) as SeasonStanding[]
}

export default async function HistoryPage() {
  const sessions = await fetchAllSessions(createClient(), 200)

  const allPlayers: Record<string, Player> = {}
  for (const s of sessions) {
    for (const g of s.games) {
      if (g.player1) allPlayers[g.player1.id] = g.player1
      if (g.player2) allPlayers[g.player2.id] = g.player2
    }
  }

  // Group sessions by year
  const bySeason: Record<number, SessionFull[]> = {}
  for (const s of sessions) {
    const year = new Date(s.date + 'T12:00:00').getFullYear()
    ;(bySeason[year] ??= []).push(s)
  }
  const years = Object.keys(bySeason).map(Number).sort((a, b) => b - a)
  const currentYear = new Date().getFullYear()

  const RANK_BADGES = ['🥇', '🥈', '🥉']

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      <PullToRefresh />

      <div className="mb-6">
        <Link href="/" className="text-pool-chalk-dim text-sm font-body hover:text-pool-gold transition-colors">
          ← Home
        </Link>
        <div className="mt-3">
          <h1 className="font-heading text-4xl tracking-wider text-pool-chalk">HISTORY</h1>
          <div className="mt-2 h-px bg-gradient-to-r from-pool-gold/40 to-transparent" />
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎱</div>
          <p className="font-body text-pool-chalk-dim">No sessions yet. Start your first one!</p>
          <Link href="/session/new" className="inline-block mt-4 text-pool-gold font-heading text-lg tracking-wider hover:text-pool-gold-light transition-colors">
            START SESSION →
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {years.map(year => {
            const seasonSessions = bySeason[year]
            const standings = computeSeasonStandings(seasonSessions, allPlayers)
            const isCurrent = year === currentYear
            const totalGames = seasonSessions.reduce((n, s) => n + s.games.filter(g => g.is_complete).length, 0)
            const champion = standings[0]?.wins > 0 ? standings[0] : null

            return (
              <div key={year}>

                {/* ── Season header ──────────────────────────────────── */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="font-heading text-xl tracking-widest text-pool-gold">
                      SEASON {year}
                    </span>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 font-heading text-[9px] tracking-widest text-pool-green-bright border border-pool-green-bright/30 rounded-full px-2 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-pool-green-bright animate-pulse" />
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="flex-1 h-px bg-pool-border" />
                  <span className="font-body text-xs text-pool-chalk-dim shrink-0">
                    {seasonSessions.length} {seasonSessions.length === 1 ? 'session' : 'sessions'} · {totalGames} games
                  </span>
                </div>

                {/* ── Season standings card ───────────────────────────── */}
                {standings.some(s => s.played > 0) && (
                  <div className="bg-pool-surface border border-pool-border rounded-2xl overflow-hidden mb-4">
                    <div className="flex items-center justify-between px-4 pt-3 pb-2">
                      <p className="font-heading text-xs tracking-widest text-pool-chalk-dim">STANDINGS</p>
                      {!isCurrent && champion && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🏆</span>
                          <span className="font-heading text-xs tracking-wide" style={{ color: PLAYER_STYLES[champion.player.username as PlayerUsername]?.color }}>
                            {champion.player.display_name.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="divide-y divide-pool-border">
                      {standings.map((s, i) => {
                        const style = PLAYER_STYLES[s.player.username as PlayerUsername]
                        const winRate = s.played > 0 ? Math.round((s.wins / s.played) * 100) : 0
                        const isLeader = i === 0 && s.wins > 0
                        return (
                          <div key={s.player.id} className="flex items-center gap-3 px-4 py-2.5">
                            <span className="text-base w-5 text-center select-none shrink-0">
                              {s.wins > 0 ? RANK_BADGES[i] ?? `${i + 1}.` : '—'}
                            </span>
                            <PlayerAvatar username={s.player.username as PlayerUsername} size={32} />
                            <div className="flex-1 min-w-0">
                              <p className="font-heading text-sm tracking-wide leading-none" style={{ color: style?.color }}>
                                {s.player.display_name.toUpperCase()}
                              </p>
                              {s.played > 0 && (
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-20 h-1 bg-pool-border rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${winRate}%`, backgroundColor: style?.color }} />
                                  </div>
                                  <span className="font-body text-xs text-pool-chalk-dim tabular-nums">{winRate}%</span>
                                </div>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-heading text-2xl leading-none" style={{ color: isLeader ? style?.color : undefined }}>
                                {s.wins}
                              </span>
                              <span className="font-body text-xs text-pool-chalk-dim ml-1">W</span>
                              {s.losses > 0 && (
                                <span className="font-body text-xs text-pool-chalk-dim ml-1">· {s.losses}L</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ── Session cards ───────────────────────────────────── */}
                <div className="space-y-3">
                  {seasonSessions.map(session => {
                    const sortedGames = [...session.games].sort((a, b) => a.game_number - b.game_number)
                    const completedGames = sortedGames.filter(g => g.is_complete)
                    const sessionWins: Record<string, number> = {}
                    for (const g of completedGames) {
                      if (g.winner_id) sessionWins[g.winner_id] = (sessionWins[g.winner_id] ?? 0) + 1
                    }
                    const allShots = sortedGames.flatMap(g => g.shots)
                    const shotTimes = allShots.map(s => new Date(s.created_at).getTime()).filter(Boolean)
                    const sessionDuration = shotTimes.length >= 2
                      ? Math.floor((Math.max(...shotTimes) - Math.min(...shotTimes)) / 1000)
                      : null
                    const sessionPlayers = Object.values(allPlayers).filter(p =>
                      sortedGames.some(g => g.player1_id === p.id || g.player2_id === p.id)
                    )

                    return (
                      <div key={session.id} className="bg-pool-surface rounded-2xl border border-pool-border overflow-hidden">

                        {/* Session header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-pool-border">
                          <div>
                            <p className="font-heading text-base tracking-wider text-pool-chalk">
                              {format(new Date(session.date + 'T12:00:00'), 'EEE, MMM d').toUpperCase()}
                            </p>
                            <p className="text-xs font-body text-pool-chalk-dim mt-0.5">
                              {completedGames.length}/{sortedGames.length} games
                              {sessionDuration != null && sessionDuration >= 60 && (
                                <> · {formatTime(sessionDuration)}</>
                              )}
                            </p>
                          </div>
                          <Link
                            href={`/session/${session.id}`}
                            className="text-xs font-body text-pool-gold hover:text-pool-gold-light transition-colors"
                          >
                            View →
                          </Link>
                        </div>

                        {/* Win counts */}
                        <div className="grid grid-cols-3 gap-0 divide-x divide-pool-border border-b border-pool-border">
                          {sessionPlayers.map(player => {
                            const style = PLAYER_STYLES[player.username as PlayerUsername]
                            const w = sessionWins[player.id] ?? 0
                            return (
                              <div key={player.id} className="flex flex-col items-center py-2.5 gap-1">
                                <PlayerAvatar username={player.username as PlayerUsername} size={28} />
                                <span className="font-heading text-lg leading-none" style={{ color: w > 0 ? style?.color : undefined }}>
                                  {w}
                                </span>
                                <span className="font-body text-[10px] text-pool-chalk-dim">
                                  {potPct(allShots, player.id)}
                                </span>
                              </div>
                            )
                          })}
                        </div>

                        {/* Game result dots */}
                        {completedGames.length > 0 && (
                          <div className="px-4 py-2 flex gap-1.5 flex-wrap">
                            {sortedGames.map(game => {
                              const p1Style = PLAYER_STYLES[game.player1.username as PlayerUsername]
                              const p2Style = PLAYER_STYLES[game.player2.username as PlayerUsername]
                              return (
                                <div key={game.id} className="flex items-center gap-1 bg-pool-bg rounded-lg px-2 py-1 text-xs font-body">
                                  <span className="text-pool-chalk-dim">G{game.game_number}</span>
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: game.winner_id === game.player1_id ? p1Style?.color : p1Style?.dimColor }} />
                                  <span className="text-pool-chalk-dim">·</span>
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: game.winner_id === game.player2_id ? p2Style?.color : p2Style?.dimColor }} />
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
