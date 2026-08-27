import type { Dispatch, SetStateAction } from 'react'
import type { FoulState } from './types'

interface FoulPopupProps {
  value: FoulState
  setValue: Dispatch<SetStateAction<FoulState | null>>
  onConfirm: (playerId: string, ownBalls: number, oppBalls: number, cueBallIn: boolean) => void
}

/** Bottom-sheet for recording a foul / in-off (turn switches). */
export default function FoulPopup({ value, setValue, onConfirm }: FoulPopupProps) {
  const close = () => setValue(null)
  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 animate-fade-in" onClick={close}>
      <div
        className="w-full max-w-lg bg-pool-surface rounded-t-3xl border-t border-pool-border p-6 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-heading text-2xl tracking-wider text-pool-chalk text-center mb-1">FOUL</h2>
        <p className="font-body text-xs text-pool-chalk-dim text-center mb-5">
          Turn switches. Mark what happened.
        </p>

        {/* Cue ball toggle */}
        <button
          onClick={() => setValue(p => p ? { ...p, cueBallIn: !p.cueBallIn } : p)}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 mb-4 transition-all active:scale-[0.98] ${
            value.cueBallIn
              ? 'border-violet-400 bg-violet-400/15 text-violet-300'
              : 'border-pool-border text-pool-chalk-dim hover:border-violet-400/40'
          }`}
        >
          <span className="text-xl leading-none">⚪</span>
          <span className="font-heading text-base tracking-wider flex-1 text-left">CUE BALL POTTED</span>
          <span className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
            value.cueBallIn ? 'bg-violet-400 border-violet-400' : 'border-pool-chalk-dim'
          }`}>
            {value.cueBallIn && <span className="text-pool-bg text-xs font-bold">✓</span>}
          </span>
        </button>

        {/* Opponent balls */}
        <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-2">Opponent balls potted</p>
        <div className="flex gap-3 mb-4">
          {[0, 1, 2, 3].map(n => (
            <button
              key={n}
              onClick={() => setValue(p => p ? { ...p, oppBalls: n } : p)}
              className={`flex-1 py-3.5 rounded-xl border-2 font-heading text-2xl transition-all active:scale-95 ${
                value.oppBalls === n
                  ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                  : 'border-pool-border text-pool-chalk-dim hover:border-orange-500/40'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Own balls potted */}
        <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-2">Your balls potted</p>
        <div className="flex gap-3 mb-4">
          {[0, 1, 2, 3].map(n => (
            <button
              key={n}
              onClick={() => setValue(p => p ? { ...p, ownBalls: n } : p)}
              className={`flex-1 py-3.5 rounded-xl border-2 font-heading text-2xl transition-all active:scale-95 ${
                value.ownBalls === n
                  ? 'border-violet-400 bg-violet-400/20 text-violet-300'
                  : 'border-pool-border text-pool-chalk-dim hover:border-violet-400/40'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-2">
          <button
            onClick={close}
            className="flex-1 py-4 rounded-xl border border-pool-border font-heading text-lg tracking-wider text-pool-chalk-dim hover:text-pool-chalk transition-all"
          >
            CANCEL
          </button>
          <button
            onClick={() => onConfirm(value.playerId, value.ownBalls, value.oppBalls, value.cueBallIn)}
            className="flex-1 py-4 rounded-xl bg-pool-red text-pool-chalk font-heading text-lg tracking-widest hover:brightness-110 transition-all active:scale-[0.98]"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  )
}
