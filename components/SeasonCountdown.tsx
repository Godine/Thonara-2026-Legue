import PlayerAvatar from '@/components/PlayerAvatar'
import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import { computeSeasonProgress } from '@/lib/season'

export interface SeasonChampion {
  username: PlayerUsername
  displayName: string
  wins: number
}

export default function SeasonCountdown({
  played,
  champion,
}: {
  played: number
  champion?: SeasonChampion | null
}) {
  const { limit, remaining, pct, isComplete } = computeSeasonProgress(played)

  if (isComplete && champion) {
    const style = PLAYER_STYLES[champion.username]
    return (
      <div
        className="relative rounded-2xl border overflow-hidden p-5 text-center"
        style={{
          borderColor: `${style.color}55`,
          background: `linear-gradient(155deg, ${style.color}22 0%, transparent 70%)`,
          boxShadow: `0 0 32px ${style.color}22`,
        }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(circle, #c9a227 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />
        <p className="relative text-4xl mb-1">🏆</p>
        <p className="relative font-heading text-xs tracking-[0.35em] text-pool-gold mb-3">SEASON COMPLETE</p>
        <div className="relative flex items-center justify-center mb-2" style={{ filter: `drop-shadow(0 0 14px ${style.color}88)` }}>
          <PlayerAvatar username={champion.username} size={64} />
        </div>
        <p className="relative font-heading text-2xl tracking-widest gold-shimmer">{champion.displayName.toUpperCase()}</p>
        <p className="relative font-body text-xs text-pool-chalk-dim mt-1">
          Crowned league champion with {champion.wins} wins · {limit} games played
        </p>
      </div>
    )
  }

  const urgent = remaining <= 10

  return (
    <div className="rounded-2xl border border-pool-border bg-pool-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="font-heading text-xs tracking-[0.3em] text-pool-gold">ROAD TO {limit}</p>
        <p className="font-heading text-sm text-pool-chalk tabular-nums">{played} / {limit}</p>
      </div>
      <div className="h-2.5 rounded-full bg-pool-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #c9a227, #e8c547)',
            boxShadow: '0 0 12px #c9a22799',
          }}
        />
      </div>
      <p className="font-body text-xs text-pool-chalk-dim mt-2 text-center">
        {urgent
          ? `🔥 Only ${remaining} ${remaining === 1 ? 'game' : 'games'} left — a champion is about to be crowned!`
          : `${remaining} games to go until we crown a champion 🏆`}
      </p>
    </div>
  )
}
