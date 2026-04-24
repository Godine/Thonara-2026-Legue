'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { PLAYER_STYLES, PLAYERS, type PlayerUsername } from '@/lib/game-config'
import PlayerBall from '@/components/PlayerBall'
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'

// ── Types ────────────────────────────────────────────────────────────────────

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

interface PlayerStat {
  username: PlayerUsername
  displayName: string
  wins: number
  losses: number
  gamesPlayed: number
  shots: number
  potted: number
  errors: number
  lucky: number
  blackBallIncidents: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const COLORS: Record<PlayerUsername, string> = {
  adib:   '#f5c518',
  ahmed:  '#60a5fa',
  godine: '#f87171',
}

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100)
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function longestStreak(games: RawGame[], playerId: string) {
  let best = 0, cur = 0
  for (const g of games) {
    if (g.winner_id === playerId) { cur++; best = Math.max(best, cur) }
    else cur = 0
  }
  return best
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const supabase = createClient()
  const [games, setGames] = useState<RawGame[]>([])
  const [shots, setShots] = useState<RawShot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: gamesData }, { data: shotsData }] = await Promise.all([
        supabase
          .from('games')
          .select(`
            id, game_number, session_id, player1_id, player2_id, winner_id, loser_potted_black,
            player1:players!games_player1_id_fkey (id, username, display_name),
            player2:players!games_player2_id_fkey (id, username, display_name),
            winner:players!games_winner_id_fkey  (id, username, display_name),
            session:sessions (id, date)
          `)
          .eq('is_complete', true)
          .order('created_at', { ascending: true }),
        supabase.from('shots').select('id, game_id, player_id, potted, is_lucky, is_error, shot_number, created_at'),
      ])
      setGames((gamesData ?? []) as unknown as RawGame[])
      setShots((shotsData ?? []) as unknown as RawShot[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-pool-chalk-dim font-body animate-pulse">Loading stats…</p>
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">📊</div>
        <p className="font-heading text-2xl text-pool-chalk tracking-wider mb-2">NO DATA YET</p>
        <p className="font-body text-pool-chalk-dim text-sm mb-6">Play some games and come back here to see the stats.</p>
        <Link href="/" className="text-pool-gold font-body text-sm hover:underline">← Start playing</Link>
      </div>
    )
  }

  // ── Compute player stats ─────────────────────────────────────────────────

  const playerMap: Record<string, PlayerStat> = {}

  for (const username of PLAYERS) {
    const style = PLAYER_STYLES[username]
    playerMap[username] = {
      username, displayName: style.label,
      wins: 0, losses: 0, gamesPlayed: 0,
      shots: 0, potted: 0, errors: 0, lucky: 0,
      blackBallIncidents: 0,
    }
  }

  // Build a playerId → username map from games
  const idToUsername: Record<string, PlayerUsername> = {}
  for (const g of games) {
    idToUsername[g.player1.id] = g.player1.username as PlayerUsername
    idToUsername[g.player2.id] = g.player2.username as PlayerUsername
  }

  // username → playerId (needed for form guide & accuracy trend)
  const playerIdMap: Partial<Record<PlayerUsername, string>> = {}
  for (const g of games) {
    playerIdMap[g.player1.username as PlayerUsername] = g.player1_id
    playerIdMap[g.player2.username as PlayerUsername] = g.player2_id
  }

  // Last 5 game results per player (true = win)
  const form: Record<PlayerUsername, boolean[]> = { adib: [], ahmed: [], godine: [] }
  for (const u of PLAYERS) {
    const pid = playerIdMap[u]
    if (!pid) continue
    const myGames = games.filter(g => g.player1_id === pid || g.player2_id === pid)
    form[u] = myGames.slice(-5).map(g => g.winner_id === pid)
  }

  for (const g of games) {
    const p1u = g.player1.username as PlayerUsername
    const p2u = g.player2.username as PlayerUsername
    if (playerMap[p1u]) playerMap[p1u].gamesPlayed++
    if (playerMap[p2u]) playerMap[p2u].gamesPlayed++
    if (g.winner_id) {
      const wu = idToUsername[g.winner_id]
      const lu = wu === p1u ? p2u : p1u
      if (wu && playerMap[wu]) playerMap[wu].wins++
      if (lu && playerMap[lu]) {
        playerMap[lu].losses++
        if (g.loser_potted_black) playerMap[lu].blackBallIncidents++
      }
    }
  }

  for (const shot of shots) {
    const username = idToUsername[shot.player_id]
    if (username && playerMap[username]) {
      playerMap[username].shots++
      if (shot.potted)   playerMap[username].potted++
      if (shot.is_error) playerMap[username].errors++
      if (shot.is_lucky) playerMap[username].lucky++
    }
  }

  // ── Shot grouping by game ─────────────────────────────────────────────────

  const shotsByGame = new Map<string, RawShot[]>()
  for (const s of shots) {
    if (!shotsByGame.has(s.game_id)) shotsByGame.set(s.game_id, [])
    shotsByGame.get(s.game_id)!.push(s)
  }

  // Game durations (first shot → last shot per game, sanity-filtered)
  const durations: number[] = []
  for (const gameShots of Array.from(shotsByGame.values())) {
    if (gameShots.length < 2) continue
    const sorted = [...gameShots].sort((a, b) => a.shot_number - b.shot_number)
    const dur = Math.floor(
      (new Date(sorted[sorted.length - 1].created_at).getTime() - new Date(sorted[0].created_at).getTime()) / 1000
    )
    if (dur >= 30 && dur <= 7200) durations.push(dur)
  }
  const avgDuration = durations.length > 0 ? Math.floor(durations.reduce((a, b) => a + b, 0) / durations.length) : null
  const minDuration = durations.length > 0 ? Math.min(...durations) : null
  const maxDuration = durations.length > 0 ? Math.max(...durations) : null

  // Break pots per player (first consecutive potted shots by the first shooter)
  const breakStats: Record<PlayerUsername, { total: number; games: number; best: number }> = {
    adib:   { total: 0, games: 0, best: 0 },
    ahmed:  { total: 0, games: 0, best: 0 },
    godine: { total: 0, games: 0, best: 0 },
  }
  for (const game of games) {
    const gameShots = shotsByGame.get(game.id) ?? []
    if (gameShots.length === 0) continue
    const sorted = [...gameShots].sort((a, b) => a.shot_number - b.shot_number)
    const breakerId = sorted[0].player_id
    const breakerUsername = idToUsername[breakerId]
    if (!breakerUsername || !breakStats[breakerUsername]) continue
    let pots = 0
    for (const s of sorted) {
      if (s.player_id !== breakerId) break
      if (!s.potted) break
      pots++
    }
    breakStats[breakerUsername].total += pots
    breakStats[breakerUsername].games++
    breakStats[breakerUsername].best = Math.max(breakStats[breakerUsername].best, pots)
  }

  const standings = PLAYERS
    .map(u => playerMap[u])
    .sort((a, b) => b.wins - a.wins || b.gamesPlayed - a.gamesPlayed)

  // ── Head-to-head ─────────────────────────────────────────────────────────

  const h2h: Record<string, Record<string, number>> = {}
  for (const u of PLAYERS) { h2h[u] = {} ; for (const v of PLAYERS) h2h[u][v] = 0 }
  for (const g of games) {
    if (!g.winner_id) continue
    const wu = idToUsername[g.winner_id]
    const opp = wu === g.player1.username ? g.player2.username : g.player1.username
    if (wu && opp) h2h[wu][opp] = (h2h[wu][opp] ?? 0) + 1
  }

  // ── Cumulative wins timeline ──────────────────────────────────────────────

  const sessionOrder: string[] = []
  const seenSessions = new Set<string>()
  for (const g of games) {
    if (!seenSessions.has(g.session_id)) {
      seenSessions.add(g.session_id)
      sessionOrder.push(g.session_id)
    }
  }

  const cumWins: Record<PlayerUsername, number> = { adib: 0, ahmed: 0, godine: 0 }
  const timelineData = sessionOrder.map(sid => {
    const sessionGames = games.filter(g => g.session_id === sid && g.winner_id)
    for (const g of sessionGames) {
      const wu = idToUsername[g.winner_id!]
      if (wu) cumWins[wu]++
    }
    const session = games.find(g => g.session_id === sid)?.session
    return {
      label: session ? format(parseISO(session.date), 'd MMM') : sid.slice(0, 4),
      adib: cumWins.adib,
      ahmed: cumWins.ahmed,
      godine: cumWins.godine,
    }
  })

  // ── Accuracy over time per session ───────────────────────────────────────

  const accuracyTrend = sessionOrder.map(sid => {
    const sessionGameIds = new Set(games.filter(g => g.session_id === sid).map(g => g.id))
    const sessionShots = shots.filter(s => sessionGameIds.has(s.game_id))
    const session = games.find(g => g.session_id === sid)?.session
    const label = session ? format(parseISO(session.date), 'd MMM') : sid.slice(0, 4)
    const entry: Record<string, number | string | null> = { label }
    for (const u of PLAYERS) {
      const pid = playerIdMap[u]
      if (!pid) { entry[u] = null; continue }
      const myShots = sessionShots.filter(s => s.player_id === pid)
      entry[u] = myShots.length > 0 ? Math.round((myShots.filter(s => s.potted).length / myShots.length) * 100) : null
    }
    return entry
  })

  // ── Accuracy chart data ───────────────────────────────────────────────────

  const accuracyData = PLAYERS.map(u => ({
    name: PLAYER_STYLES[u].label,
    'Pot %': pct(playerMap[u].potted, playerMap[u].shots),
    'Error %': pct(playerMap[u].errors, playerMap[u].shots),
    'Lucky %': pct(playerMap[u].lucky, playerMap[u].shots),
    color: COLORS[u],
  }))

  // ── Shot efficiency: average pots per game ───────────────────────────────

  const efficiencyData = PLAYERS.map(u => ({
    name: PLAYER_STYLES[u].label,
    'Pots/game': playerMap[u].gamesPlayed > 0
      ? parseFloat((playerMap[u].potted / playerMap[u].gamesPlayed).toFixed(1))
      : 0,
    color: COLORS[u],
  }))

  // ── Win rate by game number ───────────────────────────────────────────────

  const byGameNum: Record<number, Record<string, number>> = {}
  for (let n = 1; n <= 6; n++) byGameNum[n] = { adib: 0, ahmed: 0, godine: 0 }
  for (const g of games) {
    if (!g.winner_id) continue
    const wu = idToUsername[g.winner_id]
    if (wu && byGameNum[g.game_number]) byGameNum[g.game_number][wu]++
  }
  const gameNumData = [1,2,3,4,5,6].map(n => ({
    game: `G${n}`,
    adib: byGameNum[n].adib,
    ahmed: byGameNum[n].ahmed,
    godine: byGameNum[n].godine,
  }))

  // ── Fun facts ────────────────────────────────────────────────────────────

  const totalShots = shots.length
  const totalPotted = shots.filter(s => s.potted).length
  const overallAcc = pct(totalPotted, totalShots)

  const bestStreak = PLAYERS.reduce((acc, u) => {
    const streak = longestStreak(games, Object.keys(idToUsername).find(k => idToUsername[k] === u) ?? '')
    return streak > acc.streak ? { username: u, streak } : acc
  }, { username: 'adib' as PlayerUsername, streak: 0 })

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in space-y-5">
      {/* Header */}
      <div>
        <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-1">2026 Season</p>
        <h1 className="font-heading text-4xl tracking-wider text-pool-chalk">STATS</h1>
        <div className="mt-2 h-px bg-gradient-to-r from-pool-gold/40 to-transparent" />
      </div>

      {/* League table */}
      <div className="bg-pool-surface rounded-2xl border border-pool-border overflow-hidden">
        <div className="px-4 py-3 border-b border-pool-border">
          <p className="font-heading text-sm tracking-widest text-pool-chalk-dim">STANDINGS</p>
        </div>
        <div className="divide-y divide-pool-border">
          {standings.map((p, i) => {
            const style = PLAYER_STYLES[p.username]
            return (
              <div key={p.username} className="flex items-center gap-3 px-4 py-3">
                <span className="font-heading text-lg text-pool-chalk-dim w-5">{i + 1}</span>
                <PlayerBall number={style.number} color={style.color} size={30} />
                <div className="flex-1">
                  <p className="font-heading text-base tracking-wide" style={{ color: style.color }}>
                    {p.displayName.toUpperCase()}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-body text-xs text-pool-chalk-dim">{p.gamesPlayed} played</span>
                    {(form[p.username] ?? []).length > 0 && (
                      <>
                        <span className="text-pool-chalk-dim text-xs">·</span>
                        {(form[p.username] ?? []).map((win, j) => (
                          <span key={j} style={{ color: win ? style.color : '#3a3a35', fontSize: 10, lineHeight: 1 }}>●</span>
                        ))}
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-heading text-2xl text-pool-gold">{p.wins}</p>
                  <p className="font-body text-xs text-pool-chalk-dim">
                    {p.losses}L · {pct(p.wins, p.gamesPlayed)}%
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Game Duration */}
      {avgDuration != null && (
        <div className="bg-pool-surface rounded-2xl border border-pool-border p-4">
          <p className="font-heading text-sm tracking-widest text-pool-chalk-dim mb-4">GAME DURATION</p>
          <div className="grid grid-cols-3 gap-0 divide-x divide-pool-border">
            <div className="text-center px-2">
              <p className="font-body text-xs text-pool-chalk-dim mb-1">Average</p>
              <p className="font-heading text-xl text-pool-chalk tabular-nums">{formatTime(avgDuration)}</p>
            </div>
            <div className="text-center px-2">
              <p className="font-body text-xs text-pool-chalk-dim mb-1">Fastest</p>
              <p className="font-heading text-xl text-pool-green-bright tabular-nums">
                {minDuration != null ? formatTime(minDuration) : '—'}
              </p>
            </div>
            <div className="text-center px-2">
              <p className="font-body text-xs text-pool-chalk-dim mb-1">Longest</p>
              <p className="font-heading text-xl text-pool-gold tabular-nums">
                {maxDuration != null ? formatTime(maxDuration) : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Wins over time */}
      {timelineData.length > 1 && (
        <div className="bg-pool-surface rounded-2xl border border-pool-border p-4">
          <p className="font-heading text-sm tracking-widest text-pool-chalk-dim mb-4">POINTS RACE</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={timelineData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="label" tick={{ fill: '#7a786f', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#7a786f', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1a2018', border: '1px solid #2e3a2b', borderRadius: 8, fontFamily: 'Inter', fontSize: 12 }}
                labelStyle={{ color: '#c8c4b5', marginBottom: 4 }}
                itemStyle={{ color: '#c8c4b5' }}
              />
              {PLAYERS.map(u => (
                <Line key={u} type="monotone" dataKey={u} name={PLAYER_STYLES[u].label}
                  stroke={COLORS[u]} strokeWidth={2.5} dot={{ r: 3, fill: COLORS[u] }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Accuracy over time */}
      {accuracyTrend.length > 1 && totalShots > 0 && (
        <div className="bg-pool-surface rounded-2xl border border-pool-border p-4">
          <p className="font-heading text-sm tracking-widest text-pool-chalk-dim mb-4">ACCURACY OVER TIME</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={accuracyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="label" tick={{ fill: '#7a786f', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#7a786f', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#1a2018', border: '1px solid #2e3a2b', borderRadius: 8, fontFamily: 'Inter', fontSize: 12 }}
                labelStyle={{ color: '#c8c4b5', marginBottom: 4 }}
                itemStyle={{ color: '#c8c4b5' }}
                formatter={(v: number) => [`${v}%`]}
              />
              {PLAYERS.map(u => (
                <Line key={u} type="monotone" dataKey={u} name={PLAYER_STYLES[u].label}
                  stroke={COLORS[u]} strokeWidth={2.5} dot={{ r: 3, fill: COLORS[u] }}
                  activeDot={{ r: 5 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Shot accuracy */}
      {totalShots > 0 && (
        <div className="bg-pool-surface rounded-2xl border border-pool-border p-4">
          <p className="font-heading text-sm tracking-widest text-pool-chalk-dim mb-4">SHOT ACCURACY</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={accuracyData} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: '#7a786f', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#7a786f', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{ background: '#1a2018', border: '1px solid #2e3a2b', borderRadius: 8, fontFamily: 'Inter', fontSize: 12 }}
                itemStyle={{ color: '#c8c4b5' }}
                formatter={(v: number) => [`${v}%`]}
              />
              <Bar dataKey="Pot %" radius={[4,4,0,0]}>
                {accuracyData.map(d => <Cell key={d.name} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Detailed breakdown */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-pool-border">
            {PLAYERS.map(u => {
              const p = playerMap[u]
              const style = PLAYER_STYLES[u]
              return (
                <div key={u} className="text-center">
                  <p className="font-heading text-xs tracking-widest mb-2" style={{ color: style.color }}>{style.label.toUpperCase()}</p>
                  <div className="space-y-1 text-xs font-body">
                    <div className="flex justify-between">
                      <span className="text-pool-chalk-dim">Pot</span>
                      <span className="text-pool-chalk">{pct(p.potted, p.shots)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-pool-chalk-dim">Error</span>
                      <span className="text-pool-red">{pct(p.errors, p.shots)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-pool-chalk-dim">Lucky</span>
                      <span className="text-pool-gold">{pct(p.lucky, p.shots)}%</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-pool-border/50">
                      <span className="text-pool-chalk-dim">Total</span>
                      <span className="text-pool-chalk">{p.shots}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Shot efficiency */}
      {totalShots > 0 && (
        <div className="bg-pool-surface rounded-2xl border border-pool-border p-4">
          <p className="font-heading text-sm tracking-widest text-pool-chalk-dim mb-1">SHOT EFFICIENCY</p>
          <p className="font-body text-xs text-pool-chalk-dim mb-4">Average pots per game</p>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart layout="vertical" data={efficiencyData} margin={{ top: 0, right: 24, bottom: 0, left: 10 }}>
              <XAxis type="number" tick={{ fill: '#7a786f', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#7a786f', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                contentStyle={{ background: '#1a2018', border: '1px solid #2e3a2b', borderRadius: 8, fontFamily: 'Inter', fontSize: 12 }}
                itemStyle={{ color: '#c8c4b5' }}
                formatter={(v: number) => [`${v} pots/game`]}
              />
              <Bar dataKey="Pots/game" radius={[0, 4, 4, 0]}>
                {efficiencyData.map(d => <Cell key={d.name} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Break Performance */}
      {Object.values(breakStats).some(s => s.games > 0) && (
        <div className="bg-pool-surface rounded-2xl border border-pool-border overflow-hidden">
          <div className="px-4 py-3 border-b border-pool-border">
            <p className="font-heading text-sm tracking-widest text-pool-chalk-dim">BREAK PERFORMANCE</p>
            <p className="font-body text-xs text-pool-chalk-dim mt-0.5">Pots on the opening break</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-4 gap-2 text-xs font-body text-pool-chalk-dim mb-3 pb-2 border-b border-pool-border/50">
              <span>Player</span>
              <span className="text-center">Total</span>
              <span className="text-center">Avg</span>
              <span className="text-center">Best</span>
            </div>
            <div className="space-y-3">
              {PLAYERS.map(u => {
                const stat = breakStats[u]
                if (stat.games === 0) return null
                const style = PLAYER_STYLES[u]
                return (
                  <div key={u} className="grid grid-cols-4 gap-2 items-center">
                    <span className="font-heading text-sm tracking-wide" style={{ color: style.color }}>{style.label}</span>
                    <span className="text-center font-heading text-base text-pool-chalk">{stat.total}</span>
                    <span className="text-center font-body text-sm text-pool-chalk">
                      {(stat.total / stat.games).toFixed(1)}
                    </span>
                    <span className="text-center font-heading text-base text-pool-gold">{stat.best}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Head to head */}
      <div className="bg-pool-surface rounded-2xl border border-pool-border overflow-hidden">
        <div className="px-4 py-3 border-b border-pool-border">
          <p className="font-heading text-sm tracking-widest text-pool-chalk-dim">HEAD TO HEAD</p>
        </div>
        <div className="p-4">
          <div className="grid gap-3">
            {PLAYERS.flatMap((u, i) => PLAYERS.slice(i + 1).map(v => {
              const uWins = h2h[u][v] ?? 0
              const vWins = h2h[v][u] ?? 0
              const total = uWins + vWins
              const uPct = total === 0 ? 50 : Math.round((uWins / total) * 100)
              const uStyle = PLAYER_STYLES[u]
              const vStyle = PLAYER_STYLES[v]
              return (
                <div key={`${u}-${v}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-heading text-sm tracking-wide" style={{ color: uStyle.color }}>{uStyle.label}</span>
                    <span className="font-heading text-base text-pool-chalk">{uWins} – {vWins}</span>
                    <span className="font-heading text-sm tracking-wide" style={{ color: vStyle.color }}>{vStyle.label}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-pool-border flex">
                    <div className="h-full transition-all duration-500" style={{ width: `${uPct}%`, backgroundColor: uStyle.color }} />
                    <div className="h-full flex-1" style={{ backgroundColor: vStyle.color }} />
                  </div>
                </div>
              )
            }))}
          </div>
        </div>
      </div>

      {/* Win by game number */}
      <div className="bg-pool-surface rounded-2xl border border-pool-border p-4">
        <p className="font-heading text-sm tracking-widest text-pool-chalk-dim mb-4">WINS BY GAME NUMBER</p>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={gameNumData} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
            <XAxis dataKey="game" tick={{ fill: '#7a786f', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#7a786f', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#1a2018', border: '1px solid #2e3a2b', borderRadius: 8, fontFamily: 'Inter', fontSize: 12 }}
              itemStyle={{ color: '#c8c4b5' }}
            />
            {PLAYERS.map(u => (
              <Bar key={u} dataKey={u} name={PLAYER_STYLES[u].label} fill={COLORS[u]} radius={[3,3,0,0]} stackId="a" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Fun facts */}
      <div className="bg-pool-surface rounded-2xl border border-pool-border overflow-hidden">
        <div className="px-4 py-3 border-b border-pool-border">
          <p className="font-heading text-sm tracking-widest text-pool-chalk-dim">FUN FACTS</p>
        </div>
        <div className="divide-y divide-pool-border">
          <Fact label="Overall pot accuracy" value={`${overallAcc}%`} icon="🎯" />
          <Fact label="Total shots recorded" value={totalShots.toLocaleString()} icon="📊" />
          <Fact label="Total games played" value={games.length.toString()} icon="🎱" />
          {bestStreak.streak > 1 && (
            <Fact
              label={`${PLAYER_STYLES[bestStreak.username].label}'s best win streak`}
              value={`${bestStreak.streak} in a row`}
              icon="🔥"
            />
          )}
          {PLAYERS.map(u => {
            const p = playerMap[u]
            if (p.blackBallIncidents === 0) return null
            return (
              <Fact key={u} label={`${p.displayName} potted the black on themselves`} value={`${p.blackBallIncidents}×`} icon="🖤" />
            )
          })}
          {PLAYERS.map(u => {
            const p = playerMap[u]
            if (p.lucky === 0) return null
            return (
              <Fact key={u} label={`${p.displayName} fluked a pot`} value={`${p.lucky} times`} icon="★" />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Fact({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-lg w-7">{icon}</span>
      <span className="font-body text-sm text-pool-chalk-dim flex-1">{label}</span>
      <span className="font-heading text-base text-pool-chalk">{value}</span>
    </div>
  )
}
