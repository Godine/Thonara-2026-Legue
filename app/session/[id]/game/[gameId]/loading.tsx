export default function GameLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: 'rgb(var(--pool-bg))' }}>
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #22c55e22, #22c55e0a)',
          border: '2px solid #22c55e33',
          animation: 'gamePulse 1.2s ease-in-out infinite',
        }}
      >
        🎱
      </div>
      <p className="font-heading text-sm tracking-[0.25em] text-pool-chalk-dim">LOADING GAME…</p>
      <style>{`@keyframes gamePulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }`}</style>
    </div>
  )
}
