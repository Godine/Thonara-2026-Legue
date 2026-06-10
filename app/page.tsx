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
import PlayerAvatar from '@/components/PlayerAvatar'
import PullToRefresh from '@/components/PullToRefresh'
import FlipBadgeCard from '@/components/FlipBadgeCard'
import { PLAYERS, PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'

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
    </>
  )
}

async function FireStreaksStream() {
  const db = createClient()
  const games = await fetchCompletedGames(db)

  // Sort chronologically — all games in a session share the same created_at,
  // so ordering by game_number within a session keeps streaks accurate.
  const sorted = [...games].sort((a, b) => {
    const da = a.session?.date ?? '', dbDate = b.session?.date ?? ''
    return da !== dbDate ? da.localeCompare(dbDate) : a.game_number - b.game_number
  })

  const playerIdMap: Partial<Record<PlayerUsername, string>> = {}
  for (const g of sorted) {
    playerIdMap[g.player1.username as PlayerUsername] = g.player1_id
    playerIdMap[g.player2.username as PlayerUsername] = g.player2_id
  }

  const players = PLAYERS.map(username => {
    const style = PLAYER_STYLES[username]
    const pid = playerIdMap[username]
    const results = pid
      ? sorted.filter(g => g.player1_id === pid || g.player2_id === pid).map(g => g.winner_id === pid)
      : []

    let current = 0
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i]) current++
      else break
    }
    let best = 0, cur = 0
    for (const r of results) {
      if (r) { cur++; best = Math.max(best, cur) } else cur = 0
    }

    return { username, style, current, best, last10: results.slice(-10) }
  })

  return (
    <section className="px-4 pb-5">
      <p className="font-heading text-xs tracking-[0.25em] text-pool-chalk-dim mb-3">WIN STREAKS</p>
      <div className="space-y-2">
        {players.map(p => <FireStreakCard key={p.username} {...p} />)}
      </div>
    </section>
  )
}

function FireStreakCard({ username, style, current, best, last10 }: {
  username: PlayerUsername
  style: typeof PLAYER_STYLES[PlayerUsername]
  current: number
  best: number
  last10: boolean[]
}) {
  const lit = current > 0
  const message =
    current === 0 ? 'Time to start a new streak' :
    current === 1 ? 'Just getting started' :
    current < 4   ? 'Building momentum' :
    current < 7   ? 'On fire!' : 'Unstoppable!'

  const padding = 10 - last10.length

  return (
    <div
      className="bg-pool-surface rounded-2xl border p-4"
      style={{
        borderColor: lit ? `${style.color}40` : '#1f3525',
        boxShadow: lit ? `0 0 24px ${style.color}12` : undefined,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: lit ? `radial-gradient(circle, ${style.color}33 0%, ${style.color}08 70%)` : '#0e1e12',
            border: `1.5px solid ${lit ? style.color + '55' : '#1f3525'}`,
          }}
        >
          <span
            className="text-2xl"
            style={{ filter: lit ? `drop-shadow(0 0 6px ${style.color}99)` : 'grayscale(1) opacity(0.35)' }}
          >
            🔥
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <PlayerAvatar username={username} size={20} />
            <span className="font-heading text-xs tracking-widest" style={{ color: style.color }}>
              {style.label.toUpperCase()}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-heading text-3xl text-pool-chalk leading-none">{current}</span>
            <span className="font-body text-xs text-pool-chalk-dim">{current === 1 ? 'win' : 'wins'} in a row</span>
          </div>
          <p className="font-body text-xs text-pool-chalk-dim mt-0.5">
            {message}{best > 1 ? ` · best ${best}` : ''}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-body text-[10px] tracking-widest uppercase text-pool-chalk-dim">Last 10 games</span>
          <span className="font-body text-[10px] tracking-widest uppercase text-pool-chalk-dim">Latest →</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => {
            const result = i < padding ? null : last10[i - padding]
            return (
              <div
                key={i}
                className="flex-1 h-2.5 rounded-full"
                style={{
                  background:
                    result === true  ? `linear-gradient(90deg, ${style.color}99, ${style.color})` :
                    result === false ? '#1f3525' : '#13201a',
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
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

function FireStreaksSkeleton() {
  return (
    <section className="px-4 pb-5">
      <p className="font-heading text-xs tracking-[0.25em] text-pool-chalk-dim mb-3">WIN STREAKS</p>
      <div className="space-y-2 animate-pulse">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-pool-surface rounded-2xl border border-pool-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-pool-border shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-pool-border rounded w-16" />
                <div className="h-7 bg-pool-border rounded w-24" />
                <div className="h-2.5 bg-pool-border rounded w-32" />
              </div>
            </div>
            <div className="flex gap-1 mt-3">
              {[0,1,2,3,4,5,6,7,8,9].map(j => (
                <div key={j} className="flex-1 h-2.5 bg-pool-border rounded-full" />
              ))}
            </div>
          </div>
        ))}
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

      {/* ── WIN STREAKS / FIRE TRACKER (streams in) ──────────────────── */}
      <Suspense fallback={<FireStreaksSkeleton />}>
        <FireStreaksStream />
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
