import type { Dispatch, SetStateAction } from 'react'
import type { PotPopupState } from './types'

interface MultiPotPopupProps {
  value: PotPopupState
  setValue: Dispatch<SetStateAction<PotPopupState | null>>
  onConfirm: (playerId: string, ownBalls: number, oppBalls: number) => void
}

/** Bottom-sheet for recording multiple balls potted on one shot (with optional foul credit). */
export default function MultiPotPopup({ value, setValue, onConfirm }: MultiPotPopupProps) {
  const close = () => setValue(null)
  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 animate-fade-in" onClick={close}>
      <div
        className="w-full max-w-lg bg-pool-surface rounded-t-3xl border-t border-pool-border p-6 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-heading text-2xl tracking-wider text-pool-chalk text-center mb-6">HOW MANY BALLS?</h2>

        <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-2">Your balls</p>
        <div className="flex gap-3 mb-5">
          {[1, 2, 3].map(n => (
            <button
              key={n}
              onClick={() => setValue(p => p ? { ...p, ownBalls: n } : p)}
              className={`flex-1 py-4 rounded-xl border-2 font-heading text-2xl transition-all active:scale-95 ${
                value.ownBalls === n
                  ? 'border-green-500 bg-green-500/20 text-green-400'
                  : 'border-pool-border text-pool-chalk-dim hover:border-green-500/40'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-2">Opponent&apos;s balls (foul pot)</p>
        <div className="flex gap-3 mb-5">
          {[0, 1, 2].map(n => (
            <button
              key={n}
              onClick={() => setValue(p => p ? { ...p, oppBalls: n } : p)}
              className={`flex-1 py-4 rounded-xl border-2 font-heading text-2xl transition-all active:scale-95 ${
                value.oppBalls === n
                  ? 'border-red-500 bg-red-500/20 text-red-400'
                  : 'border-pool-border text-pool-chalk-dim hover:border-red-500/40'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {value.oppBalls > 0 && (
          <p className="text-xs font-body text-pool-red text-center mb-4">⚠ Foul — marked as an error, ball credited to opponent</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={close}
            className="flex-1 py-4 rounded-xl border border-pool-border font-heading text-lg tracking-wider text-pool-chalk-dim hover:text-pool-chalk transition-all"
          >
            CANCEL
          </button>
          <button
            onClick={() => onConfirm(value.playerId, value.ownBalls, value.oppBalls)}
            className="flex-1 py-4 rounded-xl bg-pool-green-bright text-pool-bg font-heading text-lg tracking-widest hover:brightness-110 transition-all active:scale-[0.98]"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  )
}
