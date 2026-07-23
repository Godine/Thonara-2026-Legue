'use client'

import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts'
import { PLAYER_STYLES, PLAYERS, type PlayerUsername } from '@/lib/game-config'
import PlayerAvatar from '@/components/PlayerAvatar'

type RawGame = {
  id: string
  session_id: string
  player1_id: string
  player2_id: string
  winner_id: string | null
  player1: { id: string; username: string }
  player2: { id: string; username: string }
  session: { id: string; date: string }
}

type RawShot = {
  id: string
  game_id: string
  player_id: string
  potted: boolean
}

const TOTAL_GAMES = 100
const RECENT_SESSIONS = 5

const PC: Record<PlayerUsername, string> = {
  adib:   '#f5c518',
  ahmed:  '#60a5fa',
  godine: '#f87171',
}

export default function PredictionsClient({ games, shots }: { games: RawGame[]; shots: RawShot[] }) {
  const model = useMemo(() => {
    // ID → username
    const idToUser = new Map<string, PlayerUsername>()
    for (const g of games) {
      idToUser.set(g.player1.id, g.player1.username as PlayerUsername)
      idToUser.set(g.player2.id, g.player2.username as PlayerUsername)
    }

    // Chronological session order
    const sessionOrder: string[] = []
    const seen = new Set<string>()
    for (const g of games) {
      if (!seen.has(g.session_id)) { seen.add(g.session_id); sessionOrder.push(g.session_id) }
    }

    const recentSessions = new Set(sessionOrder.slice(-RECENT_SESSIONS))
    const totalPlayed = games.length
    const remaining = Math.max(0, TOTAL_GAMES - totalPlayed)

    // Current wins + H2H records
    const current: Record<PlayerUsername, number> = { adib: 0, ahmed: 0, godine: 0 }
    const h2h: Record<PlayerUsername, Record<PlayerUsername, number>> = {
      adib:   { adib: 0, ahmed: 0, godine: 0 },
      ahmed:  { adib: 0, ahmed: 0, godine: 0 },
      godine: { adib: 0, ahmed: 0, godine: 0 },
    }
    const rh2h: Record<PlayerUsername, Record<PlayerUsername, number>> = {
      adib:   { adib: 0, ahmed: 0, godine: 0 },
      ahmed:  { adib: 0, ahmed: 0, godine: 0 },
      godine: { adib: 0, ahmed: 0, godine: 0 },
    }

    for (const g of games) {
      if (!g.winner_id) continue
      const wu = idToUser.get(g.winner_id)
      if (!wu) continue
      const lu = (wu === g.player1.username ? g.player2.username : g.player1.username) as PlayerUsername
      current[wu]++
      h2h[wu][lu]++
      if (recentSessions.has(g.session_id)) rh2h[wu][lu]++
    }

    // Shot accuracy (all-time)
    const acc: Record<PlayerUsername, { shots: number; potted: number }> = {
      adib:   { shots: 0, potted: 0 },
      ahmed:  { shots: 0, potted: 0 },
      godine: { shots: 0, potted: 0 },
    }
    for (const s of shots) {
      const pu = idToUser.get(s.player_id)
      if (!pu) continue
      acc[pu].shots++
      if (s.potted) acc[pu].potted++
    }

    // Blended win probability: A beats B
    // Weights: 30% all-time H2H, 40% recent form (last 5 sessions), 30% accuracy
    const wp = (a: PlayerUsername, b: PlayerUsername): number => {
      const ha = h2h[a][b], hb = h2h[b][a]
      const atProb = ha + hb > 0 ? ha / (ha + hb) : 0.5

      const ra = rh2h[a][b], rb = rh2h[b][a]
      const recentProb = ra + rb > 0 ? ra / (ra + rb) : atProb

      const accA = acc[a].shots > 0 ? acc[a].potted / acc[a].shots : 0
      const accB = acc[b].shots > 0 ? acc[b].potted / acc[b].shots : 0
      const accProb = accA + accB > 0 ? accA / (accA + accB) : 0.5

      return 0.30 * atProb + 0.40 * recentProb + 0.30 * accProb
    }

    const pAA = wp('adib', 'ahmed')
    const pAG = wp('adib', 'godine')
    const pHG = wp('ahmed', 'godine')

    // Project remaining games (equal split across 3 pairs in round-robin)
    const gpp = remaining / 3
    const extra: Record<PlayerUsername, number> = { adib: 0, ahmed: 0, godine: 0 }
    extra.adib   += gpp * pAA;  extra.ahmed  += gpp * (1 - pAA)
    extra.adib   += gpp * pAG;  extra.godine += gpp * (1 - pAG)
    extra.ahmed  += gpp * pHG;  extra.godine += gpp * (1 - pHG)

    const projected: Record<PlayerUsername, number> = {
      adib:   current.adib   + extra.adib,
      ahmed:  current.ahmed  + extra.ahmed,
      godine: current.godine + extra.godine,
    }

    // Chart data — cumulative wins per session + projected endpoint
    type ChartPoint = {
      games: number; label: string
      adib?: number | null; ahmed?: number | null; godine?: number | null
      adib_p?: number | null; ahmed_p?: number | null; godine_p?: number | null
    }
    const cumW: Record<PlayerUsername, number> = { adib: 0, ahmed: 0, godine: 0 }
    let runGames = 0
    const chartData: ChartPoint[] = [
      { games: 0, label: 'Start', adib: 0, ahmed: 0, godine: 0, adib_p: null, ahmed_p: null, godine_p: null },
    ]

    for (let i = 0; i < sessionOrder.length; i++) {
      const sid = sessionOrder[i]
      const sg = games.filter(g => g.session_id === sid)
      for (const g of sg) {
        if (g.winner_id) {
          const wu = idToUser.get(g.winner_id)
          if (wu) cumW[wu]++
        }
      }
      runGames += sg.length
      chartData.push({
        games: runGames,
        label: `S${i + 1}`,
        adib: cumW.adib, ahmed: cumW.ahmed, godine: cumW.godine,
        adib_p: null, ahmed_p: null, godine_p: null,
      })
    }

    // Current point doubles as start of projection
    const last = chartData[chartData.length - 1]
    last.adib_p = last.adib; last.ahmed_p = last.ahmed; last.godine_p = last.godine

    // Projected endpoint at game 100
    if (remaining > 0) {
      chartData.push({
        games: TOTAL_GAMES,
        label: 'Game 100',
        adib: null, ahmed: null, godine: null,
        adib_p: Math.round(projected.adib),
        ahmed_p: Math.round(projected.ahmed),
        godine_p: Math.round(projected.godine),
      })
    }

    const ranked = PLAYERS.slice().sort((a, b) => projected[b] - projected[a])

    return { totalPlayed, remaining, current, projected, h2h, rh2h, pAA, pAG, pHG, chartData, ranked }
  }, [games, shots])

  const { totalPlayed, remaining, current, projected, h2h, rh2h, pAA, pAG, pHG, chartData, ranked } = model
  const progressPct = Math.min(100, Math.round((totalPlayed / TOTAL_GAMES) * 100))
  const champion = ranked[0]

  const podiumSlots = [
    { u: ranked[1], rank: 2, emoji: '🥈', barH: 'h-20' },
    { u: ranked[0], rank: 1, emoji: '🥇', barH: 'h-32' },
    { u: ranked[2], rank: 3, emoji: '🥉', barH: 'h-12' },
  ]

  const matchups = [
    { a: 'adib' as PlayerUsername,  b: 'ahmed' as PlayerUsername,  prob: pAA },
    { a: 'adib' as PlayerUsername,  b: 'godine' as PlayerUsername, prob: pAG },
    { a: 'ahmed' as PlayerUsername, b: 'godine' as PlayerUsername, prob: pHG },
  ]

  return (
    <div className="min-h-screen bg-pool-bg text-pool-chalk pb-24">

      {/* ── Header ── */}
      <div className="px-4 pt-20 pb-4">
        <p className="font-heading text-4xl tracking-widest text-pool-gold">🔮 PREDICTIONS</p>
        <p className="font-body text-sm text-pool-chalk-dim mt-1">Who wins the 100-game challenge?</p>
      </div>

      {/* ── Progress bar ── */}
      <div className="px-4 mb-5">
        <div className="bg-pool-surface border border-pool-border rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-body text-sm text-pool-chalk-dim">Challenge progress</span>
            <span className="font-heading text-xl text-pool-gold">{totalPlayed} / {TOTAL_GAMES}</span>
          </div>
          <div className="h-3 bg-pool-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-pool-gold rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="font-body text-xs text-pool-chalk-dim">{progressPct}% complete</span>
            <span className="font-body text-xs text-pool-chalk-dim">{remaining} games to go</span>
          </div>
        </div>
      </div>

      {/* ── Predicted champion hero ── */}
      <div className="px-4 mb-5">
        <div className="bg-pool-surface border border-pool-border rounded-xl p-5 text-center">
          <p className="font-body text-xs text-pool-chalk-dim uppercase tracking-widest mb-3">Predicted Champion</p>
          <div className="flex justify-center mb-3">
            <div className="relative inline-block">
              <PlayerAvatar username={champion} size={72} />
              <span className="absolute -top-1 -right-2 text-2xl leading-none">🏆</span>
            </div>
          </div>
          <p className="font-heading text-3xl" style={{ color: PC[champion] }}>
            {PLAYER_STYLES[champion].label}
          </p>
          <p className="font-body text-pool-chalk-dim text-sm mt-1.5">
            Projected{' '}
            <span className="font-heading text-2xl text-pool-chalk">~{Math.round(projected[champion])}</span>
            {' '}wins at game 100
          </p>
          <p className="font-body text-xs text-pool-chalk-dim mt-1">
            {current[champion]} wins now · +{Math.round(projected[champion] - current[champion])} expected from {remaining} remaining
          </p>
        </div>
      </div>

      {/* ── Projection chart ── */}
      <div className="px-4 mb-5">
        <div className="bg-pool-surface border border-pool-border rounded-xl p-4">
          <p className="font-heading text-sm tracking-widest text-pool-chalk-dim mb-4">WINS RACE TO 100</p>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={chartData} margin={{ top: 5, right: 16, bottom: 0, left: -14 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f3525" />
              <XAxis
                dataKey="games"
                type="number"
                domain={[0, TOTAL_GAMES]}
                ticks={[0, 25, 50, 75, 100]}
                stroke="#7a786f"
                tick={{ fontSize: 10, fill: '#7a786f' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v === TOTAL_GAMES ? '100🎯' : String(v)}
              />
              <YAxis
                stroke="#7a786f"
                tick={{ fontSize: 10, fill: '#7a786f' }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <ReTooltip
                contentStyle={{
                  background: '#0e1e12',
                  border: '1px solid #1f3525',
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: 'inherit',
                }}
                labelFormatter={(v) =>
                  v === TOTAL_GAMES ? '🎯 Game 100 (projected)' : `Game ${v}`
                }
                formatter={(value, name) => {
                  const base = (name as string).replace('_p', '') as PlayerUsername
                  const isProj = (name as string).endsWith('_p')
                  return [
                    `${Math.round(value as number)} wins${isProj ? ' (proj.)' : ''}`,
                    PLAYER_STYLES[base]?.label ?? String(name),
                  ]
                }}
              />
              <ReferenceLine
                x={totalPlayed}
                stroke="#c9a22760"
                strokeDasharray="4 2"
                label={{ value: 'now', position: 'insideTopRight', fontSize: 9, fill: '#c9a227', dy: 2 }}
              />
              {/* Actual lines */}
              {PLAYERS.map(u => (
                <Line
                  key={u}
                  type="monotone"
                  dataKey={u}
                  stroke={PC[u]}
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
              {/* Projected lines (dashed) */}
              {PLAYERS.map(u => (
                <Line
                  key={`${u}_p`}
                  type="monotone"
                  dataKey={`${u}_p`}
                  stroke={PC[u]}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                  opacity={0.6}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex gap-4 mt-2 justify-center flex-wrap">
            {PLAYERS.map(u => (
              <div key={u} className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded" style={{ background: PC[u] }} />
                <span className="font-body text-xs text-pool-chalk-dim">{PLAYER_STYLES[u].label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <svg width="16" height="4" className="overflow-visible">
                <line x1="0" y1="2" x2="16" y2="2" stroke="#7a786f" strokeWidth="2" strokeDasharray="4 3" />
              </svg>
              <span className="font-body text-xs text-pool-chalk-dim">projected</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Projected podium ── */}
      <div className="px-4 mb-5">
        <div className="bg-pool-surface border border-pool-border rounded-xl p-4">
          <p className="font-heading text-sm tracking-widest text-pool-chalk-dim mb-4">PROJECTED PODIUM AT GAME 100</p>
          <div className="flex items-end justify-center gap-3">
            {podiumSlots.map(({ u, rank, emoji, barH }) => (
              <div key={u} className="flex flex-col items-center">
                <div className="mb-2">
                  <PlayerAvatar username={u} size={rank === 1 ? 60 : 44} />
                </div>
                <div className="text-center mb-2">
                  <div className="text-xl leading-none">{emoji}</div>
                  <div className="font-heading text-sm mt-0.5" style={{ color: PC[u] }}>
                    {PLAYER_STYLES[u].label}
                  </div>
                  <div className="font-heading text-xl text-pool-chalk">~{Math.round(projected[u])}</div>
                  <div className="font-body text-xs text-pool-chalk-dim">{current[u]} now</div>
                </div>
                <div
                  className={`w-20 ${barH} rounded-t-lg`}
                  style={{
                    background: `${PC[u]}18`,
                    border: `1px solid ${PC[u]}45`,
                    borderBottom: 'none',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Matchup odds ── */}
      <div className="px-4 mb-5">
        <div className="bg-pool-surface border border-pool-border rounded-xl p-4">
          <p className="font-heading text-sm tracking-widest text-pool-chalk-dim mb-4">MATCHUP ODDS</p>
          <div className="flex flex-col gap-3">
            {matchups.map(({ a, b, prob }) => {
              const pA = Math.round(prob * 100)
              const pB = 100 - pA
              const ha = h2h[a][b], hb = h2h[b][a]
              const ra = rh2h[a][b], rb = rh2h[b][a]
              const accA = Math.round((ra + ha) > 0 ? (ha / (ha + hb)) * 100 : 50)
              return (
                <div key={`${a}-${b}`} className="bg-pool-bg rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <PlayerAvatar username={a} size={22} />
                      <span className="font-body text-sm font-medium" style={{ color: PC[a] }}>
                        {PLAYER_STYLES[a].label}
                      </span>
                    </div>
                    <span className="font-body text-xs text-pool-chalk-dim">vs</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-body text-sm font-medium" style={{ color: PC[b] }}>
                        {PLAYER_STYLES[b].label}
                      </span>
                      <PlayerAvatar username={b} size={22} />
                    </div>
                  </div>
                  {/* Win-probability bar */}
                  <div className="flex h-2 rounded-full overflow-hidden mb-2">
                    <div style={{ width: `${pA}%`, background: PC[a] }} />
                    <div style={{ width: `${pB}%`, background: PC[b] }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-heading text-sm" style={{ color: PC[a] }}>{pA}%</span>
                    <div className="flex gap-3">
                      <span className="font-body text-xs text-pool-chalk-dim">H2H {ha}–{hb}</span>
                      <span className="font-body text-xs text-pool-chalk-dim">Recent {ra}–{rb}</span>
                    </div>
                    <span className="font-heading text-sm" style={{ color: PC[b] }}>{pB}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Methodology ── */}
      <div className="px-4 mb-5">
        <div className="bg-pool-surface border border-pool-border rounded-xl p-4">
          <p className="font-heading text-sm tracking-widest text-pool-chalk-dim mb-3">HOW IT&apos;S CALCULATED</p>
          <div className="flex flex-col gap-3">
            {[
              { icon: '📊', label: 'All-time head-to-head record',          weight: 30 },
              { icon: '🔥', label: `Recent form (last ${RECENT_SESSIONS} sessions)`, weight: 40 },
              { icon: '🎯', label: 'Shot accuracy advantage',                weight: 30 },
            ].map(({ icon, label, weight }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-lg leading-none">{icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-body text-xs text-pool-chalk-dim">{label}</span>
                    <span className="font-body text-xs text-pool-gold">{weight}%</span>
                  </div>
                  <div className="h-1 bg-pool-bg rounded-full overflow-hidden">
                    <div className="h-full bg-pool-gold rounded-full" style={{ width: `${weight}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="font-body text-xs text-pool-chalk-dim mt-4 leading-relaxed">
            Projections update live after every game. With {remaining} games left, expect ±3–5 wins variance in the final standings.
          </p>
        </div>
      </div>

    </div>
  )
}
