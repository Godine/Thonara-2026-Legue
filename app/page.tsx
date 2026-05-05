export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { fetchStandings, fetchRecentSession } from '@/lib/queries'
import { generateNarrative } from '@/lib/narrative'
import Link from 'next/link'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import PlayerAvatar from '@/components/PlayerAvatar'
import PullToRefresh from '@/components/PullToRefresh'
import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'

const RANK_BADGES = ['🥇', '🥈', '🥉']

function sessionDateLabel(dateStr: string) {
  const d = parseISO(dateStr + 'T12:00:00')
  if (isToday(d))      return 'Today'
  if (isYesterday(d))  return 'Yesterday'
  return format(d, 'EEE, MMM d')
}

export default async function Dashboard() {
  const db = createClient()
  const [standings, recent] = await Promise.all([
    fetchStandings(db),
    fetchRecentSession(db),
  ])

  const sorted = [...standings].sort((a, b) => b.wins - a.wins)
  const narrative = generateNarrative(sorted as any)
  const leaderWins = sorted[0]?.wins ?? 0

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <PullToRefresh />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="relative px-4 pt-10 pb-8 text-center overflow-hidden">
        {/* Felt glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #1a4731 0%, transparent 70%)' }} />
        {/* Rail diamond spots */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, #c9a227 1.5px, transparent 1.5px)', backgroundSize: '36px 36px' }} />

        <p className="font-body text-xs tracking-[0.35em] uppercase text-pool-chalk-dim relative">
          Season 2026
        </p>
        <h1 className="font-heading text-[4.5rem] leading-none tracking-widest text-pool-chalk relative mt-1">
          THONARA
        </h1>
        <h2 className="font-heading text-3xl tracking-[0.5em] gold-shimmer relative">
          LEAGUE
        </h2>

        {/* 8-ball divider */}
        <div className="relative my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-pool-gold/30" />
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="9" fill="#111" />
            <circle cx="9" cy="9" r="4.5" fill="white" />
            <text x="9" y="12.5" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#111">8</text>
          </svg>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-pool-gold/30" />
        </div>

        {/* Narrative */}
        <p className="font-body text-sm text-pool-chalk-dim italic relative leading-relaxed">
          &ldquo;{narrative}&rdquo;
        </p>
      </div>

      {/* ── THE TABLE ────────────────────────────────────────────────── */}
      <section className="px-4 pb-5">
        <p className="font-heading text-xs tracking-[0.25em] text-pool-chalk-dim mb-3">THE TABLE</p>
        {sorted.length === 0 ? (
          <div className="bg-pool-surface rounded-2xl border border-pool-border py-12 text-center">
            <p className="text-pool-chalk-dim font-body text-sm">No games yet — start the first session!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((player, i) => {
              const style    = PLAYER_STYLES[player.username as PlayerUsername]
              const winRate  = player.games_played > 0 ? Math.round((player.wins / player.games_played) * 100) : 0
              const gap      = leaderWins - player.wins
              const isLeader = i === 0

              return (
                <Link
                  key={player.id}
                  href={`/player/${player.username}`}
                  className="relative block bg-pool-surface rounded-2xl border p-4 transition-all active:scale-[0.99]"
                  style={{
                    borderColor: isLeader ? `${style.color}55` : '#1f3525',
                    boxShadow:   isLeader ? `0 0 24px ${style.color}12` : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-6 text-center select-none">{RANK_BADGES[i]}</span>
                    <div style={{ filter: `drop-shadow(0 0 8px ${style.color}44)` }}>
                      <PlayerAvatar username={player.username as PlayerUsername} size={50} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-heading text-lg tracking-wide leading-none" style={{ color: style.color }}>
                          {player.display_name.toUpperCase()}
                        </p>
                        {isLeader && (
                          <span
                            className="font-heading text-[9px] tracking-widest px-1.5 py-0.5 rounded-full border shrink-0"
                            style={{ color: style.color, background: `${style.color}12`, borderColor: `${style.color}33` }}
                          >
                            LEADER
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-pool-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${winRate}%`, backgroundColor: style.color }}
                          />
                        </div>
                        <span className="font-body text-xs text-pool-chalk-dim shrink-0 tabular-nums">{winRate}%</span>
                      </div>
                      <p className="font-body text-xs text-pool-chalk-dim mt-1">
                        {player.wins}W · {player.losses}L · {player.games_played} played
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-heading text-5xl leading-none" style={{ color: style.color }}>
                        {player.wins}
                      </p>
                      {gap > 0 ? (
                        <p className="font-heading text-xs text-pool-red mt-0.5">−{gap}</p>
                      ) : (
                        <p className="font-body text-xs text-pool-chalk-dim mt-0.5">wins</p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="px-4 pb-5 space-y-2.5">
        <Link
          href="/session/new"
          className="flex items-center justify-between w-full bg-pool-gold hover:bg-pool-gold-light text-pool-bg font-heading px-6 py-5 rounded-2xl transition-all active:scale-[0.98] glow-gold"
        >
          <span className="text-2xl tracking-widest">RACK EM UP</span>
          <span className="text-2xl">🎱</span>
        </Link>
        <div className="grid grid-cols-4 gap-2">
          {[
            { href: '/stats',        icon: '📊', label: 'STATS'   },
            { href: '/history',      icon: '📅', label: 'HISTORY' },
            { href: '/achievements', icon: '🏅', label: 'BADGES'  },
            { href: '/practice',     icon: '🎯', label: 'DRILLS'  },
          ].map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-3 rounded-xl border border-pool-border text-pool-chalk-dim hover:border-pool-chalk/30 hover:text-pool-chalk transition-all active:scale-[0.97]"
            >
              <span className="text-lg">{icon}</span>
              <span className="font-heading text-[10px] tracking-widest">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── LAST SESSION ─────────────────────────────────────────────── */}
      {recent && (
        <section className="px-4 pb-10">
          <div className="flex items-center justify-between mb-3">
            <p className="font-heading text-xs tracking-[0.25em] text-pool-chalk-dim">LAST SESSION</p>
            <span className="font-body text-xs text-pool-chalk-dim">{sessionDateLabel(recent.date)}</span>
          </div>

          <div className="bg-pool-surface rounded-2xl border border-pool-border overflow-hidden">
            <div className="divide-y divide-pool-border">
              {(recent.games as any[])
                ?.sort((a: any, b: any) => a.game_number - b.game_number)
                .map((game: any) => {
                  const p1Style = PLAYER_STYLES[game.player1?.username as PlayerUsername]
                  const p2Style = PLAYER_STYLES[game.player2?.username as PlayerUsername]
                  const p1Won   = game.winner_id === game.player1?.id
                  const p2Won   = game.winner_id === game.player2?.id

                  return (
                    <div key={game.id} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="font-heading text-xs text-pool-chalk-dim w-6 shrink-0">G{game.game_number}</span>

                      {/* Player 1 */}
                      <div className={`flex items-center gap-1.5 flex-1 justify-end transition-opacity ${!game.is_complete ? '' : p1Won ? 'opacity-100' : 'opacity-35'}`}>
                        <span className="font-heading text-sm" style={{ color: p1Won ? p1Style?.color : undefined }}>
                          {game.player1?.display_name}
                        </span>
                        {game.player1?.username && (
                          <PlayerAvatar username={game.player1.username as PlayerUsername} size={26} />
                        )}
                      </div>

                      {/* Score / status */}
                      <div className="shrink-0 text-center w-10">
                        {game.is_complete ? (
                          <span className="font-heading text-xs text-pool-gold">✓</span>
                        ) : (
                          <span className="font-body text-xs text-pool-chalk-dim">vs</span>
                        )}
                      </div>

                      {/* Player 2 */}
                      <div className={`flex items-center gap-1.5 flex-1 transition-opacity ${!game.is_complete ? '' : p2Won ? 'opacity-100' : 'opacity-35'}`}>
                        {game.player2?.username && (
                          <PlayerAvatar username={game.player2.username as PlayerUsername} size={26} />
                        )}
                        <span className="font-heading text-sm" style={{ color: p2Won ? p2Style?.color : undefined }}>
                          {game.player2?.display_name}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>

            <Link
              href={`/session/${recent.id}`}
              className="flex items-center justify-center gap-1 py-3 text-sm font-body text-pool-chalk-dim hover:text-pool-gold transition-colors border-t border-pool-border"
            >
              View full session →
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
