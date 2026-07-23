'use client'

import { useState, useMemo } from 'react'
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

const DEFAULT_TOTAL = 100
const MC_RUNS = 5000

const PC: Record<PlayerUsername, string> = {
  adib:   '#f5c518',
  ahmed:  '#60a5fa',
  godine: '#f87171',
}

// Preset scenarios — each overrides the three matchup win-probability sliders
const SCENARIOS = [
  { id: 'equal', label: 'All Equal',     icon: '⚖️', aa: 50, ag: 50, hg: 50 },
  { id: 'adib',  label: 'Adib rules',   icon: '🟡', aa: 70, ag: 70, hg: 50 },
  { id: 'ahmed', label: 'Ahmed rules',  icon: '🔵', aa: 30, ag: 50, hg: 70 },
  { id: 'amine', label: 'Amine rules',  icon: '🔴', aa: 50, ag: 30, hg: 30 },
] as const

// ─── Slider ──────────────────────────────────────────────────────────────────

function SimSlider({
  value, onChange, color, min = 0, max = 100, step = 1,
}: {
  value: number
  onChange: (v: number) => void
  color: string
  min?: number
  max?: number
  step?: number
}) {
  const fill = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
      style={{
        accentColor: color,
        background: `linear-gradient(to right, ${color} ${fill}%, #1a4731 ${fill}%)`,
      }}
    />
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PredictionsClient({ games, shots }: { games: RawGame[]; shots: RawShot[] }) {

  // ── Model (expensive, runs once per data change) ─────────────────────────
  const model = useMemo(() => {
    const idToUser = new Map<string, PlayerUsername>()
    for (const g of games) {
      idToUser.set(g.player1.id, g.player1.username as PlayerUsername)
      idToUser.set(g.player2.id, g.player2.username as PlayerUsername)
    }

    const sessionOrder: string[] = []
    const seen = new Set<string>()
    for (const g of games) {
      if (!seen.has(g.session_id)) { seen.add(g.session_id); sessionOrder.push(g.session_id) }
    }

    const RECENT_N = 5
    const recentSessions = new Set(sessionOrder.slice(-RECENT_N))
    const totalPlayed = games.length

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

    const modelProb = (a: PlayerUsername, b: PlayerUsername, wAt: number, wRe: number, wAc: number): number => {
      const ha = h2h[a][b], hb = h2h[b][a]
      const atP = ha + hb > 0 ? ha / (ha + hb) : 0.5
      const ra = rh2h[a][b], rb = rh2h[b][a]
      const reP = ra + rb > 0 ? ra / (ra + rb) : atP
      const accA = acc[a].shots > 0 ? acc[a].potted / acc[a].shots : 0
      const accB = acc[b].shots > 0 ? acc[b].potted / acc[b].shots : 0
      const acP = accA + accB > 0 ? accA / (accA + accB) : 0.5
      const total = wAt + wRe + wAc || 1
      return (wAt * atP + wRe * reP + wAc * acP) / total
    }

    // Historical cumulative wins per session (for chart actual lines)
    type SessionPt = { games: number; label: string; adib: number; ahmed: number; godine: number }
    const sessionPoints: SessionPt[] = [{ games: 0, label: 'Start', adib: 0, ahmed: 0, godine: 0 }]
    const cumW: Record<PlayerUsername, number> = { adib: 0, ahmed: 0, godine: 0 }
    let runGames = 0
    for (let i = 0; i < sessionOrder.length; i++) {
      const sid = sessionOrder[i]
      const sg = games.filter(g => g.session_id === sid)
      for (const g of sg) {
        if (g.winner_id) { const wu = idToUser.get(g.winner_id); if (wu) cumW[wu]++ }
      }
      runGames += sg.length
      sessionPoints.push({ games: runGames, label: `S${i + 1}`, adib: cumW.adib, ahmed: cumW.ahmed, godine: cumW.godine })
    }

    return { totalPlayed, current, h2h, rh2h, sessionPoints, modelProb, RECENT_N }
  }, [games, shots])

  // ── Simulation state ─────────────────────────────────────────────────────
  const [simAAraw, setSimAA] = useState<number | null>(null)
  const [simAGraw, setSimAG] = useState<number | null>(null)
  const [simHGraw, setSimHG] = useState<number | null>(null)
  const [totalTarget, setTotalTarget] = useState(DEFAULT_TOTAL)
  const [wAt, setWAt] = useState(30)
  const [wRe, setWRe] = useState(40)
  const [wAc, setWAc] = useState(30)

  // Model probabilities recomputed with current weight settings
  const modelPAA = useMemo(() => model.modelProb('adib', 'ahmed',  wAt, wRe, wAc), [model, wAt, wRe, wAc])
  const modelPAG = useMemo(() => model.modelProb('adib', 'godine', wAt, wRe, wAc), [model, wAt, wRe, wAc])
  const modelPHG = useMemo(() => model.modelProb('ahmed', 'godine', wAt, wRe, wAc), [model, wAt, wRe, wAc])

  const modelAAr = Math.round(modelPAA * 100)
  const modelAGr = Math.round(modelPAG * 100)
  const modelHGr = Math.round(modelPHG * 100)

  const simAA = simAAraw ?? modelAAr
  const simAG = simAGraw ?? modelAGr
  const simHG = simHGraw ?? modelHGr

  const isSimulating = simAAraw !== null || simAGraw !== null || simHGraw !== null
    || totalTarget !== DEFAULT_TOTAL
    || wAt !== 30 || wRe !== 40 || wAc !== 30

  const activeScenarioId = SCENARIOS.find(s => s.aa === simAA && s.ag === simAG && s.hg === simHG)?.id ?? null

  const effAA = simAA / 100
  const effAG = simAG / 100
  const effHG = simHG / 100

  const effectiveRemaining = Math.max(0, totalTarget - model.totalPlayed)
  const gpp = effectiveRemaining / 3

  // Expected-value projection (deterministic midpoint)
  const projected: Record<PlayerUsername, number> = {
    adib:   model.current.adib   + gpp * effAA + gpp * effAG,
    ahmed:  model.current.ahmed  + gpp * (1 - effAA) + gpp * effHG,
    godine: model.current.godine + gpp * (1 - effAG) + gpp * (1 - effHG),
  }

  // ── Monte Carlo simulation ────────────────────────────────────────────────
  // Runs MC_RUNS simulated seasons to get win-probability and a confidence range.
  const mc = useMemo(() => {
    const remaining = effectiveRemaining
    // pairs: [winner-index-if-rand<p, loser-index, probability]
    const pairs: [number, number, number][] = [
      [0, 1, effAA],
      [0, 2, effAG],
      [1, 2, effHG],
    ]
    const initW = [model.current.adib, model.current.ahmed, model.current.godine]

    const allWins: [number[], number[], number[]] = [[], [], []]
    const challengeWins = [0, 0, 0]

    for (let run = 0; run < MC_RUNS; run++) {
      const w = [initW[0], initW[1], initW[2]]
      for (let g = 0; g < remaining; g++) {
        const [a, b, p] = pairs[g % 3]
        if (Math.random() < p) w[a]++; else w[b]++
      }
      allWins[0].push(w[0])
      allWins[1].push(w[1])
      allWins[2].push(w[2])
      const maxW = Math.max(w[0], w[1], w[2])
      const tied = [0, 1, 2].filter(i => w[i] === maxW)
      for (const ti of tied) challengeWins[ti] += 1 / tied.length
    }

    const result = {} as Record<PlayerUsername, { p25: number; p75: number; winProb: number }>
    PLAYERS.forEach((u, i) => {
      const sorted = allWins[i].slice().sort((a, b) => a - b)
      result[u] = {
        p25: sorted[Math.floor(MC_RUNS * 0.25)],
        p75: sorted[Math.floor(MC_RUNS * 0.75)],
        winProb: Math.round((challengeWins[i] / MC_RUNS) * 100),
      }
    })
    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effAA, effAG, effHG, effectiveRemaining,
      model.current.adib, model.current.ahmed, model.current.godine])

  // Rank by Monte Carlo win probability, break ties by projected wins
  const ranked = PLAYERS.slice().sort((a, b) => {
    const pd = mc[b].winProb - mc[a].winProb
    return pd !== 0 ? pd : projected[b] - projected[a]
  })
  const champion = ranked[0]

  // ── Chart data ──────────────────────────────────────────────────────────
  const chartData = [
    ...model.sessionPoints.map((p, i) => {
      const isLast = i === model.sessionPoints.length - 1
      return { ...p, adib_p: isLast ? p.adib : null, ahmed_p: isLast ? p.ahmed : null, godine_p: isLast ? p.godine : null }
    }),
    ...(effectiveRemaining > 0 ? [{
      games: totalTarget, label: `Game ${totalTarget}`,
      adib: null, ahmed: null, godine: null,
      adib_p: Math.round(projected.adib),
      ahmed_p: Math.round(projected.ahmed),
      godine_p: Math.round(projected.godine),
    }] : []),
  ]

  const progressPct = Math.min(100, Math.round((model.totalPlayed / DEFAULT_TOTAL) * 100))

  const podiumSlots = [
    { u: ranked[1], rank: 2, emoji: '🥈', barH: 'h-20' },
    { u: ranked[0], rank: 1, emoji: '🥇', barH: 'h-32' },
    { u: ranked[2], rank: 3, emoji: '🥉', barH: 'h-12' },
  ]

  const matchups = [
    { a: 'adib'  as PlayerUsername, b: 'ahmed'  as PlayerUsername, simVal: simAA, modelVal: modelAAr, setVal: setSimAA },
    { a: 'adib'  as PlayerUsername, b: 'godine' as PlayerUsername, simVal: simAG, modelVal: modelAGr, setVal: setSimAG },
    { a: 'ahmed' as PlayerUsername, b: 'godine' as PlayerUsername, simVal: simHG, modelVal: modelHGr, setVal: setSimHG },
  ]

  const xTicks = useMemo(() => {
    const base = [0, Math.round(totalTarget * 0.25), Math.round(totalTarget * 0.5), Math.round(totalTarget * 0.75), totalTarget]
    if (Math.abs(model.totalPlayed - base[1]) > 8 && Math.abs(model.totalPlayed - base[2]) > 8 && Math.abs(model.totalPlayed - base[3]) > 8)
      base.splice(base.length - 1, 0, model.totalPlayed)
    return Array.from(new Set(base)).sort((a, b) => a - b)
  }, [totalTarget, model.totalPlayed])

  function resetAll() {
    setSimAA(null); setSimAG(null); setSimHG(null)
    setTotalTarget(DEFAULT_TOTAL)
    setWAt(30); setWRe(40); setWAc(30)
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-pool-bg text-pool-chalk pb-24">

      {/* Header */}
      <div className="px-4 pt-20 pb-4">
        <p className="font-heading text-4xl tracking-widest text-pool-gold">🔮 PREDICTIONS</p>
        <p className="font-body text-sm text-pool-chalk-dim mt-1">Who wins the {totalTarget}-game challenge?</p>
      </div>

      {/* Simulation banner */}
      {isSimulating && (
        <div className="mx-4 mb-4 rounded-xl bg-pool-felt border border-pool-felt-light px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🧪</span>
            <span className="font-body text-sm text-pool-chalk">Simulation active — results are hypothetical</span>
          </div>
          <button onClick={resetAll}
            className="font-body text-xs text-pool-gold border border-pool-gold/50 rounded-lg px-3 py-1 hover:bg-pool-gold/10 transition-colors">
            Reset
          </button>
        </div>
      )}

      {/* Progress */}
      <div className="px-4 mb-5">
        <div className="bg-pool-surface border border-pool-border rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-body text-sm text-pool-chalk-dim">Challenge progress</span>
            <span className="font-heading text-xl text-pool-gold">{model.totalPlayed} / {totalTarget}</span>
          </div>
          <div className="h-3 bg-pool-bg rounded-full overflow-hidden">
            <div className="h-full bg-pool-gold rounded-full" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="font-body text-xs text-pool-chalk-dim">{progressPct}% complete</span>
            <span className="font-body text-xs text-pool-chalk-dim">{effectiveRemaining} games to go</span>
          </div>
        </div>
      </div>

      {/* ── SIMULATE panel ── */}
      <div className="px-4 mb-5">
        <div className="bg-pool-surface border border-pool-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-heading text-sm tracking-widest text-pool-chalk-dim">SIMULATE</p>
              <p className="font-body text-xs text-pool-chalk-dim mt-0.5">Drag to explore different scenarios</p>
            </div>
            {isSimulating && (
              <button onClick={resetAll}
                className="font-body text-xs text-pool-gold border border-pool-gold/50 rounded-lg px-3 py-1.5 hover:bg-pool-gold/10 transition-colors">
                Reset to model
              </button>
            )}
          </div>

          {/* ── Scenario presets ── */}
          <p className="font-body text-xs text-pool-chalk-dim uppercase tracking-wider mb-3">Quick scenarios →</p>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
            {SCENARIOS.map(s => {
              const isActive = activeScenarioId === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => { setSimAA(s.aa); setSimAG(s.ag); setSimHG(s.hg) }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border font-body text-sm transition-colors ${
                    isActive
                      ? 'bg-pool-felt border-pool-felt-light text-pool-chalk'
                      : 'bg-pool-bg border-pool-border text-pool-chalk-dim hover:border-pool-chalk-dim hover:text-pool-chalk'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              )
            })}
          </div>

          {/* Game target */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-body text-xs text-pool-chalk-dim">🎯 Play to game…</span>
              <span className="font-heading text-lg text-pool-chalk">{totalTarget}</span>
            </div>
            <SimSlider value={totalTarget} onChange={setTotalTarget} color="#c9a227"
              min={model.totalPlayed + 6} max={200} step={6} />
            <div className="flex justify-between text-xs text-pool-chalk-dim mt-1">
              <span>{model.totalPlayed + 6}</span>
              <span>200</span>
            </div>
          </div>

          <div className="h-px bg-pool-border mb-5" />

          {/* Per-matchup win probability */}
          <p className="font-body text-xs text-pool-chalk-dim uppercase tracking-wider mb-4">
            Win probability per matchup →
          </p>
          <div className="flex flex-col gap-5">
            {matchups.map(({ a, b, simVal, modelVal, setVal }) => {
              const isDirty = simVal !== modelVal
              return (
                <div key={`${a}-${b}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: PC[a] }} />
                      <span className="font-body text-sm font-medium" style={{ color: PC[a] }}>{PLAYER_STYLES[a].label}</span>
                      <span className="font-body text-xs text-pool-chalk-dim">vs</span>
                      <span className="font-body text-sm font-medium" style={{ color: PC[b] }}>{PLAYER_STYLES[b].label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDirty && (
                        <button onClick={() => setVal(null)}
                          className="font-body text-xs text-pool-chalk-dim hover:text-pool-chalk transition-colors">↩</button>
                      )}
                      <span className="font-body text-xs text-pool-chalk-dim">model: {modelVal}%</span>
                    </div>
                  </div>
                  <SimSlider value={simVal} onChange={v => setVal(v)} color={PC[a]} />
                  <div className="flex justify-between mt-1">
                    <span className="font-heading text-sm" style={{ color: PC[a] }}>{simVal}%</span>
                    <span className="font-heading text-sm" style={{ color: PC[b] }}>{100 - simVal}%</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="h-px bg-pool-border my-5" />

          {/* Model weights */}
          <p className="font-body text-xs text-pool-chalk-dim uppercase tracking-wider mb-4">
            Model weights (affects base probabilities above) →
          </p>
          <div className="flex flex-col gap-4">
            {[
              { icon: '📊', label: 'All-time H2H', val: wAt, set: setWAt, def: 30 },
              { icon: '🔥', label: `Recent form (last ${model.RECENT_N} sessions)`, val: wRe, set: setWRe, def: 40 },
              { icon: '🎯', label: 'Shot accuracy', val: wAc, set: setWAc, def: 30 },
            ].map(({ icon, label, val, set, def }) => {
              const isDirty = val !== def
              const effectivePct = Math.round((val / (wAt + wRe + wAc || 1)) * 100)
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span>{icon}</span>
                      <span className="font-body text-xs text-pool-chalk-dim">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDirty && (
                        <button onClick={() => set(def)}
                          className="font-body text-xs text-pool-chalk-dim hover:text-pool-chalk transition-colors">↩</button>
                      )}
                      <span className="font-body text-xs text-pool-gold">{effectivePct}%</span>
                    </div>
                  </div>
                  <SimSlider value={val} onChange={set} color="#c9a227" min={0} max={100} step={5} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Champion hero ── */}
      <div className="px-4 mb-5">
        <div className="bg-pool-surface border border-pool-border rounded-xl p-5 text-center">
          <p className="font-body text-xs text-pool-chalk-dim uppercase tracking-widest mb-3">
            {isSimulating ? 'Simulated Champion' : 'Predicted Champion'}
          </p>
          <div className="flex justify-center mb-3">
            <div className="relative inline-block">
              <PlayerAvatar username={champion} size={72} />
              <span className="absolute -top-1 -right-2 text-2xl leading-none">🏆</span>
            </div>
          </div>
          <p className="font-heading text-3xl" style={{ color: PC[champion] }}>
            {PLAYER_STYLES[champion].label}
          </p>
          {/* Monte Carlo win probability */}
          <div className="mt-3 mb-1">
            <span className="font-heading text-5xl text-pool-chalk">{mc[champion].winProb}%</span>
          </div>
          <p className="font-body text-sm text-pool-chalk-dim">chance to win the challenge</p>
          <p className="font-body text-xs text-pool-chalk-dim mt-2">
            Projected ~{Math.round(projected[champion])} wins · likely range: {mc[champion].p25}–{mc[champion].p75}
          </p>
          <p className="font-body text-xs text-pool-chalk-dim mt-0.5">
            {model.current[champion]} wins now · +{Math.round(projected[champion] - model.current[champion])} expected from {effectiveRemaining} remaining
          </p>
        </div>
      </div>

      {/* ── Chart ── */}
      <div className="px-4 mb-5">
        <div className="bg-pool-surface border border-pool-border rounded-xl p-4">
          <p className="font-heading text-sm tracking-widest text-pool-chalk-dim mb-4">WINS RACE TO {totalTarget}</p>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={chartData} margin={{ top: 5, right: 16, bottom: 0, left: -14 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f3525" />
              <XAxis dataKey="games" type="number" domain={[0, totalTarget]} ticks={xTicks}
                stroke="#7a786f" tick={{ fontSize: 10, fill: '#7a786f' }} tickLine={false} axisLine={false}
                tickFormatter={(v) => v === totalTarget ? `${v}🎯` : String(v)} />
              <YAxis stroke="#7a786f" tick={{ fontSize: 10, fill: '#7a786f' }} tickLine={false} axisLine={false} width={28} />
              <ReTooltip
                contentStyle={{ background: '#0e1e12', border: '1px solid #1f3525', borderRadius: 8, fontSize: 11, fontFamily: 'inherit' }}
                labelFormatter={(v) => v === totalTarget ? `🎯 Game ${totalTarget} (${isSimulating ? 'simulated' : 'projected'})` : `Game ${v}`}
                formatter={(value, name) => {
                  const base = (name as string).replace('_p', '') as PlayerUsername
                  const isProj = (name as string).endsWith('_p')
                  return [`${Math.round(value as number)} wins${isProj ? (isSimulating ? ' (sim.)' : ' (proj.)') : ''}`, PLAYER_STYLES[base]?.label ?? String(name)]
                }}
              />
              <ReferenceLine x={model.totalPlayed} stroke="#c9a22760" strokeDasharray="4 2"
                label={{ value: 'now', position: 'insideTopRight', fontSize: 9, fill: '#c9a227', dy: 2 }} />
              {PLAYERS.map(u => (
                <Line key={u} type="monotone" dataKey={u} stroke={PC[u]} strokeWidth={2.5}
                  dot={false} connectNulls={false} isAnimationActive={false} />
              ))}
              {PLAYERS.map(u => (
                <Line key={`${u}_p`} type="monotone" dataKey={`${u}_p`} stroke={PC[u]} strokeWidth={2}
                  strokeDasharray="6 4" dot={false} connectNulls={false} isAnimationActive={false} opacity={0.65} />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center flex-wrap">
            {PLAYERS.map(u => (
              <div key={u} className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded" style={{ background: PC[u] }} />
                <span className="font-body text-xs text-pool-chalk-dim">{PLAYER_STYLES[u].label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#7a786f" strokeWidth="2" strokeDasharray="4 3" /></svg>
              <span className="font-body text-xs text-pool-chalk-dim">{isSimulating ? 'simulated' : 'projected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Projected podium ── */}
      <div className="px-4 mb-5">
        <div className="bg-pool-surface border border-pool-border rounded-xl p-4">
          <p className="font-heading text-sm tracking-widest text-pool-chalk-dim mb-4">
            {isSimulating ? 'SIMULATED' : 'PROJECTED'} PODIUM AT GAME {totalTarget}
          </p>
          <div className="flex items-end justify-center gap-3">
            {podiumSlots.map(({ u, rank, emoji, barH }) => (
              <div key={u} className="flex flex-col items-center">
                <div className="mb-2">
                  <PlayerAvatar username={u} size={rank === 1 ? 60 : 44} />
                </div>
                <div className="text-center mb-2">
                  <div className="text-xl leading-none">{emoji}</div>
                  <div className="font-heading text-sm mt-0.5" style={{ color: PC[u] }}>{PLAYER_STYLES[u].label}</div>
                  {/* Win probability is the headline number */}
                  <div className="font-heading text-2xl text-pool-chalk">{mc[u].winProb}%</div>
                  <div className="font-body text-xs text-pool-chalk-dim leading-tight">to win</div>
                  <div className="font-heading text-sm text-pool-chalk mt-1">~{Math.round(projected[u])}</div>
                  <div className="font-body text-xs text-pool-chalk-dim">{mc[u].p25}–{mc[u].p75} range</div>
                  <div className="font-body text-xs text-pool-chalk-dim">{model.current[u]} now</div>
                </div>
                <div className={`w-20 ${barH} rounded-t-lg`}
                  style={{ background: `${PC[u]}18`, border: `1px solid ${PC[u]}45`, borderBottom: 'none' }} />
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
            {matchups.map(({ a, b, simVal }) => {
              const pA = simVal, pB = 100 - simVal
              const ha = model.h2h[a][b], hb = model.h2h[b][a]
              const ra = model.rh2h[a][b], rb = model.rh2h[b][a]
              return (
                <div key={`${a}-${b}`} className="bg-pool-bg rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <PlayerAvatar username={a} size={22} />
                      <span className="font-body text-sm font-medium" style={{ color: PC[a] }}>{PLAYER_STYLES[a].label}</span>
                    </div>
                    <span className="font-body text-xs text-pool-chalk-dim">vs</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-body text-sm font-medium" style={{ color: PC[b] }}>{PLAYER_STYLES[b].label}</span>
                      <PlayerAvatar username={b} size={22} />
                    </div>
                  </div>
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
              { icon: '📊', label: 'All-time head-to-head record',                  w: wAt },
              { icon: '🔥', label: `Recent form (last ${model.RECENT_N} sessions)`, w: wRe },
              { icon: '🎯', label: 'Shot accuracy advantage',                        w: wAc },
            ].map(({ icon, label, w }) => {
              const pct = Math.round((w / (wAt + wRe + wAc || 1)) * 100)
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-lg leading-none">{icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-body text-xs text-pool-chalk-dim">{label}</span>
                      <span className="font-body text-xs text-pool-gold">{pct}%</span>
                    </div>
                    <div className="h-1 bg-pool-bg rounded-full overflow-hidden">
                      <div className="h-full bg-pool-gold rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="font-body text-xs text-pool-chalk-dim mt-4 leading-relaxed">
            Win % is from {MC_RUNS.toLocaleString()} simulated seasons. With {effectiveRemaining} games left, the range shows the middle 50% of outcomes.
          </p>
        </div>
      </div>

    </div>
  )
}
