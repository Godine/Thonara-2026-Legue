import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import PlayerBall from '@/components/PlayerBall'
import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import type { LeagueStanding, Session, Game, Player } from '@/types/database'

async function getStandings(): Promise<LeagueStanding[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('league_standings')
    .select('*')
  return (data as LeagueStanding[]) ?? []
}

async function getRecentSession() {
  const supabase = createClient()
  const { data } = await supabase
    .from('sessions')
    .select(`
      *,
      games (
        id, game_number, is_complete, winner_id,
        player1:players!games_player1_id_fkey ( id, display_name, username ),
        player2:players!games_player2_id_fkey ( id, display_name, username ),
        winner:players!games_winner_id_fkey  ( id, display_name, username )
      )
    `)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

const RANK_BADGES = ['🥇', '🥈', '🥉']

export default async function Dashboard() {
  const [standings, recent] = await Promise.all([getStandings(), getRecentSession()])

  const sorted = [...standings].sort((a, b) => b.wins - a.wins)

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 animate-fade-in">
      {/* Hero */}
      <div className="text-center py-4">
        <p className="font-body text-xs tracking-[0.25em] uppercase text-pool-chalk-dim mb-2">
          Season 2026
        </p>
        <h1 className="font-heading text-6xl tracking-widest leading-none text-pool-chalk">
          THONARA
        </h1>
        <h2 className="font-heading text-3xl tracking-[0.4em] gold-shimmer">
          LEAGUE
        </h2>
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-pool-gold/50 to-transparent" />
      </div>

      {/* League Standings */}
      <section>
        <h3 className="font-heading text-base tracking-widest text-pool-chalk-dim mb-3 px-1">
          STANDINGS
        </h3>
        <div className="bg-pool-surface rounded-2xl overflow-hidden border border-pool-border">
          {sorted.length === 0 ? (
            <p className="text-pool-chalk-dim text-sm font-body text-center py-8">
              No games played yet — start the first session!
            </p>
          ) : (
            <div className="divide-y divide-pool-border">
              {sorted.map((player, i) => {
                const style = PLAYER_STYLES[player.username as PlayerUsername]
                const winRate = player.games_played > 0
                  ? Math.round((player.wins / player.games_played) * 100)
                  : 0
                return (
                  <div key={player.id} className="flex items-center gap-3 px-4 py-4">
                    <span className="text-xl w-8 text-center select-none">
                      {RANK_BADGES[i] ?? <span className="text-pool-chalk-dim font-body text-sm">{i + 1}</span>}
                    </span>
                    {style && (
                      <PlayerBall number={style.number} color={style.color} size={44} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-xl tracking-wide text-pool-chalk">
                        {player.display_name.toUpperCase()}
                      </p>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-xs font-body text-pool-chalk-dim">
                          {player.games_played} played
                        </span>
                        <span className="text-xs font-body text-pool-chalk-dim">
                          {player.losses} losses
                        </span>
                        <span className="text-xs font-body text-pool-chalk-dim">
                          {winRate}% win rate
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-4xl text-pool-gold leading-none">{player.wins}</p>
                      <p className="text-xs font-body text-pool-chalk-dim mt-0.5">wins</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Start Session CTA */}
      <Link
        href="/session/new"
        className="flex items-center justify-center gap-3 w-full bg-pool-gold hover:bg-pool-gold-light text-pool-bg font-heading text-2xl tracking-widest py-5 rounded-2xl transition-all active:scale-[0.98] glow-gold"
      >
        <span>⬤</span>
        <span>START SESSION</span>
      </Link>

      {/* Last Session */}
      {recent && (
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-heading text-base tracking-widest text-pool-chalk-dim">LAST SESSION</h3>
            <span className="text-xs font-body text-pool-chalk-dim">
              {format(new Date(recent.date), 'EEE, MMM d')}
            </span>
          </div>
          <div className="bg-pool-surface rounded-2xl overflow-hidden border border-pool-border">
            <div className="divide-y divide-pool-border">
              {(recent.games as any[])
                ?.sort((a: any, b: any) => a.game_number - b.game_number)
                .map((game: any) => (
                  <div key={game.id} className="flex items-center px-4 py-3 gap-3">
                    <span className="text-pool-chalk-dim font-body text-xs w-12">
                      G{game.game_number}
                    </span>
                    <div className="flex-1 flex items-center gap-2">
                      <span className={`font-body text-sm flex-1 text-right ${
                        game.winner_id === game.player1?.id
                          ? 'text-pool-gold font-semibold'
                          : 'text-pool-chalk/60'
                      }`}>
                        {game.player1?.display_name}
                      </span>
                      <span className="text-pool-chalk-dim text-xs px-2">vs</span>
                      <span className={`font-body text-sm flex-1 ${
                        game.winner_id === game.player2?.id
                          ? 'text-pool-gold font-semibold'
                          : 'text-pool-chalk/60'
                      }`}>
                        {game.player2?.display_name}
                      </span>
                    </div>
                    {game.is_complete ? (
                      <span className="text-xs font-body text-pool-gold">✓</span>
                    ) : (
                      <span className="text-xs font-body text-pool-chalk-dim">–</span>
                    )}
                  </div>
                ))}
            </div>
            <Link
              href={`/session/${recent.id}`}
              className="flex items-center justify-center gap-1 py-3 text-sm font-body text-pool-chalk-dim hover:text-pool-gold transition-colors border-t border-pool-border"
            >
              View session →
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
