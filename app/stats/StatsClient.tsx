'use client'

import { format, parseISO } from 'date-fns'
import { PLAYER_STYLES, PLAYERS, type PlayerUsername } from '@/lib/game-config'
import PlayerBall from '@/components/PlayerBall'
import PlayerAvatar from '@/components/PlayerAvatar'
import { pct, formatTime, longestStreak, buildFirstShotMap, sortGamesByPlayOrder } from '@/lib/stats'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

interface RawGame {
  id: string
  game_number: number
  session_id: string
  player1_id: string
  player2_id: string
  winner_id: string | null
  loser_potted_black: boolean
  breaker_id: string | null
  loser_balls_remaining: number | null
  player1_color: 'yellow' | 'red' | null
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
  balls_potted?: number
  ball_color?: string | null
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

const COLORS: Record<PlayerUsername, string> = {
  adib:   '#f5c518',
  ahmed:  '#60a5fa',
  godine: '#f87171',
}

export default function StatsClient({ games: _games, shots }: { games: RawGame[]; shots: RawShot[] }) {
  // Sort by actual play order: session date first, then by first-shot timestamp
  // within a session (game_number only reflects the schedule, not play order).
  const firstShotAt = buildFirstShotMap(shots)
  const games = sortGamesByPlayOrder(_games, firstShotAt)

  // ── Compute player stats ────────────────────────────────────────────────

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

  const idToUsername: Record<string, PlayerUsername> = {}
  for (const g of games) {
    idToUsername[g.player1.id] = g.player1.username as PlayerUsername
    idToUsername[g.player2.id] = g.player2.username as PlayerUsername
  }

  const playerIdMap: Partial<Record<PlayerUsername, string>> = {}
  for (const g of games) {
    playerIdMap[g.player1.username as PlayerUsername] = g.player1_id
    playerIdMap[g.player2.username as PlayerUsername] = g.player2_id
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

  // ── Shot grouping by game ───────────────────────────────────────────────

  const shotsByGame = new Map<string, RawShot[]>()
  for (const s of shots) {
    if (!shotsByGame.has(s.game_id)) shotsByGame.set(s.game_id, [])
    shotsByGame.get(s.game_id)!.push(s)
  }

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
      const scored = s.balls_potted != null ? s.balls_potted : (s.potted ? 1 : 0)
      if (scored === 0) break
      pots += scored
    }
    breakStats[breakerUsername].total += pots
    breakStats[breakerUsername].games++
    breakStats[breakerUsername].best = Math.max(breakStats[breakerUsername].best, pots)
  }

  // ── Break advantage — uses persisted breaker_id, falls back to first shot ───
  const breakAdvantage: Record<PlayerUsername, { broke: number; wonAfterBreak: number }> = {
    adib:   { broke: 0, wonAfterBreak: 0 },
    ahmed:  { broke: 0, wonAfterBreak: 0 },
    godine: { broke: 0, wonAfterBreak: 0 },
  }
  for (const g of games) {
    if (!g.winner_id) continue
    const gameShots = shotsByGame.get(g.id) ?? []
    const breakerId = g.breaker_id ?? (gameShots.length > 0
      ? [...gameShots].sort((a, b) => a.shot_number - b.shot_number)[0].player_id
      : null)
    if (!breakerId) continue
    const bu = idToUsername[breakerId]
    if (!bu || !(bu in breakAdvantage)) continue
    breakAdvantage[bu].broke++
    if (g.winner_id === breakerId) breakAdvantage[bu].wonAfterBreak++
  }
  const hasBreakAdvantageData = PLAYERS.some(u => breakAdvantage[u].broke > 0)

  // ── Colour win correlation — uses persisted player1_color, falls back to shots
  const colorWins: Record<PlayerUsername, { yW: number; yG: number; rW: number; rG: number }> = {
    adib:   { yW: 0, yG: 0, rW: 0, rG: 0 },
    ahmed:  { yW: 0, yG: 0, rW: 0, rG: 0 },
    godine: { yW: 0, yG: 0, rW: 0, rG: 0 },
  }
  for (const g of games) {
    if (!g.winner_id) continue
    const p1u = g.player1.username as PlayerUsername
    const p2u = g.player2.username as PlayerUsername
    let p1c: 'yellow' | 'red' | null = g.player1_color ?? null
    if (!p1c) {
      // derive from shot ball_color for this game
      const gs = shotsByGame.get(g.id) ?? []
      const p1y = gs.filter(s => s.player_id === g.player1_id && s.ball_color === 'yellow').length
      const p1r = gs.filter(s => s.player_id === g.player1_id && s.ball_color === 'red').length
      const p2y = gs.filter(s => s.player_id === g.player2_id && s.ball_color === 'yellow').length
      const p2r = gs.filter(s => s.player_id === g.player2_id && s.ball_color === 'red').length
      if (p1y > p1r && p2r > p2y) p1c = 'yellow'
      else if (p1r > p1y && p2y > p2r) p1c = 'red'
    }
    if (!p1c) continue
    const p2c: 'yellow' | 'red' = p1c === 'yellow' ? 'red' : 'yellow'
    const p1won = g.winner_id === g.player1_id
    const p2won = g.winner_id === g.player2_id
    if (p1c === 'yellow') { colorWins[p1u].yG++; if (p1won) colorWins[p1u].yW++ }
    else                  { colorWins[p1u].rG++; if (p1won) colorWins[p1u].rW++ }
    if (p2c === 'yellow') { colorWins[p2u].yG++; if (p2won) colorWins[p2u].yW++ }
    else                  { colorWins[p2u].rG++; if (p2won) colorWins[p2u].rW++ }
  }
  const hasColorWinData = PLAYERS.some(u => colorWins[u].yG + colorWins[u].rG > 0)

