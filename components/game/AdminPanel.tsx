import type { Dispatch, SetStateAction } from 'react'
import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import PlayerBall from '@/components/PlayerBall'
import type { Player, Shot } from '@/types/database'

interface AdminPanelProps {
  p1: Player
  p2: Player
  shots: Shot[]
  isComplete: boolean
  saving: boolean
  winnerId: string
  setWinnerId: Dispatch<SetStateAction<string>>
  blackBall: boolean
  setBlackBall: Dispatch<SetStateAction<boolean>>
  onClose: () => void
  onSaveWinner: () => void
  onReopen: () => void
  onReset: () => void
  onDeleteShot: (shotId: string) => void
}

/** Amine-only edit sheet: change winner, delete individual shots, re-open / reset. */
export default function AdminPanel({
  p1, p2, shots, isComplete, saving,
  winnerId, setWinnerId, blackBall, setBlackBall,
  onClose, onSaveWinner, onReopen, onReset, onDeleteShot,
}: AdminPanelProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg bg-pool-surface rounded-t-3xl border-t border-pool-border animate-slide-up max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-pool-surface px-6 pt-6 pb-3 border-b border-pool-border">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl tracking-wider text-pool-chalk">EDIT GAME</h2>
            <button onClick={onClose}
              className="text-pool-chalk-dim hover:text-pool-chalk text-2xl leading-none px-1">×</button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div>
            <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3">CHANGE WINNER</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[p1, p2].map(player => {
                const style = PLAYER_STYLES[player.username as PlayerUsername]
                const sel = winnerId === player.id
                return (
                  <button key={player.id}
                    onClick={() => setWinnerId(player.id)}
                    className={`py-3 rounded-xl border-2 font-heading text-base tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 ${sel ? 'border-pool-gold bg-pool-gold/15 text-pool-gold' : 'border-pool-border text-pool-chalk-dim hover:border-pool-chalk/30'}`}>
                    {style && <PlayerBall number={style.number} color={style.color} size={28} />}
                    {player.display_name.toUpperCase()}
                    {sel && ' 🏆'}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setBlackBall(b => !b)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border mb-3 text-sm font-body transition-all ${blackBall ? 'border-pool-red/50 bg-pool-red/10 text-pool-chalk' : 'border-pool-border text-pool-chalk-dim'}`}>
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${blackBall ? 'bg-pool-red border-pool-red' : 'border-pool-chalk-dim'}`}>
                {blackBall && <span className="text-[10px] text-white">✓</span>}
              </div>
              Loser potted the black ball
            </button>
            <button onClick={onSaveWinner} disabled={!winnerId || saving}
              className="w-full py-3 rounded-xl bg-pool-gold text-pool-bg font-heading text-base tracking-widest hover:bg-pool-gold-light disabled:opacity-40 transition-all active:scale-95">
              {saving ? 'SAVING…' : 'SAVE WINNER'}
            </button>
          </div>

          {shots.length > 0 && (
            <div>
              <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3">
                SHOTS ({shots.length})
              </p>
              <div className="bg-pool-bg rounded-xl border border-pool-border divide-y divide-pool-border overflow-hidden">
                {[...shots].sort((a, b) => a.shot_number - b.shot_number).map(s => {
                  const shooter = s.player_id === p1.id ? p1 : p2
                  const shooterStyle = PLAYER_STYLES[shooter.username as PlayerUsername]
                  const shotBalls = s.balls_potted ?? (s.potted ? 1 : 0)
                  const oppBalls = s.opponent_balls_potted ?? 0
                  const label = s.is_error
                    ? oppBalls > 0 ? `Foul (+${oppBalls} opp)` : 'Error'
                    : s.is_lucky ? 'Lucky'
                    : shotBalls > 1 ? `×${shotBalls} Pots`
                    : shotBalls === 1 ? 'Potted'
                    : 'Miss'
                  const labelColor = s.is_error ? '#ef4444' : s.is_lucky ? '#c9a227' : shotBalls > 0 ? '#22c55e' : '#7a786f'
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-3 py-2">
                      <span className="font-body text-xs text-pool-chalk-dim w-6 text-right shrink-0">#{s.shot_number}</span>
                      <span className="font-body text-sm shrink-0" style={{ color: shooterStyle?.color }}>{shooter.display_name}</span>
                      <span className="font-body text-xs flex-1" style={{ color: labelColor }}>{label}</span>
                      <button onClick={() => onDeleteShot(s.id)}
                        className="text-pool-red hover:text-red-400 text-lg leading-none px-1 transition-colors">
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="border border-pool-red/30 rounded-xl p-4 space-y-2">
            <p className="font-heading text-xs tracking-widest text-pool-red mb-3">DANGER ZONE</p>
            {isComplete && (
              <button onClick={onReopen} disabled={saving}
                className="w-full py-3 rounded-xl border border-pool-border font-heading text-sm tracking-widest text-pool-chalk-dim hover:text-pool-chalk hover:border-pool-chalk/30 transition-all active:scale-95 disabled:opacity-40">
                {saving ? 'SAVING…' : '🔓 RE-OPEN GAME (keep shots)'}
              </button>
            )}
            <button onClick={onReset} disabled={saving}
              className="w-full py-3 rounded-xl border border-pool-red/40 bg-pool-red/10 font-heading text-sm tracking-widest text-pool-red hover:bg-pool-red/20 transition-all active:scale-95 disabled:opacity-40">
              {saving ? 'SAVING…' : '🗑️ RESET ALL SHOTS & RESULT'}
            </button>
          </div>
        </div>
        <div className="h-6" />
      </div>
    </div>
  )
}
