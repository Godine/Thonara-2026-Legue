export const revalidate = 30

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { fetchStandings, fetchLiveGame, fetchCompletedGames, fetchAllShots } from '@/lib/queries'
import { generateNarrative } from '@/lib/narrative'
import {
  ACHIEVEMENTS,
  computeAllAchievements, computeAllProgress,
} from '@/lib/achievements'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import PlayerAvatar from '@/components/PlayerAvatar'
import PullToRefresh from '@/components/PullToRefresh'
import FlipBadgeCard from '@/components/FlipBadgeCard'
import SeasonCountdown from '@/components/SeasonCountdown'
import EloRatingChart from '@/components/EloRatingChart'
import { PLAYERS, PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import { buildFirstShotMap, sortGamesByPlayOrder } from '@/lib/stats'

const RANK_BADGES = ['🥇', '🥈', '🥉']

// ── Streaming data components ─────────────────────────────────────────

async function LiveBannerStream() {
  const db = createClient()
  const liveGame = await fetchLiveGame(db)
  if (!liveGame) return null
  return (
    <section className="px-4 -mt-1 mb-1">
      <Link
        href={`/session/${liveGame.sessionId}/game/${liveGame.gameId}`}
        className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all active:scale-[0.98]"
        style={{
          borderColor: '#22c55e40',
          background: 'linear-gradient(135deg, #22c55e12 0%, #22c55e06 100%)',
        }}
      >
        <div className="shrink-0 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pool-green-bright animate-pulse" />
            <span className="font-heading text-[10px] tracking-widest text-pool-green-bright">LIVE</span>
          </div>
          <span className="font-heading text-xs text-pool-chalk-dim">G{liveGame.gameNumber}</span>
        </div>

        <div className="w-px h-8 bg-pool-border shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="font-heading text-sm tracking-wide text-pool-chalk leading-snug">
            <span style={{ color: PLAYER_STYLES[liveGame.player1.username as PlayerUsername]?.color }}>
              {liveGame.player1.display_name}
            </span>
            <span className="text-pool-chalk-dim"> vs </span>
            <span style={{ color: PLAYER_STYLES[liveGame.player2.username as PlayerUsername]?.color }}>
              {liveGame.player2.display_name}
            </span>
          </p>
          <p className="font-body text-xs text-pool-chalk-dim mt-0.5">
            {liveGame.shotCount > 0
              ? `${liveGame.shotCount} shots in · tap to watch or score`
              : 'Up next — tap to join'}
          </p>
        </div>

        <span className="font-heading text-pool-green-bright shrink-0">→</span>
      </Link>
    </section>
  )
}

async function StandingsStream() {
  const db = createClient()
  const standings = await fetchStandings(db)
  const sorted = [...standings].sort((a, b) => b.wins - a.wins)
  const narrative = generateNarrative(sorted as any)
  const leaderWins = sorted[0]?.wins ?? 0

  return (
    <>
      <p className="font-body text-sm text-pool-chalk-dim italic relative leading-relaxed px-4 pb-6 text-center">
        &ldquo;{narrative}&rdquo;
      </p>

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
                    borderColor: isLeader ? `${style.color}55` : 'rgb(var(--pool-border))',
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
    </>
  )
}

async function SeasonCountdownStream() {
  const db = createClient()
  const [standings, games] = await Promise.all([fetchStandings(db), fetchCompletedGames(db)])
  const sorted = [...standings].sort((a, b) => b.wins - a.wins)
  const leader = sorted[0]
  const champion = leader
    ? { username: leader.username as PlayerUsername, displayName: leader.display_name, wins: leader.wins }
    : null

  return (
    <section className="px-4 pb-5">
      <SeasonCountdown played={games.length} champion={champion} />
    </section>
  )
}

async function EloChartStream() {
  const db = createClient()
  const [games, shots] = await Promise.all([fetchCompletedGames(db), fetchAllShots(db)])

  const sorted = sortGamesByPlayOrder(games, buildFirstShotMap(shots))

  // Build id → username and session order
  const idToUsername: Record<string, PlayerUsername> = {}
  const seenSessions = new Set<string>()
  const sessionOrder: string[] = []
  for (const g of sorted) {
    idToUsername[g.player1_id] = g.player1.username as PlayerUsername
    idToUsername[g.player2_id] = g.player2.username as PlayerUsername
    if (!seenSessions.has(g.session_id)) {
      seenSessions.add(g.session_id)
      sessionOrder.push(g.session_id)
    }
  }

  // Compute ELO per session — K=32, all players start at 1200
  const runElo: Record<PlayerUsername, number> = { adib: 1200, ahmed: 1200, godine: 1200 }

  const eloAtSession: { label: string; adib: number; ahmed: number; godine: number }[] = []

  for (const sid of sessionOrder) {
    for (const g of sorted.filter(g2 => g2.session_id === sid && !!g2.winner_id)) {
      const wu = idToUsername[g.winner_id!] as PlayerUsername | undefined
      const lu = (g.player1.username === wu ? g.player2.username : g.player1.username) as PlayerUsername
      if (!wu || runElo[wu] == null || runElo[lu] == null) continue
      const delta = Math.round(32 * (1 - 1 / (1 + Math.pow(10, (runElo[lu] - runElo[wu]) / 400))))
      runElo[wu] += delta
      runElo[lu] -= delta
    }
    const sess = sorted.find(g => g.session_id === sid)?.session
    eloAtSession.push({
      label: sess?.date ? format(parseISO(sess.date), 'd MMM') : sid.slice(0, 4),
      adib: runElo.adib, ahmed: runElo.ahmed, godine: runElo.godine,
    })
  }

  return (
    <section className="px-4 pb-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-heading text-xs tracking-[0.25em] text-pool-chalk-dim">ELO RATINGS</p>
        <p className="font-body text-[10px] text-pool-chalk-dim">K=32 · starts 1200</p>
      </div>
      <EloRatingChart eloAtSession={eloAtSession} eloRatings={{ ...runElo } as Record<PlayerUsername, number>} />
    </section>
  )
}

async function NearBadgesStream() {
  const db = createClient()
  const [games, shots] = await Promise.all([
    fetchCompletedGames(db),
    fetchAllShots(db),
  ])

  const earnedMap  = computeAllAchievements(games as any, shots as any)
  const progressMap = computeAllProgress(games as any, shots as any)

  const playerData = PLAYERS.map(username => {
    const style   = PLAYER_STYLES[username as PlayerUsername]
    const earned  = new Set(earnedMap[username] ?? [])
    const prog    = progressMap[username] ?? {}

    const candidates = ACHIEVEMENTS
      .filter(a => !earned.has(a.id) && prog[a.id] !== undefined)
      .map(a => ({
        achievement: a,
        pct:     (prog[a.id].current / prog[a.id].target) * 100,
        current: prog[a.id].current,
        target:  prog[a.id].target,
        label:   prog[a.id].label,
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 2)

    return { username: username as PlayerUsername, style, candidates }
  })

  return (
    <section className="px-4 pb-10">
      <div className="flex items-center justify-between mb-3">
        <p className="font-heading text-xs tracking-[0.25em] text-pool-chalk-dim">CLOSE TO EARNING</p>
        <Link href="/achievements" className="font-body text-xs text-pool-gold hover:text-pool-gold-light transition-colors">
          All badges →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {playerData.map(({ username, style, candidates }) => (
          <div key={username} className="flex flex-col gap-2">

            {/* Player label */}
            <div className="flex items-center gap-1.5 px-0.5">
              <PlayerAvatar username={username} size={20} />
              <span className="font-body text-xs truncate" style={{ color: style?.color }}>
                {style?.label}
              </span>
            </div>

            {/* Badge cards */}
            {candidates.length === 0 ? (
              <div className="rounded-xl border border-pool-border p-3 flex flex-col items-center justify-center gap-1 min-h-[72px]">
                <span className="text-base">🏅</span>
                <p className="font-body text-[9px] text-pool-chalk-dim text-center leading-snug">All earned!</p>
              </div>
            ) : candidates.map(({ achievement, pct, current, target, label }) => (
              <FlipBadgeCard
                key={achievement.id}
                icon={achievement.icon}
                name={achievement.name}
                description={achievement.description}
                rarity={achievement.rarity}
                barPct={Math.min(100, Math.round(pct))}
                label={label}
                current={current}
                target={target}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Skeleton fallbacks ────────────────────────────────────────────────

function StandingsSkeleton() {
  return (
    <>
      <p className="font-body text-sm text-pool-chalk-dim/20 italic px-4 pb-6 text-center">
        &ldquo;&hellip;&rdquo;
      </p>
      <section className="px-4 pb-5">
        <p className="font-heading text-xs tracking-[0.25em] text-pool-chalk-dim mb-3">THE TABLE</p>
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-pool-surface rounded-2xl border border-pool-border p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-pool-border" />
                <div className="w-12 h-12 rounded-full bg-pool-border" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-pool-border rounded w-24" />
                  <div className="h-1.5 bg-pool-border rounded w-full" />
                  <div className="h-3 bg-pool-border rounded w-32" />
                </div>
                <div className="w-10 h-12 bg-pool-border rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function SeasonCountdownSkeleton() {
  return (
    <section className="px-4 pb-5">
      <div className="rounded-2xl border border-pool-border bg-pool-surface p-4 animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <div className="h-3 bg-pool-border rounded w-24" />
          <div className="h-3 bg-pool-border rounded w-14" />
        </div>
        <div className="h-2.5 rounded-full bg-pool-border" />
        <div className="h-2.5 bg-pool-border rounded w-2/3 mx-auto mt-2.5" />
      </div>
    </section>
  )
}

function EloChartSkeleton() {
  return (
    <section className="px-4 pb-5">
      <p className="font-heading text-xs tracking-[0.25em] text-pool-chalk-dim mb-3">ELO RATINGS</p>
      <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 animate-pulse">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-pool-border" />
              <div className="h-6 bg-pool-border rounded w-14" />
              <div className="h-3 bg-pool-border rounded w-8" />
            </div>
          ))}
        </div>
        <div className="h-32 bg-pool-border rounded-xl" />
      </div>
    </section>
  )
}

function NearBadgesSkeleton() {
  return (
    <section className="px-4 pb-10">
      <div className="flex items-center justify-between mb-3">
        <p className="font-heading text-xs tracking-[0.25em] text-pool-chalk-dim">CLOSE TO EARNING</p>
      </div>
      <div className="grid grid-cols-3 gap-2 animate-pulse">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-4 bg-pool-border rounded w-full" />
            {[0, 1].map(j => (
              <div key={j} className="rounded-xl border border-pool-border p-2.5 space-y-1.5">
                <div className="h-5 w-5 bg-pool-border rounded" />
                <div className="h-2.5 bg-pool-border rounded w-3/4" />
                <div className="h-1 bg-pool-border rounded w-full" />
                <div className="h-2 bg-pool-border rounded w-1/2" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Main page shell (renders immediately — no data needed) ────────────

export default function Dashboard() {
  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <PullToRefresh />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="relative px-4 pt-10 pb-2 text-center overflow-hidden">
        {/* Felt glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #1a4731 0%, transparent 70%)' }} />
        {/* Rail diamond spots */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, #c9a227 1.5px, transparent 1.5px)', backgroundSize: '36px 36px' }} />

        <p className="font-body text-xs tracking-[0.35em] uppercase text-pool-chalk-dim relative">
          Season {new Date().getFullYear()}
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

        {/* ── RACK EM UP ── */}
        <div className="relative px-0 pb-2">
          <Link
            href="/session/new"
            className="relative block overflow-hidden rounded-3xl transition-all duration-150 active:scale-[0.97]"
            style={{ boxShadow: '0 0 48px #c9a22728, 0 0 120px #c9a22710' }}
          >
            {/* Felt backing */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(155deg, #1f5c38 0%, #0e2a1a 55%, #0d1f10 100%)' }} />
            {/* Subtle dot weave */}
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #f0ede6 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
            {/* Gold diagonal shimmer */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(110deg, transparent 25%, #c9a2270a 50%, transparent 75%)' }} />
            {/* Inner border glow */}
            <div className="absolute inset-0 rounded-3xl" style={{ boxShadow: 'inset 0 0 0 1.5px #c9a22745' }} />

            <div className="relative flex items-center justify-between px-7 py-6">
              <div className="text-left">
                <p className="font-body text-[10px] tracking-[0.4em] uppercase mb-2 leading-none" style={{ color: '#c9a22780' }}>
                  New Session
                </p>
                <p
                  className="font-heading text-[2.6rem] leading-none tracking-wider"
                  style={{ color: '#e8c547', textShadow: '0 0 28px #c9a22780, 0 2px 0 #7a6000' }}
                >
                  RACK&nbsp;'EM UP
                </p>
                <p className="font-body text-[11px] mt-2 leading-none" style={{ color: '#f0ede640' }}>
                  3 players · let&apos;s play
                </p>
              </div>
              <div
                className="shrink-0 text-[3.2rem] leading-none ml-4"
                style={{ filter: 'drop-shadow(0 0 14px #c9a22790) drop-shadow(0 0 3px #000)' }}
              >
                🎱
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ── LIVE GAME BANNER (streams in) ────────────────────────────── */}
      <Suspense fallback={null}>
        <LiveBannerStream />
      </Suspense>

      {/* ── NARRATIVE + STANDINGS (streams in) ───────────────────────── */}
      <Suspense fallback={<StandingsSkeleton />}>
        <StandingsStream />
      </Suspense>

      {/* ── SEASON COUNTDOWN (streams in) ────────────────────────────── */}
      <Suspense fallback={<SeasonCountdownSkeleton />}>
        <SeasonCountdownStream />
      </Suspense>

      {/* ── ELO RATINGS (streams in) ─────────────────────────────────── */}
      <Suspense fallback={<EloChartSkeleton />}>
        <EloChartStream />
      </Suspense>

      {/* ── NAV GRID ─────────────────────────────────────────────────── */}
      <section className="px-4 pb-5">
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

      {/* ── CLOSE TO EARNING (streams in) ────────────────────────────── */}
      <Suspense fallback={<NearBadgesSkeleton />}>
        <NearBadgesStream />
      </Suspense>
    </div>
  )
}
