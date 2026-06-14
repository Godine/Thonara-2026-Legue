export default function HistoryLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: 'rgb(var(--pool-bg))' }}>
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #c9a22766, #c9a22722)',
          border: '2px solid #c9a22733',
          animation: 'histPulse 1.3s ease-in-out infinite',
        }}
      >
        📅
      </div>
      <p className="font-heading text-sm tracking-[0.25em] text-pool-chalk-dim">LOADING HISTORY…</p>
      <style>{`@keyframes histPulse { 0%,100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.1); opacity: 1; } }`}</style>
    </div>
  )
}
