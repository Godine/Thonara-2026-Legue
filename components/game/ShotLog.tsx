import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import type { Player, Shot } from '@/types/database'

/** "Last shots" card — the five most recent shots, newest first. */
export default function ShotLog({ shots, p1, p2 }: { shots: Shot[]; p1: Player; p2: Player }) {
  if (shots.length === 0) return null
  const p1Style = PLAYER_STYLES[p1.username as PlayerUsername]
  const p2Style = PLAYER_STYLES[p2.username as PlayerUsername]

  return (
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden border border-pool-border bg-pool-surface">
      <div className="flex items-center justify-between px-4 py-2 border-b border-pool-border/60">
        <span className="font-heading text-xs tracking-widest text-pool-chalk-dim">LAST SHOTS</span>
        <span className="font-body text-xs text-pool-chalk-dim/50">{shots.length} total</span>
      </div>
      <div className="divide-y divide-pool-border/40">
        {shots.slice(-5).reverse().map((shot, i) => {
          const shooter = shot.player_id === p1.id ? p1 : p2
          const shooterStyle = shot.player_id === p1.id ? p1Style : p2Style
          const shotBalls = shot.balls_potted ?? (shot.potted ? 1 : 0)
          const oppBalls = shot.opponent_balls_potted ?? 0
          const cueBallIn = shot.cue_ball_potted ?? false
          const label = shot.is_error
            ? cueBallIn
              ? oppBalls > 0
                ? `⚪ Scratch +${oppBalls} opp`
                : shotBalls > 0 ? `⚪ Scratch +${shotBalls}` : '⚪ Scratch'
              : oppBalls > 0 ? `⚠ Opp ×${oppBalls}`
              : shotBalls > 0 ? `⚠ In-off ×${shotBalls}`
              : '⚠ Error'
            : shot.is_lucky ? '★ Lucky'
            : shotBalls > 1 ? `● ×${shotBalls}`
            : shotBalls === 1 ? '● Potted'
            : '✕ Miss'
          const color = shot.is_error
            ? cueBallIn ? '#a78bfa' : oppBalls > 0 ? '#f97316' : '#ef4444'
            : shot.is_lucky ? '#c9a227' : shotBalls > 0 ? '#22c55e' : '#7a786f'
          return (
            <div key={shot.id} className={`flex items-center gap-3 px-4 py-2.5 ${i === 0 ? 'bg-pool-border/20' : ''}`}>
              <span className="font-body text-xs text-pool-chalk-dim/50 w-5 shrink-0 tabular-nums">#{shot.shot_number}</span>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: shooterStyle?.color }} />
              <span className="font-body text-xs text-pool-chalk flex-1">{shooter.display_name}</span>
              <span className="font-body text-xs font-medium" style={{ color }}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
