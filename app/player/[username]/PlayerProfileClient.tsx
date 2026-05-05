'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { PLAYER_STYLES, PLAYERS, type PlayerUsername } from '@/lib/game-config'
import PlayerAvatar from '@/components/PlayerAvatar'
import PullToRefresh from '@/components/PullToRefresh'
import { pct, longestStreak } from '@/lib/stats'
import { ACHIEVEMENTS, RARITY_STYLES, RARITY_ORDER, computePlayerAchievements } from '@/lib/achievements'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface RawGame {
  id: string
  game_number: number
  session_id: string
  player1_id: string
  player2_id: string
  winner_id: string | null
  loser_potted_black: boolean
  player1: { id: string; username: string; display_name: string }
  player2: { id: string; username: string; display_name: string }
  winner: { id: string; username: string; display_name: string } | null
  session: { id: string; date: string }
}

interface RawShot {
  id: string
  game_id: string
  player_id: string
  potted: boolean
  is_lucky: boolean
  is_error: boolean
  shot_number: number
  created_at: string
}

interface Props {
  username: PlayerUsername
  games: RawGame[]
  shots: RawShot[]
}

const RANK_BADGES = ['🥇', '🥈', '🥉']

export default function PlayerProfileClient({ username, games: _games, shots }: Props) {
  const style = PLAYER_STYLES[username]
  const [flippedBadge, setFlippedBadge] = useState<string | null>(null)

  // Sort chronologically
  const games = [..._games].sort((a, b) => {
    const da = a.session?.date ?? ''
    const db = b.session?.date ?? ''
    return da !== db ? da.localeCompare(db) : a.game_number - b.game_number
  })

  // ID maps
  const usernameToId: Partial<Record<PlayerUsername, string>> = {}
  for (const g of games) {
    usernameToId[g.player1.username as PlayerUsername] = g.player1_id
    usernameToId[g.player2.username as PlayerUsername] = g.player2_id
  }
  const playerId = usernameToId[username] ?? ''

  // My games
  const myGames = games.filter(g => g.player1_id === playerId || g.player2_id === playerId)
  const wins     = myGames.filter(g => g.winner_id === playerId).length
  const losses   = myGames.filter(g => g.winner_id && g.winner_id !== playerId).length
  const winRate  = pct(wins, myGames.length)

  // Shot stats
  const myShots  = shots.filter(s => s.player_id === playerId)
  const potted   = myShots.filter(s => s.potted).length
  const errors   = myShots.filter(s => s.is_error).length
  const lucky    = myShots.filter(s => s.is_lucky).length
  const accuracy = pct(potted, myShots.length)
  const potsPerGame = myGames.length > 0 ? (potted / myGames.length).toFixed(1) : '—'

  // Streaks
  const currentStreak = (() => {
    let n = 0
    for (let i = myGames.length - 1; i >= 0; i--) {
      if (myGames[i].winner_id === playerId) n++
      else break
    }
    return n
  })()
  const bestStreak = longestStreak(myGames, playerId)

  // H2H vs each opponent
  const opponents = PLAYERS.filter(u => u !== username)
  const h2hStats = opponents.map(opp => {
    const oid      = usernameToId[opp] ?? ''
    const h2hGames = myGames.filter(g =>
      (g.player1_id === playerId && g.player2_id === oid) ||
      (g.player2_id === playerId && g.player1_id === oid)
    )
    const w = h2hGames.filter(g => g.winner_id === playerId).length
    const l = h2hGames.filter(g => g.winner_id === oid).length
    return { opponent: opp, wins: w, losses: l, total: w + l }
  })

  const rival  = h2hStats.reduce((r, h) => h.losses > r.losses ? h : r, h2hStats[0])
  const victim = h2hStats.reduce((v, h) => h.wins   > v.wins   ? h : v, h2hStats[0])

  // Standing rank (computed from all games)
  const allWins: Record<string, number> = {}
  for (const u of PLAYERS) allWins[u] = 0
  for (const g of games) {
    if (!g.winner_id) continue
    const wu = g.winner?.username
    if (wu) allWins[wu] = (allWins[wu] ?? 0) + 1
  }
  const rank = PLAYERS
    .sort((a, b) => (allWins[b] ?? 0) - (allWins[a] ?? 0))
    .indexOf(username) + 1

  // ELO
  const runElo: Record<PlayerUsername, number> = { adib: 1200, ahmed: 1200, godine: 1200 }
  const idToUsername: Record<string, PlayerUsername> = {}
  for (const g of games) {
    idToUsername[g.player1_id] = g.player1.username as PlayerUsername
    idToUsername[g.player2_id] = g.player2.username as PlayerUsername
  }
  for (const g of games) {
    if (!g.winner_id) continue
    const wu = idToUsername[g.winner_id]
    const lu = (g.player1.username === wu ? g.player2.username : g.player1.username) as PlayerUsername
    if (!wu || !(wu in runElo) || !(lu in runElo)) continue
    const delta = Math.round(32 * (1 - 1 / (1 + Math.pow(10, (runElo[lu] - runElo[wu]) / 400))))
    runElo[wu] += delta
    runElo[lu] -= delta
  }
  const elo      = runElo[username]
  const eloDelta = elo - 1200

  // Form (last 10 games)
  const form = myGames.slice(-10).map(g => g.winner_id === playerId)

  // Accuracy trend per session
  const sessionOrder: string[] = []
  const seen = new Set<string>()
  for (const g of games) {
    if (!seen.has(g.session_id)) { seen.add(g.session_id); sessionOrder.push(g.session_id) }
  }
  const shotsByGame = new Map<string, RawShot[]>()
  for (const s of shots) {
    if (!shotsByGame.has(s.game_id)) shotsByGame.set(s.game_id, [])
    shotsByGame.get(s.game_id)!.push(s)
  }
  const accuracyTrend = sessionOrder.map(sid => {
    const sGameIds = new Set(games.filter(g => g.session_id === sid).map(g => g.id))
    const sShots   = shots.filter(s => sGameIds.has(s.game_id) && s.player_id === playerId)
    const sWins    = myGames.filter(g => g.session_id === sid && g.winner_id === playerId).length
    const session  = games.find(g => g.session_id === sid)?.session
    return {
      label: session ? format(parseISO(session.date), 'd MMM') : '?',
      acc:   sShots.length > 0 ? Math.round(pct(sShots.filter(s => s.potted).length, sShots.length)) : null,
      wins:  sWins,
    }
  }).filter(d => d.acc !== null)

  // Per-game records
  let recordAccuracy = 0, recordPots = 0
  for (const game of myGames) {
    const gs = (shotsByGame.get(game.id) ?? []).filter(s => s.player_id === playerId)
    recordPots = Math.max(recordPots, gs.filter(s => s.potted).length)
    if (gs.length >= 5) recordAccuracy = Math.max(recordAccuracy, pct(gs.filter(s => s.potted).length, gs.length))
  }

  // Black ball incidents
  const blackBalls = myGames.filter(g => g.loser_potted_black && g.winner_id !== playerId).length

  // Earned badges
  const earnedBadgeIds = computePlayerAchievements(username, games, shots)
  const earnedBadges = ACHIEVEMENTS
    .filter(a => earnedBadgeIds.includes(a.id))
    .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity))

  const chartTooltipStyle = {
    contentStyle: { background: '#1a2018', border: '1px solid #2e3a2b', borderRadius: 8, fontFamily: 'Inter', fontSize: 12 },
    labelStyle:   { color: '#c8c4b5', marginBottom: 4 },
  }

  if (myGames.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div style={{ filter: `drop-shadow(0 0 16px ${style.color}55)` }} className="flex justify-center mb-6">
          <PlayerAvatar username={username} size={80} />
        </div>
        <p className="font-heading text-2xl tracking-widest mb-2" style={{ color: style.color }}>
          {style.label.toUpperCase()}
        </p>
        <p className="font-body text-sm text-pool-chalk-dim mb-6">No games played yet.</p>
        <Link href="/" className="font-body text-sm text-pool-gold hover:underline">← Back to home</Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto pb-16 animate-fade-in">
      <PullToRefresh />

      {/* ── BACK NAV ──────────────────────────────────────────────── */}
      <div className="px-4 pt-4">
        <Link href="/" className="font-body text-xs text-pool-chalk-dim hover:text-pool-gold transition-colors">
          ← Back
        </Link>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div className="relative px-4 pt-4 pb-8 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${style.color}18 0%, transparent 70%)` }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{ backgroundImage: `radial-gradient(circle, ${style.color} 1.5px, transparent 1.5px)`, backgroundSize: '36px 36px' }} />

        <div className="relative flex flex-col items-center">
          <div style={{ filter: `drop-shadow(0 0 20px ${style.color}55)` }}>
            <PlayerAvatar username={username} size={96} />
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span className="text-2xl">{RANK_BADGES[rank - 1] ?? ''}</span>
            <h1 className="font-heading text-4xl tracking-widest" style={{ color: style.color }}>
              {style.label.toUpperCase()}
            </h1>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <span className="font-heading text-xl text-pool-chalk">{elo}</span>
            <span className="font-body text-xs text-pool-chalk-dim">ELO</span>
            <span className={`font-body text-xs ${eloDelta >= 0 ? 'text-pool-green-bright' : 'text-pool-red'}`}>
              {eloDelta >= 0 ? '+' : ''}{eloDelta}
            </span>
          </div>

          {currentStreak > 1 && (
            <div className="mt-3 px-3 py-1 rounded-full font-heading text-xs tracking-widest text-pool-gold"
              style={{ background: '#c9a22714', border: '1px solid #c9a22733' }}>
              🔥 {currentStreak} game winning streak
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK STATS ───────────────────────────────────────────── */}
      <section className="px-4 pb-5">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Wins',   value: String(wins)           },
            { label: 'Losses', value: String(losses)         },
            { label: 'Win %',  value: `${winRate}%`          },
            { label: 'Played', value: String(myGames.length) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-pool-surface rounded-xl border p-3 text-center"
              style={{ borderColor: `${style.color}22` }}>
              <p className="font-heading text-xl text-pool-chalk">{value}</p>
              <p className="font-body text-xs text-pool-chalk-dim">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SHOT DNA ──────────────────────────────────────────────── */}
      {myShots.length > 0 && (
        <section className="px-4 pb-5">
          <SectionHeader title="SHOT DNA" color={style.color} />
          <div className="bg-pool-surface rounded-2xl border p-4 mt-3" style={{ borderColor: `${style.color}22` }}>
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-heading text-5xl" style={{ color: style.color }}>{accuracy}%</span>
              <span className="font-body text-xs text-pool-chalk-dim">{myShots.length} shots · {potsPerGame}/game</span>
            </div>
            <div className="h-3 bg-pool-border rounded-full overflow-hidden mb-4">
              <div className="h-full rounded-full"
                style={{ width: `${accuracy}%`, background: `linear-gradient(90deg, ${style.color}88, ${style.color})` }} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-pool-bg rounded-xl py-2">
                <p className="font-heading text-xl text-pool-chalk">{potted}</p>
                <p className="font-body text-xs text-pool-chalk-dim">Pots</p>
              </div>
              <div className="bg-pool-bg rounded-xl py-2">
                <p className="font-heading text-xl text-pool-red">{errors}</p>
                <p className="font-body text-xs text-pool-chalk-dim">Errors</p>
              </div>
              <div className="bg-pool-bg rounded-xl py-2">
                <p className="font-heading text-xl text-pool-gold">{lucky}</p>
                <p className="font-body text-xs text-pool-chalk-dim">Flukes</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── HEAD TO HEAD ──────────────────────────────────────────── */}
      <section className="px-4 pb-5">
        <SectionHeader title="HEAD TO HEAD" color={style.color} />
        <div className="mt-3 space-y-3">
          {h2hStats.map(({ opponent, wins: w, losses: l, total }) => {
            const os     = PLAYER_STYLES[opponent]
            const myPct  = total === 0 ? 50 : Math.round((w / total) * 100)
            const isRival  = rival.opponent  === opponent && rival.losses  > rival.wins
            const isVictim = victim.opponent === opponent && victim.wins   > victim.losses
            return (
              <Link key={opponent} href={`/player/${opponent}`}
                className="block bg-pool-surface rounded-2xl border border-pool-border p-4 transition-all hover:border-pool-chalk/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PlayerAvatar username={opponent} size={36} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading text-sm" style={{ color: os.color }}>
                          {os.label.toUpperCase()}
                        </span>
                        {isRival && (
                          <span className="font-heading text-[9px] text-pool-red bg-pool-red/10 border border-pool-red/20 px-1.5 py-0.5 rounded-full">
                            NEMESIS
                          </span>
                        )}
                        {isVictim && (
                          <span className="font-heading text-[9px] text-pool-gold bg-pool-gold/10 border border-pool-gold/20 px-1.5 py-0.5 rounded-full">
                            VICTIM
                          </span>
                        )}
                      </div>
                      <p className="font-body text-xs text-pool-chalk-dim mt-0.5">{total} games played</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-2xl text-pool-chalk">{w}–{l}</p>
                    <p className="font-body text-xs text-pool-chalk-dim">{myPct}% win rate</p>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-pool-border flex">
                  <div className="h-full transition-all duration-700"
                    style={{ width: `${myPct}%`, backgroundColor: style.color }} />
                  <div className="h-full flex-1" style={{ backgroundColor: os.color }} />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── FORM GUIDE ────────────────────────────────────────────── */}
      <section className="px-4 pb-5">
        <SectionHeader title="FORM GUIDE" sub={`last ${form.length} games`} color={style.color} />
        <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 mt-3">
          <div className="flex gap-1.5 flex-wrap">
            {form.map((win, i) => (
              <span key={i}
                className="w-8 h-8 rounded-full flex items-center justify-center font-heading text-sm"
                style={{
                  background: win ? `${style.color}22` : '#0e1e12',
                  color:      win ? style.color        : '#7a786f',
                  border:     `2px solid ${win ? style.color + '55' : '#1f3525'}`,
                }}
              >
                {win ? 'W' : 'L'}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACCURACY TREND ────────────────────────────────────────── */}
      {accuracyTrend.length > 1 && (
        <section className="px-4 pb-5">
          <SectionHeader title="ACCURACY TREND" color={style.color} />
          <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 mt-3">
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={accuracyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="label" tick={{ fill: '#7a786f', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7a786f', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip {...chartTooltipStyle} itemStyle={{ color: style.color }}
                  formatter={(v: number) => [`${v}%`, 'Accuracy']} />
                <Line type="monotone" dataKey="acc" name="Accuracy"
                  stroke={style.color} strokeWidth={2.5}
                  dot={{ r: 3, fill: style.color }} activeDot={{ r: 5 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ── RECORDS ───────────────────────────────────────────────── */}
      <section className="px-4 pb-5">
        <SectionHeader title="RECORDS" color={style.color} />
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[
            { label: 'Peak Accuracy',  value: recordAccuracy > 0  ? `${recordAccuracy}%`      : '—', icon: '🎯', sub: 'best single game' },
            { label: 'Most Pots',      value: recordPots > 0      ? String(recordPots)         : '—', icon: '💥', sub: 'in a single game' },
            { label: 'Best Streak',    value: bestStreak > 1      ? `${bestStreak} in a row`   : '—', icon: '🔥', sub: 'consecutive wins'  },
            { label: 'Black Balls',    value: blackBalls > 0      ? `${blackBalls}×`           : '—', icon: '🖤', sub: 'gifted the win'    },
          ].map(({ label, value, icon, sub }) => (
            <div key={label} className="bg-pool-surface rounded-xl border p-3"
              style={{ borderColor: `${style.color}22` }}>
              <div className="flex items-start justify-between mb-1">
                <span className="text-xl">{icon}</span>
              </div>
              <p className="font-heading text-xl text-pool-chalk">{value}</p>
              <p className="font-body text-xs text-pool-chalk-dim mt-0.5">{label}</p>
              <p className="font-body text-xs mt-0.5" style={{ color: `${style.color}77` }}>{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BADGES ────────────────────────────────────────────────── */}
      <section className="px-4 pb-5">
        <SectionHeader title="BADGES" sub={`${earnedBadges.length}/${ACHIEVEMENTS.length} earned`} color={style.color} />
        {earnedBadges.length === 0 ? (
          <div className="mt-3 bg-pool-surface rounded-2xl border border-pool-border p-6 text-center">
            <p className="font-body text-sm text-pool-chalk-dim">No badges yet — keep playing to unlock them!</p>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {earnedBadges.map(achievement => {
              const rs = RARITY_STYLES[achievement.rarity]
              const isFlipped = flippedBadge === achievement.id
              return (
                <div
                  key={achievement.id}
                  onClick={() => setFlippedBadge(isFlipped ? null : achievement.id)}
                  className="relative cursor-pointer"
                  style={{ height: '90px', perspective: '600px' }}
                >
                  {/* Flipper */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.38s ease',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}>
                    {/* Front */}
                    <div
                      className="absolute inset-0 rounded-xl border flex flex-col items-center justify-center p-2 text-center"
                      style={{ borderColor: rs.border, background: rs.bg, backfaceVisibility: 'hidden' }}
                    >
                      <div className="text-2xl mb-1">{achievement.icon}</div>
                      <p className="font-heading text-[11px] tracking-wide text-pool-chalk leading-tight">
                        {achievement.name.toUpperCase()}
                      </p>
                      <p className="font-body text-[9px] mt-0.5 tracking-wide" style={{ color: rs.color }}>
                        {rs.label.toUpperCase()}
                      </p>
                    </div>
                    {/* Back */}
                    <div
                      className="absolute inset-0 rounded-xl border flex flex-col items-center justify-center gap-1.5 p-2.5 text-center"
                      style={{ borderColor: rs.border, background: rs.bg, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <span className="text-base leading-none">{achievement.icon}</span>
                      <p className="font-body text-[9px] text-pool-chalk leading-snug">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <Link
          href="/achievements"
          className="mt-3 flex items-center justify-center gap-1 font-body text-xs text-pool-chalk-dim hover:text-pool-gold transition-colors pt-2"
        >
          View all badges →
        </Link>
      </section>

      {/* ── OTHER PLAYERS ─────────────────────────────────────────── */}
      <section className="px-4 pb-5">
        <SectionHeader title="OTHER PLAYERS" color={style.color} />
        <div className="grid grid-cols-2 gap-2 mt-3">
          {PLAYERS.filter(u => u !== username).map(u => {
            const s = PLAYER_STYLES[u]
            return (
              <Link key={u} href={`/player/${u}`}
                className="bg-pool-surface rounded-xl border border-pool-border p-3 flex items-center gap-3 transition-all hover:border-pool-chalk/20 active:scale-[0.98]">
                <PlayerAvatar username={u} size={40} />
                <span className="font-heading text-base tracking-wide" style={{ color: s.color }}>
                  {s.label.toUpperCase()}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

    </div>
  )
}

function SectionHeader({ title, sub, color }: { title: string; sub?: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="font-heading text-sm tracking-[0.15em] text-pool-chalk shrink-0">{title}</h2>
      {sub && <p className="font-body text-xs text-pool-chalk-dim shrink-0">{sub}</p>}
      <div className="flex-1 h-px" style={{ backgroundColor: `${color}44` }} />
    </div>
  )
}