  // ── Margin of victory — uses persisted loser_balls_remaining, falls back to shots
  const marginData: Record<PlayerUsername, { total: number; count: number }> = {
    adib:   { total: 0, count: 0 },
    ahmed:  { total: 0, count: 0 },
    godine: { total: 0, count: 0 },
  }
  for (const g of games) {
    if (!g.winner_id) continue
    const wu = idToUsername[g.winner_id]
    if (!wu || !(wu in marginData)) continue
    let ballsLeft: number
    if (g.loser_balls_remaining != null) {
      ballsLeft = g.loser_balls_remaining
    } else {
      const loserId = g.winner_id === g.player1_id ? g.player2_id : g.player1_id
      const gs = shotsByGame.get(g.id) ?? []
      const loserPotted = gs
        .filter(s => s.player_id === loserId && !s.is_error)
        .reduce((sum, s) => sum + ((s as any).balls_potted ?? (s.potted ? 1 : 0)), 0)
      ballsLeft = Math.max(0, 7 - loserPotted)
    }
    marginData[wu].total += ballsLeft
    marginData[wu].count++
  }
  const hasMarginData = PLAYERS.some(u => marginData[u].count > 0)

  // ── Ball Colors ─────────────────────────────────────────────────────────────
  const ballColorStats: Record<PlayerUsername, { yellows: number; reds: number }> = {
    adib:   { yellows: 0, reds: 0 },
    ahmed:  { yellows: 0, reds: 0 },
    godine: { yellows: 0, reds: 0 },
  }
  for (const shot of shots) {
    const username = idToUsername[shot.player_id]
    if (!username || !ballColorStats[username]) continue
    const count = shot.balls_potted ?? (shot.potted ? 1 : 0)
    if (shot.ball_color === 'yellow') ballColorStats[username].yellows += count
    else if (shot.ball_color === 'red') ballColorStats[username].reds += count
  }
  const totalYellows = PLAYERS.reduce((s, u) => s + ballColorStats[u].yellows, 0)
  const totalReds = PLAYERS.reduce((s, u) => s + ballColorStats[u].reds, 0)
  const hasColorData = totalYellows + totalReds > 0

  const standings = PLAYERS
    .map(u => playerMap[u])
    .sort((a, b) => b.wins - a.wins || b.gamesPlayed - a.gamesPlayed)

  // ── Session order ───────────────────────────────────────────────────────
  const sessionOrder: string[] = []
  const seenSessions = new Set<string>()
  for (const g of games) {
    if (!seenSessions.has(g.session_id)) {
      seenSessions.add(g.session_id)
      sessionOrder.push(g.session_id)
    }
  }

  // ── Elo ratings ─────────────────────────────────────────────────────────
  const eloAtSession: { label: string; adib: number; ahmed: number; godine: number }[] = []
  const runElo: Record<PlayerUsername, number> = { adib: 1200, ahmed: 1200, godine: 1200 }
  for (const sid of sessionOrder) {
    for (const g of games.filter(g2 => g2.session_id === sid && !!g2.winner_id)) {
      const wu = idToUsername[g.winner_id!]
      const lu = (g.player1.username === wu ? g.player2.username : g.player1.username) as PlayerUsername
      if (!wu || !(wu in runElo) || !(lu in runElo)) continue
      const delta = Math.round(32 * (1 - 1 / (1 + Math.pow(10, (runElo[lu] - runElo[wu]) / 400))))
      runElo[wu] += delta
      runElo[lu] -= delta
    }
    const sess = games.find(g => g.session_id === sid)?.session
    eloAtSession.push({
      label: sess ? format(parseISO(sess.date), 'd MMM') : sid.slice(0, 4),
      adib: runElo.adib, ahmed: runElo.ahmed, godine: runElo.godine,
    })
  }
  const eloRatings: Record<PlayerUsername, number> = { ...runElo }

