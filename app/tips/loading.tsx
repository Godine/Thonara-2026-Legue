export default function TipsLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: 'rgb(var(--pool-bg))' }}>
      <div
        className="text-4xl"
        style={{ animation: 'tipsPulse 1.2s ease-in-out infinite' }}
      >
        🎓
      </div>
      <p className="font-heading text-sm tracking-[0.25em] text-pool-chalk-dim">LOADING TIPS…</p>
      <style>{`@keyframes tipsPulse { 0%,100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.2); opacity: 1; } }`}</style>
    </div>
  )
}
