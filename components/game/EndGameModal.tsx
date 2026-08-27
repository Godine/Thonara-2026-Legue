import type { Dispatch, SetStateAction } from 'react'
import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import PlayerBall from '@/components/PlayerBall'
import type { Player } from '@/types/database'
import type { EndGameState } from './types'

interface EndGameModalProps {
  value: EndGameState
  setValue: Dispatch<SetStateAction<EndGameState>>
  p1: Player
  p2: Player
  saving: boolean
  onConfirm: () => void
}

/** Bottom-sheet to pick the winner and flag whether the loser potted the black. */
export default function EndGameModal({ value, setValue, p1, p2, saving, onConfirm }: EndGameModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 animate-fade-in">
      <div className="w-full max-w-lg bg-pool-surface rounded-t-3xl border-t border-pool-border p-6 animate-slide-up">
        <h2 className="font-heading text-3xl tracking-wider text-pool-chalk text-center mb-6">END GAME</h2>
        <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-3">Who won?</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[p1, p2].map(player => {
            const style = PLAYER_STYLES[player.username as PlayerUsername]
            const selected = value.winnerId === player.id
            return (
              <button key={player.id} onClick={() => setValue(e => ({ ...e, winnerId: player.id }))}
                className={`py-4 rounded-2xl border-2 font-heading text-xl tracking-wider flex flex-col items-center gap-2 transition-all active:scale-95 ${selected ? 'border-pool-gold bg-pool-gold/15 text-pool-gold' : 'border-pool-border bg-pool-bg text-pool-chalk-dim hover:border-pool-chalk/30'}`}>
                {style && <PlayerBall number={style.number} color={style.color} size={40} />}
                {player.display_name.toUpperCase()}
                {selected && <span className="text-sm">🏆</span>}
              </button>
            )
          })}
        </div>
        <button onClick={() => setValue(e => ({ ...e, blackBall: !e.blackBall }))}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border mb-5 transition-all ${value.blackBall ? 'border-pool-red/50 bg-pool-red/10 text-pool-chalk' : 'border-pool-border bg-pool-bg text-pool-chalk-dim'}`}>
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${value.blackBall ? 'bg-pool-red border-pool-red' : 'border-pool-chalk-dim'}`}>
            {value.blackBall && <span className="text-xs text-white">✓</span>}
          </div>
          <span className="font-body text-sm">Loser potted the black ball</span>
        </button>
        <div className="flex gap-3">
          <button onClick={() => setValue(e => ({ ...e, open: false }))}
            className="flex-1 py-4 rounded-xl border border-pool-border font-heading text-lg tracking-wider text-pool-chalk-dim hover:text-pool-chalk transition-all">
            CANCEL
          </button>
          <button onClick={onConfirm} disabled={!value.winnerId || saving}
            className="flex-1 py-4 rounded-xl bg-pool-gold text-pool-bg font-heading text-lg tracking-widest hover:bg-pool-gold-light disabled:opacity-40 transition-all active:scale-95 glow-gold">
            {saving ? 'SAVING…' : 'CONFIRM'}
          </button>
        </div>
      </div>
    </div>
  )
}