  // ── Streaks ─────────────────────────────────────────────────────────────
  const currentStreaks: Record<PlayerUsername, number> = { adib: 0, ahmed: 0, godine: 0 }
  const longestStreaks: Record<PlayerUsername, number> = { adib: 0, ahmed: 0, godine: 0 }
  for (const u of PLAYERS) {
    const pid = playerIdMap[u]
    if (!pid) continue
    const myGames = games.filter(g => g.player1_id === pid || g.player2_id === pid)
    for (let i = myGames.length - 1; i >= 0; i--) {
      if (myGames[i].winner_id === pid) currentStreaks[u]++
      else break
    }
    longestStreaks[u] = longestStreak(myGames, pid)
  }

  // ── Per-game records ────────────────────────────────────────────────────
  const recordAccuracy: Record<PlayerUsername, number> = { adib: 0, ahmed: 0, godine: 0 }
  const recordPots: Record<PlayerUsername, number>     = { adib: 0, ahmed: 0, godine: 0 }
  for (const game of games) {
    const gameShots = shotsByGame.get(game.id) ?? []
    for (const u of PLAYERS) {
      const pid = playerIdMap[u]
      if (!pid) continue
      const mine = gameShots.filter(s => s.player_id === pid)
      recordPots[u] = Math.max(recordPots[u], mine.filter(s => s.potted).length)
      if (mine.length >= 5) {
        const acc = Math.round((mine.filter(s => s.potted).length / mine.length) * 100)
        recordAccuracy[u] = Math.max(recordAccuracy[u], acc)
      }
    }
  }

  // ── H2H ─────────────────────────────────────────────────────────────────
  const h2h: Record<string, Record<string, number>> = {}
  for (const u of PLAYERS) { h2h[u] = {}; for (const v of PLAYERS) h2h[u][v] = 0 }
  for (const g of games) {
    if (!g.winner_id) continue
    const wu = idToUsername[g.winner_id]
    const opp = wu === g.player1.username ? g.player2.username : g.player1.username
    if (wu && opp) h2h[wu][opp] = (h2h[wu][opp] ?? 0) + 1
  }

  // ── Chart data ───────────────────────────────────────────────────────────
  const cumWins: Record<PlayerUsername, number> = { adib: 0, ahmed: 0, godine: 0 }
  const timelineData = sessionOrder.map(sid => {
    for (const g of games.filter(g => g.session_id === sid && g.winner_id)) {
      const wu = idToUsername[g.winner_id!]
      if (wu) cumWins[wu]++
    }
    const session = games.find(g => g.session_id === sid)?.session
    return {
      label: session ? format(parseISO(session.date), 'd MMM') : sid.slice(0, 4),
      adib: cumWins.adib, ahmed: cumWins.ahmed, godine: cumWins.godine,
    }
  })

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

  const byGameNum: Record<number, Record<string, number>> = {}
  for (let n = 1; n <= 6; n++) byGameNum[n] = { adib: 0, ahmed: 0, godine: 0 }
  for (const g of games) {
    if (!g.winner_id) continue
    const wu = idToUsername[g.winner_id]
    if (wu && byGameNum[g.game_number]) byGameNum[g.game_number][wu]++
  }
  const gameNumData = [1,2,3,4,5,6].map(n => ({
    game: `G${n}`,
    adib: byGameNum[n].adib, ahmed: byGameNum[n].ahmed, godine: byGameNum[n].godine,
  }))

  const totalShots = shots.length
  const totalPotted = shots.filter(s => s.potted).length
  const overallAcc = pct(totalPotted, totalShots)

  const bestStreak = PLAYERS.reduce((acc, u) => {
    const streak = longestStreaks[u]
    return streak > acc.streak ? { username: u, streak } : acc
  }, { username: 'adib' as PlayerUsername, streak: 0 })

  // ── Pre-compute record holders ───────────────────────────────────────────
  const bestAccPlayer   = PLAYERS.reduce((b, u) => recordAccuracy[u] > recordAccuracy[b] ? u : b, PLAYERS[0])
  const mostPotsPlayer  = PLAYERS.reduce((b, u) => recordPots[u] > recordPots[b] ? u : b, PLAYERS[0])
  const mostBlackPlayer = PLAYERS.reduce((b, u) => playerMap[u].blackBallIncidents > playerMap[b].blackBallIncidents ? u : b, PLAYERS[0])

  // Best single-game break (most balls potted on the break)
  const bestBreakPlayer = PLAYERS.reduce((b, u) => breakStats[u].best > breakStats[b].best ? u : b, PLAYERS[0])

