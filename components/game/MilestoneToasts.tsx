import type { MilestoneToast } from './types'

/** Fixed stack of career/streak milestone toasts floating above the game. */
export default function MilestoneToasts({ toasts }: { toasts: MilestoneToast[] }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map(toast => (
        <div key={toast.id} className="animate-slide-up max-w-sm w-full">
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border"
            style={{
              borderColor: `${toast.playerColor}50`,
              background: `linear-gradient(135deg, ${toast.playerColor}22 0%, rgb(var(--pool-bg)) 100%)`,
              boxShadow: `0 0 40px ${toast.playerColor}40, 0 8px 32px rgba(0,0,0,0.6)`,
            }}
          >
            <span className="text-3xl leading-none">{toast.emoji}</span>
            <div>
              <p className="font-heading text-[11px] tracking-[0.2em] leading-none mb-1" style={{ color: toast.playerColor }}>
                {toast.headline}
              </p>
              <p className="font-body text-base text-pool-chalk leading-none">{toast.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
