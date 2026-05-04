import { createClient } from '@/lib/supabase/server'
import { fetchAllSessions } from '@/lib/queries'
import Link from 'next/link'
import { format } from 'date-fns'
import PlayerBall from '@/components/PlayerBall'
import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import type { Player, Shot } from '@/types/database'

function bankPct(shots: Shot[], playerId: string): string {
  const mine = shots.filter(s => s.player_id === playerId)
  if (mine.length === 0) return '—'
  return `${Math.round((mine.filter(s => s.potted).length / mine.length) * 100)}%`
}

function errorPct(shots: Shot[], playerId: string): string {
  const mine = shots.filter(s => s.player_id === playerId)
  if (mine.length === 0) return '—'
  return `${Math.round((mine.filter(s => s.is_error).length / mine.length) * 100)}%`
}

export default async function HistoryPage() {
  const sessions = await fetchAllSessions(createClient())

  const allPlayers: Record<string, Player> = {}
  for (const s of sessions) {
    for (const g of s.games) {
      if (g.player1) allPlayers[g.player1.id] = g.player1
      if (g.player2) allPlayers[g.player2.id] = g.player2
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      <div className="mb-5">
        <Link href="/" className="text-pool-chalk-dim text-sm font-body hover:text-pool-gold transition-colors">
          ← Home
        </Link>
        <div className="mt-3">
          <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-1">Season 2026</p>
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
        <div className="space-y-5">
          {sessions.map(session => {
            const sortedGames = [...session.games].sort((a, b) => a.game_number - b.game_number)
            const completedGames = sortedGames.filter(g => g.is_complete)

            const wins: Record<string, number> = {}
            for (const g of completedGames) {
              if (g.winner_id) wins[g.winner_id] = (wins[g.winner_id] ?? 0) + 1
            }

            const allShots = sortedGames.flatMap(g => g.shots)

            const sessionPlayers = Object.values(allPlayers).filter(p =>
              sortedGames.some(g => g.player1_id === p.id || g.player2_id === p.id)
            )

            return (
              <div key={session.id} className="bg-pool-surface rounded-2xl border border-pool-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-pool-border">
                  <div>
                    <p className="font-heading text-lg tracking-wider text-pool-chalk">
                      {format(new Date(session.date + 'T12:00:00'), 'EEEE, MMMM d').toUpperCase()}
                    </p>
                    <p className="text-xs font-body text-pool-chalk-dim mt-0.5">
                      {completedGames.length}/{sortedGames.length} games completed
                    </p>
                  </div>
                  <Link
                    href={`/session/${session.id}`}
                    className="text-xs font-body text-pool-gold hover:text-pool-gold-light transition-colors"
                  >
                    View →
                  </Link>
                </div>

                <div className="px-4 py-3">
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {['Player', 'W', 'Bank%'].map(h => (
                      <p key={h} className="text-xs font-body tracking-widest text-pool-chalk-dim text-center first:text-left">
                        {h}
                      </p>
                    ))}
                  </div>
                  {sessionPlayers.map(player => {
                    const style = PLAYER_STYLES[player.username as PlayerUsername]
                    const w = wins[player.id] ?? 0
                    return (
                      <div key={player.id} className="grid grid-cols-3 gap-2 py-1.5 border-t border-pool-border/50">
                        <div className="flex items-center gap-2">
                          {style && <PlayerBall number={style.number} color={style.color} size={22} />}
                          <span className="font-body text-sm text-pool-chalk">{player.display_name}</span>
                        </div>
                        <p className={`font-heading text-xl text-center ${w > 0 ? 'text-pool-gold' : 'text-pool-chalk-dim'}`}>
                          {w}
                        </p>
                        <p className="font-body text-sm text-pool-chalk-dim text-center">
                          {bankPct(allShots, player.id)}
                        </p>
                      </div>
                    )
                  })}
                </div>

                {completedGames.length > 0 && (
                  <div className="border-t border-pool-border px-4 py-2">
                    <div className="flex gap-2 flex-wrap">
                      {sortedGames.map(game => {
                        const p1Style = PLAYER_STYLES[game.player1.username as PlayerUsername]
                        const p2Style = PLAYER_STYLES[game.player2.username as PlayerUsername]
                        return (
                          <div
                            key={game.id}
                            className="flex items-center gap-1 bg-pool-bg rounded-lg px-2 py-1 text-xs font-body"
                          >
                            <span className="text-pool-chalk-dim">G{game.game_number}</span>
                            {p1Style && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: game.winner_id === game.player1_id ? p1Style.color : p1Style.dimColor }} />}
                            <span className="text-pool-chalk-dim">·</span>
                            {p2Style && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: game.winner_id === game.player2_id ? p2Style.color : p2Style.dimColor }} />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {allShots.length > 0 && (
                  <div className="border-t border-pool-border px-4 py-2">
                    <p className="text-xs font-body tracking-widest text-pool-chalk-dim mb-2">ACCURACY</p>
                    <div className="grid grid-cols-3 gap-2">
                      {sessionPlayers.map(player => {
                        const style = PLAYER_STYLES[player.username as PlayerUsername]
                        return (
                          <div key={player.id} className="text-center">
                            {style && (
                              <div className="flex justify-center mb-1">
                                <PlayerBall number={style.number} color={style.color} size={20} />
                              </div>
                            )}
                            <p className="text-xs font-body text-pool-chalk">{bankPct(allShots, player.id)}</p>
                            <p className="text-xs font-body text-pool-red">{errorPct(allShots, player.id)} err</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