  // Biggest single-game win margin (loser had the most balls left)
  let biggestMarginWinner: PlayerUsername | null = null
  let biggestMarginBalls = -1
  for (const g of games) {
    if (!g.winner_id) continue
    const wu = idToUsername[g.winner_id]
    if (!wu) continue
    let ballsLeft: number
    if (g.loser_balls_remaining != null) {
      ballsLeft = g.loser_balls_remaining
    } else {
      const loserId = g.winner_id === g.player1_id ? g.player2_id : g.player1_id
      const gs = shotsByGame.get(g.id) ?? []
      const loserPotted = gs
        .filter(s => s.player_id === loserId && !s.is_error)
        .reduce((sum, s) => sum + ((s as any).balls_potted ?? (s.potted ? 1 : 0)), 0)
      ballsLeft = Math.max(0, 7 - loserPotted)
    }
    if (biggestMarginWinner === null || ballsLeft > biggestMarginBalls) {
      biggestMarginBalls = ballsLeft
      biggestMarginWinner = wu
    }
  }

  // Best break win rate (minimum 1 break to qualify)
  const bestBreakWinRatePlayer = PLAYERS
    .filter(u => breakAdvantage[u].broke >= 1)
    .reduce<PlayerUsername | null>((best, u) => {
      if (!best) return u
      const rate = breakAdvantage[u].wonAfterBreak / breakAdvantage[u].broke
      const bestRate = breakAdvantage[best].wonAfterBreak / breakAdvantage[best].broke
      return rate > bestRate ? u : best
    }, null)

  // Podium order: 2nd left · 1st centre · 3rd right
  const podium     = [standings[1], standings[0], standings[2]].filter(Boolean)
  const podiumRank = [2, 1, 3] as const

  const chartTooltipStyle = {
    contentStyle: { background: '#1a2018', border: '1px solid #2e3a2b', borderRadius: 8, fontFamily: 'Inter', fontSize: 12 },
    labelStyle:   { color: '#c8c4b5', marginBottom: 4 },
    itemStyle:    { color: '#c8c4b5' },
  }
  const chartAxisProps = { fill: '#7a786f', fontSize: 10, fontFamily: 'Inter' }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto pb-16 animate-fade-in">

      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <div className="px-4 pt-6 pb-4">
        <p className="font-body text-xs tracking-[0.25em] uppercase text-pool-chalk-dim">Thonara League</p>
        <div className="flex items-baseline justify-between mt-0.5">
          <h1 className="font-heading text-5xl tracking-wider text-pool-chalk">STATS</h1>
          <p className="font-body text-sm text-pool-chalk-dim">{games.length} games · {sessionOrder.length} sessions</p>
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-pool-gold/40 to-transparent" />
      </div>

