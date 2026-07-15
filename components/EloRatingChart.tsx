'use client'

import { PLAYERS, PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import PlayerAvatar from '@/components/PlayerAvatar'

type EloPoint = { label: string; adib: number; ahmed: number; godine: number }

export default function EloRatingChart({
  eloAtSession,
  eloRatings,
}: {
  eloAtSession: EloPoint[]
  eloRatings: Record<PlayerUsername, number>
}) {
  const hasChart = eloAtSession.length > 1

  return (
    <div className="bg-pool-surface rounded-2xl border border-pool-border p-4">
      {/* Current rating chips */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {PLAYERS.map(u => {
          const style = PLAYER_STYLES[u]
          const rating = eloRatings[u]
          const delta = rating - 1200
          return (
            <div key={u} className="flex flex-col items-center gap-1.5">
              <div style={{ filter: `drop-shadow(0 0 8px ${style.color}44)` }}>
                <PlayerAvatar username={u} size={40} />
              </div>
              <p className="font-heading text-2xl leading-none tabular-nums" style={{ color: style.color }}>
                {rating}
              </p>
              <p className={`font-body text-[10px] tabular-nums ${delta >= 0 ? 'text-pool-green-bright' : 'text-pool-red'}`}>
                {delta >= 0 ? '+' : ''}{delta}
              </p>
            </div>
          )
        })}
      </div>

      {hasChart ? (
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={eloAtSession} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#7a786f' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#7a786f' }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                background: '#0e1e12',
                border: '1px solid #1f3525',
                borderRadius: '10px',
                fontSize: '11px',
                color: '#f0ede6',
              }}
            />
            {PLAYERS.map(u => (
              <Line
                key={u}
                type="monotone"
                dataKey={u}
                name={PLAYER_STYLES[u].label}
                stroke={PLAYER_STYLES[u].color}
                strokeWidth={2.5}
                dot={{ r: 3, fill: PLAYER_STYLES[u].color }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="font-body text-xs text-pool-chalk-dim text-center py-6">
          Play more sessions to see the trend
        </p>
      )}
    </div>
  )
}
