import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import type { Player } from '@/types/database'

interface OddsInfoModalProps {
  p1: Player
  p2: Player
  h2hStats: { p1Wins: number; p2Wins: number }
  onClose: () => void
}

/** Explainer sheet for how the win-odds model works. */
export default function OddsInfoModal({ p1, p2, h2hStats, onClose }: OddsInfoModalProps) {
  const p1Style = PLAYER_STYLES[p1.username as PlayerUsername]
  const p2Style = PLAYER_STYLES[p2.username as PlayerUsername]
  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg bg-pool-surface rounded-t-3xl border-t border-pool-border p-6 animate-slide-up"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-2xl tracking-wider text-pool-chalk">HOW ODDS WORK</h2>
          <button onClick={onClose}
            className="text-pool-chalk-dim hover:text-pool-chalk transition-colors text-2xl leading-none px-1">×</button>
        </div>

        <div className="space-y-4">
          <div className="bg-pool-bg rounded-xl p-4 border border-pool-border">
            <p className="font-heading text-sm tracking-widest text-pool-gold mb-1">TURN SIMULATION</p>
            <p className="font-body text-sm text-pool-chalk-dim leading-relaxed">
              The model simulates the game turn by turn — pot a ball and you keep shooting,
              miss and the table flips. From the current position (balls left, whose shot it is)
              it calculates the <span className="text-pool-chalk">exact mathematical probability</span> of winning.
            </p>
          </div>

          <div className="bg-pool-bg rounded-xl p-4 border border-pool-border">
            <p className="font-heading text-sm tracking-widest text-pool-gold mb-1">ACCURACY SCORE</p>
            <p className="font-body text-sm text-pool-chalk-dim leading-relaxed">
              Your pot rate blends two signals:
            </p>
            <ul className="mt-2 space-y-1">
              <li className="font-body text-sm text-pool-chalk-dim flex gap-2">
                <span className="text-pool-gold shrink-0">→</span>
                <span><span className="text-pool-chalk">This game</span> — recent shots count more than early ones (momentum)</span>
              </li>
              <li className="font-body text-sm text-pool-chalk-dim flex gap-2">
                <span className="text-pool-gold shrink-0">→</span>
                <span><span className="text-pool-chalk">Career history</span> — your all-time pot rate, so odds make sense from shot one</span>
              </li>
            </ul>
          </div>

          <div className="bg-pool-bg rounded-xl p-4 border border-pool-border">
            <p className="font-heading text-sm tracking-widest text-pool-gold mb-1">HEAD-TO-HEAD NUDGE</p>
            <p className="font-body text-sm text-pool-chalk-dim leading-relaxed">
              Your historical win rate against <span className="text-pool-chalk">this specific opponent</span> adds
              a small adjustment (up to 25%, tapering off as more shots are taken in this game).
            </p>
            {(h2hStats.p1Wins + h2hStats.p2Wins) > 0 && (
              <p className="font-body text-xs text-pool-chalk-dim mt-2 pt-2 border-t border-pool-border/50">
                This matchup: <span style={{ color: p1Style?.color }}>{p1.display_name}</span> {h2hStats.p1Wins}
                {' – '}
                {h2hStats.p2Wins} <span style={{ color: p2Style?.color }}>{p2.display_name}</span>
              </p>
            )}
          </div>
        </div>

        <button onClick={onClose}
          className="w-full mt-5 py-4 rounded-xl border border-pool-border font-heading text-lg tracking-widest text-pool-chalk-dim hover:text-pool-chalk transition-all">
          GOT IT
        </button>
      </div>
    </div>
  )
}