      {/* ── PODIUM ──────────────────────────────────────────────────── */}
      <section className="px-4 pt-4 pb-2">
        <div className="flex items-end gap-2">
          {podium.map((p, i) => {
            const rank = podiumRank[i]
            const style = PLAYER_STYLES[p.username]
            const podiumH   = rank === 1 ? 72 : rank === 2 ? 52 : 38
            const rankColor = rank === 1 ? '#c9a227' : rank === 2 ? '#8a8a8a' : '#8b5c2a'
            const avatarSz  = rank === 1 ? 60 : 48
            return (
              <div key={p.username} className="flex flex-col items-center flex-1">
                <span className="text-2xl mb-1">{rank === 1 ? '👑' : rank === 2 ? '🥈' : '🥉'}</span>
                <div style={{ filter: `drop-shadow(0 0 10px ${style.color}55)` }}>
                  <PlayerAvatar username={p.username} size={avatarSz} />
                </div>
                <p className="font-heading text-xs tracking-widest mt-2" style={{ color: style.color }}>
                  {style.label.toUpperCase()}
                </p>
                <p className={`font-heading ${rank === 1 ? 'text-4xl' : 'text-3xl'} text-pool-chalk leading-none mt-0.5`}>
                  {p.wins}
                </p>
                <p className="font-body text-xs text-pool-chalk-dim">wins</p>
                <p className="font-body text-xs mt-0.5" style={{ color: style.color }}>
                  {eloRatings[p.username]} ELO
                </p>
                {currentStreaks[p.username] > 1 && (
                  <p className="font-heading text-xs text-pool-gold mt-0.5">🔥 {currentStreaks[p.username]}</p>
                )}
                <div
                  className="w-full mt-3 rounded-t-xl flex items-center justify-center"
                  style={{
                    height: podiumH,
                    background: `linear-gradient(180deg, ${rankColor}22 0%, ${rankColor}08 100%)`,
                    borderTop:   `2px solid ${rankColor}66`,
                    borderLeft:  `1px solid ${rankColor}22`,
                    borderRight: `1px solid ${rankColor}22`,
                  }}
                >
                  <span className="font-heading text-2xl" style={{ color: `${rankColor}55` }}>{rank}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── QUICK STATS ─────────────────────────────────────────────── */}
      <section className="px-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Games',    value: games.length.toString(),     icon: '🎱' },
            { label: 'Accuracy', value: `${overallAcc}%`,            icon: '🎯' },
            { label: 'Shots',    value: totalShots.toLocaleString(), icon: '📊' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-pool-surface rounded-xl border border-pool-border p-3 text-center">
              <p className="text-xl mb-1">{icon}</p>
              <p className="font-heading text-xl text-pool-chalk">{value}</p>
              <p className="font-body text-xs text-pool-chalk-dim">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ACCURACY SHOWDOWN ───────────────────────────────────────── */}
      {totalShots > 0 && (
        <section className="px-4 py-2">
          <SectionHeader title="ACCURACY SHOWDOWN" />
          <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 mt-3 space-y-5">
            {[...PLAYERS]
              .sort((a, b) => pct(playerMap[b].potted, playerMap[b].shots) - pct(playerMap[a].potted, playerMap[a].shots))
              .map((u, i) => {
                const p     = playerMap[u]
                const style = PLAYER_STYLES[u]
                const acc   = pct(p.potted, p.shots)
                return (
                  <div key={u}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <PlayerAvatar username={u} size={28} />
                        <span className="font-heading text-sm tracking-wider" style={{ color: style.color }}>
                          {style.label.toUpperCase()}
                        </span>
                        {i === 0 && <span className="text-xs">👑</span>}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-heading text-2xl text-pool-chalk">{acc}%</span>
                        <span className="font-body text-xs text-pool-chalk-dim">{p.shots} shots</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-pool-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${acc}%`, background: `linear-gradient(90deg, ${style.color}88, ${style.color})` }}
                      />
                    </div>
                    <div className="flex gap-4 mt-1.5">
                      <span className="font-body text-xs text-pool-chalk-dim">
                        Err <span className="text-pool-red">{pct(p.errors, p.shots)}%</span>
                      </span>
                      <span className="font-body text-xs text-pool-chalk-dim">
                        Lucky <span className="text-pool-gold">{pct(p.lucky, p.shots)}%</span>
                      </span>
                      <span className="font-body text-xs text-pool-chalk-dim">
                        {p.potted} pots · {p.gamesPlayed > 0 ? (p.potted / p.gamesPlayed).toFixed(1) : '—'}/game
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>
      )}

      {/* ── HEAD TO HEAD ────────────────────────────────────────────── */}
      <section className="px-4 py-2">
        <SectionHeader title="HEAD TO HEAD" />
        <div className="mt-3 space-y-3">
          {PLAYERS.flatMap((u, i) => PLAYERS.slice(i + 1).map(v => {
            const uWins  = h2h[u][v] ?? 0
            const vWins  = h2h[v][u] ?? 0
            const total  = uWins + vWins
            const uPct   = total === 0 ? 50 : Math.round((uWins / total) * 100)
            const uStyle = PLAYER_STYLES[u]
            const vStyle = PLAYER_STYLES[v]
            const leader = uWins > vWins ? uStyle.label : vWins > uWins ? vStyle.label : null
            return (
              <div key={`${u}-${v}`} className="bg-pool-surface rounded-2xl border border-pool-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PlayerAvatar username={u} size={32} />
                    <span className="font-heading text-sm" style={{ color: uStyle.color }}>{uStyle.label}</span>
                  </div>
                  <div className="text-center">
                    <p className="font-heading text-2xl text-pool-chalk">{uWins}–{vWins}</p>
                    <p className="font-body text-xs text-pool-chalk-dim">
                      {leader ? `${leader} leads` : total > 0 ? 'Tied' : 'No games yet'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-sm" style={{ color: vStyle.color }}>{vStyle.label}</span>
                    <PlayerAvatar username={v} size={32} />
                  </div>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden bg-pool-border flex">
                  <div className="h-full transition-all duration-700" style={{ width: `${uPct}%`, backgroundColor: uStyle.color }} />
                  <div className="h-full flex-1" style={{ backgroundColor: vStyle.color }} />
                </div>
              </div>
            )
          }))}
        </div>
      </section>

      {/* ── RECORDS ─────────────────────────────────────────────────── */}
      <section className="px-4 py-2">
        <SectionHeader title="RECORDS" />
        <div className="grid grid-cols-2 gap-2 mt-3">
          {recordAccuracy[bestAccPlayer] > 0 && (
            <RecordCard icon="🎯" label="Peak Accuracy" username={bestAccPlayer}
              value={`${recordAccuracy[bestAccPlayer]}%`} sub="best single game" />
          )}
          {recordPots[mostPotsPlayer] > 0 && (
            <RecordCard icon="💥" label="Most Pots" username={mostPotsPlayer}
              value={recordPots[mostPotsPlayer].toString()} sub="in a single game" />
          )}
          {bestStreak.streak > 1 && (
            <RecordCard icon="🔥" label="Win Streak" username={bestStreak.username}
              value={`${bestStreak.streak} in a row`} sub="all-time best" />
          )}
          {playerMap[mostBlackPlayer].blackBallIncidents > 0 && (
            <RecordCard icon="🖤" label="Gifted Wins" username={mostBlackPlayer}
              value={`${playerMap[mostBlackPlayer].blackBallIncidents}×`} sub="potted the black" />
          )}
          <RecordCard icon="🎱" label="Best Break" username={bestBreakPlayer}
            value={breakStats[bestBreakPlayer].best > 0 ? `${breakStats[bestBreakPlayer].best} ball${breakStats[bestBreakPlayer].best !== 1 ? 's' : ''}` : '—'}
            sub="most pots on a single break" />
          {biggestMarginWinner && (
            <RecordCard icon="💪" label="Biggest Win" username={biggestMarginWinner}
              value={biggestMarginBalls > 0 ? `${biggestMarginBalls} left` : '—'}
              sub="opponent balls still on table" />
          )}
          {bestBreakWinRatePlayer && (
            <RecordCard icon="🔨" label="Break King" username={bestBreakWinRatePlayer}
              value={`${Math.round((breakAdvantage[bestBreakWinRatePlayer].wonAfterBreak / breakAdvantage[bestBreakWinRatePlayer].broke) * 100)}%`}
              sub={`wins after breaking · ${breakAdvantage[bestBreakWinRatePlayer].broke} breaks`} />
          )}
        </div>
      </section>

      {/* ── ELO RATINGS ─────────────────────────────────────────────── */}
      {eloAtSession.length > 0 && (
        <section className="px-4 py-2">
          <SectionHeader title="ELO RATINGS" sub="K=32, starts at 1200" />
          <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 mt-3">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {PLAYERS.map(u => {
                const style = PLAYER_STYLES[u]
                const delta = eloRatings[u] - 1200
                return (
                  <div key={u} className="text-center">
                    <p className="font-heading text-2xl" style={{ color: style.color }}>{eloRatings[u]}</p>
                    <p className="font-body text-xs text-pool-chalk-dim">{style.label}</p>
                    <p className={`font-body text-xs mt-0.5 ${delta >= 0 ? 'text-pool-green-bright' : 'text-pool-red'}`}>
                      {delta >= 0 ? '+' : ''}{delta}
                    </p>
                  </div>
                )
              })}
            </div>
            {eloAtSession.length > 1 ? (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={eloAtSession} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                  <XAxis dataKey="label" tick={chartAxisProps} axisLine={false} tickLine={false} />
                  <YAxis tick={chartAxisProps} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip {...chartTooltipStyle} />
                  {PLAYERS.map(u => (
                    <Line key={u} type="monotone" dataKey={u} name={PLAYER_STYLES[u].label}
                      stroke={COLORS[u]} strokeWidth={2.5} dot={{ r: 3, fill: COLORS[u] }} activeDot={{ r: 5 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="font-body text-xs text-pool-chalk-dim text-center">Play more sessions to see the trend</p>
            )}
          </div>
        </section>
      )}

      {/* ── POINTS RACE ─────────────────────────────────────────────── */}
      {timelineData.length > 1 && (
        <section className="px-4 py-2">
          <SectionHeader title="POINTS RACE" />
          <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 mt-3">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={timelineData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="label" tick={chartAxisProps} axisLine={false} tickLine={false} />
                <YAxis tick={chartAxisProps} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...chartTooltipStyle} />
                {PLAYERS.map(u => (
                  <Line key={u} type="monotone" dataKey={u} name={PLAYER_STYLES[u].label}
                    stroke={COLORS[u]} strokeWidth={2.5} dot={{ r: 3, fill: COLORS[u] }} activeDot={{ r: 5 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ── ACCURACY OVER TIME ──────────────────────────────────────── */}
      {accuracyTrend.length > 1 && totalShots > 0 && (
        <section className="px-4 py-2">
          <SectionHeader title="ACCURACY OVER TIME" />
          <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 mt-3">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={accuracyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="label" tick={chartAxisProps} axisLine={false} tickLine={false} />
                <YAxis tick={chartAxisProps} axisLine={false} tickLine={false} unit="%" domain={[25, 75]} />
                <Tooltip {...chartTooltipStyle} formatter={(v: number) => [`${v}%`]} />
                {PLAYERS.map(u => (
                  <Line key={u} type="monotone" dataKey={u} name={PLAYER_STYLES[u].label}
                    stroke={COLORS[u]} strokeWidth={2.5} dot={{ r: 3, fill: COLORS[u] }} activeDot={{ r: 5 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ── WINS BY GAME SLOT ───────────────────────────────────────── */}
      <section className="px-4 py-2">
        <SectionHeader title="WINS BY GAME SLOT" sub="who owns each position" />
        <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 mt-3">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={gameNumData} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="game" tick={chartAxisProps} axisLine={false} tickLine={false} />
              <YAxis tick={chartAxisProps} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...chartTooltipStyle} />
              {PLAYERS.map(u => (
                <Bar key={u} dataKey={u} name={PLAYER_STYLES[u].label} fill={COLORS[u]} radius={[3,3,0,0]} stackId="a" />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── GAME DURATION ───────────────────────────────────────────── */}
      {avgDuration != null && (
        <section className="px-4 py-2">
          <SectionHeader title="GAME DURATION" />
          <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 mt-3">
            <div className="grid grid-cols-3 divide-x divide-pool-border">
              <div className="text-center px-2">
                <p className="font-body text-xs text-pool-chalk-dim mb-1">Average</p>
                <p className="font-heading text-xl text-pool-chalk tabular-nums">{formatTime(avgDuration)}</p>
              </div>
              <div className="text-center px-2">
                <p className="font-body text-xs text-pool-chalk-dim mb-1">Fastest</p>
                <p className="font-heading text-xl text-pool-green-bright tabular-nums">{minDuration != null ? formatTime(minDuration) : '—'}</p>
              </div>
              <div className="text-center px-2">
                <p className="font-body text-xs text-pool-chalk-dim mb-1">Longest</p>
                <p className="font-heading text-xl text-pool-gold tabular-nums">{maxDuration != null ? formatTime(maxDuration) : '—'}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── BALL COLORS ─────────────────────────────────────────────── */}
      {hasColorData && (
        <section className="px-4 py-2">
          <SectionHeader title="BALL COLORS" sub="pots by colour" />
          <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 mt-3 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-3 h-3 rounded-full bg-yellow-400 shrink-0" />
                <span className="font-body text-sm text-pool-chalk-dim">Yellows</span>
                <span className="font-heading text-xl text-pool-chalk ml-auto">{totalYellows}</span>
              </div>
              <div className="w-px h-6 bg-pool-border shrink-0" />
              <div className="flex items-center gap-2 flex-1">
                <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                <span className="font-body text-sm text-pool-chalk-dim">Reds</span>
                <span className="font-heading text-xl text-pool-chalk ml-auto">{totalReds}</span>
              </div>
            </div>
            <div className="h-2 bg-pool-border rounded-full overflow-hidden flex">
              <div className="h-full bg-yellow-400 transition-all duration-700"
                style={{ width: `${Math.round((totalYellows / (totalYellows + totalReds)) * 100)}%` }} />
              <div className="h-full flex-1 bg-red-500" />
            </div>
            <div className="space-y-3 pt-1">
              {PLAYERS.map(u => {
                const bc = ballColorStats[u]
                const total = bc.yellows + bc.reds
                if (total === 0) return null
                const style = PLAYER_STYLES[u]
                const favYellow = bc.yellows >= bc.reds
                return (
                  <div key={u}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <PlayerAvatar username={u} size={22} />
                      <span className="font-heading text-xs tracking-wider" style={{ color: style.color }}>
                        {style.label.toUpperCase()}
                      </span>
                      <span className="ml-auto font-body text-xs text-pool-chalk-dim flex items-center gap-1.5">
                        Fav:
                        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: favYellow ? '#facc15' : '#ef4444' }} />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-body text-xs text-yellow-400 w-10">{bc.yellows} 🟡</span>
                      <div className="flex-1 h-1.5 bg-pool-border rounded-full overflow-hidden flex">
                        {total > 0 && (
                          <div className="h-full bg-yellow-400" style={{ width: `${Math.round((bc.yellows / total) * 100)}%` }} />
                        )}
                        <div className="h-full flex-1 bg-red-500" />
                      </div>
                      <span className="font-body text-xs text-red-400 w-10 text-right">{bc.reds} 🔴</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── BREAK ADVANTAGE ─────────────────────────────────────────── */}
      {hasBreakAdvantageData && (
        <section className="px-4 py-2">
          <SectionHeader title="BREAK ADVANTAGE" sub="win rate when you break" />
          <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 mt-3 space-y-3">
            {PLAYERS.map(u => {
              const ba = breakAdvantage[u]
              if (ba.broke === 0) return null
              const style = PLAYER_STYLES[u]
              const pct = Math.round((ba.wonAfterBreak / ba.broke) * 100)
              return (
                <div key={u} className="flex items-center gap-3">
                  <PlayerAvatar username={u} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading text-xs tracking-wider" style={{ color: style.color }}>{style.label.toUpperCase()}</span>
                      <span className="font-body text-xs text-pool-chalk-dim">{ba.wonAfterBreak}W / {ba.broke} breaks</span>
                    </div>
                    <div className="h-1.5 bg-pool-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: style.color }} />
                    </div>
                  </div>
                  <span className="font-heading text-xl text-pool-chalk tabular-nums w-12 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── COLOUR ADVANTAGE ─────────────────────────────────────────── */}
      {hasColorWinData && (
        <section className="px-4 py-2">
          <SectionHeader title="COLOUR ADVANTAGE" sub="win rate by colour" />
          <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 mt-3 space-y-4">
            {PLAYERS.map(u => {
              const cw = colorWins[u]
              if (cw.yG + cw.rG === 0) return null
              const style = PLAYER_STYLES[u]
              const yPct = cw.yG > 0 ? Math.round((cw.yW / cw.yG) * 100) : null
              const rPct = cw.rG > 0 ? Math.round((cw.rW / cw.rG) * 100) : null
              return (
                <div key={u}>
                  <div className="flex items-center gap-2 mb-2">
                    <PlayerAvatar username={u} size={22} />
                    <span className="font-heading text-xs tracking-wider" style={{ color: style.color }}>{style.label.toUpperCase()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-pool-bg rounded-xl p-3 border border-pool-border">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
                        <span className="font-body text-xs text-pool-chalk-dim">Yellow</span>
                      </div>
                      <p className="font-heading text-xl text-pool-chalk">{yPct !== null ? `${yPct}%` : '—'}</p>
                      <p className="font-body text-[10px] text-pool-chalk-dim">{cw.yW}W · {cw.yG - cw.yW}L</p>
                    </div>
                    <div className="bg-pool-bg rounded-xl p-3 border border-pool-border">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                        <span className="font-body text-xs text-pool-chalk-dim">Red</span>
                      </div>
                      <p className="font-heading text-xl text-pool-chalk">{rPct !== null ? `${rPct}%` : '—'}</p>
                      <p className="font-body text-[10px] text-pool-chalk-dim">{cw.rW}W · {cw.rG - cw.rW}L</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── MARGIN OF VICTORY ───────────────────────────────────────── */}
      {hasMarginData && (
        <section className="px-4 py-2">
          <SectionHeader title="MARGIN OF VICTORY" sub="avg balls left for loser" />
          <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 mt-3">
            <div className="grid grid-cols-3 divide-x divide-pool-border">
              {PLAYERS.filter(u => marginData[u].count > 0).map(u => {
                const md = marginData[u]
                const style = PLAYER_STYLES[u]
                const avg = (md.total / md.count).toFixed(1)
                return (
                  <div key={u} className="text-center px-3">
                    <div className="flex justify-center mb-1"><PlayerAvatar username={u} size={32} /></div>
                    <p className="font-heading text-2xl text-pool-chalk">{avg}</p>
                    <p className="font-body text-[10px]" style={{ color: style.color }}>{style.label}</p>
                    <p className="font-body text-[10px] text-pool-chalk-dim">{md.count} wins</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── FUN FACTS ───────────────────────────────────────────────── */}
      <section className="px-4 py-2">
        <SectionHeader title="FUN FACTS" />
        <div className="bg-pool-surface rounded-2xl border border-pool-border overflow-hidden mt-3">
          <Fact label="Overall pot accuracy" value={`${overallAcc}%`} icon="🎯" />
          <Fact label="Total shots recorded" value={totalShots.toLocaleString()} icon="📊" />
          <Fact label="Total games played" value={games.length.toString()} icon="🎱" />
          {bestStreak.streak > 1 && (
            <Fact label={`${PLAYER_STYLES[bestStreak.username].label}'s best win streak`} value={`${bestStreak.streak} in a row`} icon="🔥" />
          )}
          {PLAYERS.map(u => {
            const p = playerMap[u]
            if (p.blackBallIncidents === 0) return null
            return <Fact key={u} label={`${p.displayName} potted the black on themselves`} value={`${p.blackBallIncidents}×`} icon="🖤" />
          })}
          {PLAYERS.map(u => {
            const p = playerMap[u]
            if (p.lucky === 0) return null
            return <Fact key={u} label={`${p.displayName} fluked a pot`} value={`${p.lucky} times`} icon="★" />
          })}
        </div>
      </section>

    </div>
  )
}

// ── Shared helper components ─────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="font-heading text-sm tracking-[0.15em] text-pool-chalk shrink-0">{title}</h2>
      {sub && <p className="font-body text-xs text-pool-chalk-dim shrink-0">{sub}</p>}
      <div className="flex-1 h-px bg-pool-border" />
    </div>
  )
}

function RecordCard({ icon, label, username, value, sub }: {
  icon: string; label: string; username: PlayerUsername; value: string; sub: string
}) {
  const style = PLAYER_STYLES[username]
  return (
    <div className="bg-pool-surface rounded-xl border p-3" style={{ borderColor: `${style.color}33` }}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xl">{icon}</span>
        <span className="font-heading text-xs tracking-wider" style={{ color: style.color }}>
          {style.label.toUpperCase()}
        </span>
      </div>
      <p className="font-heading text-xl text-pool-chalk">{value}</p>
      <p className="font-body text-xs text-pool-chalk-dim mt-0.5">{label}</p>
      <p className="font-body text-xs mt-0.5" style={{ color: `${style.color}88` }}>{sub}</p>
    </div>
  )
}

function Fact({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-pool-border last:border-0">
      <span className="text-lg w-7">{icon}</span>
      <span className="font-body text-sm text-pool-chalk-dim flex-1">{label}</span>
      <span className="font-heading text-base text-pool-chalk">{value}</span>
    </div>
  )
}
