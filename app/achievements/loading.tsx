export default function AchievementsLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: '#060d08' }}>
      <div className="relative">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #c9a22799, #c9a22733)',
            border: '2px solid #c9a22744',
            animation: 'achieveSpin 1.2s ease-in-out infinite',
            boxShadow: '0 0 24px #c9a22733',
          }}
        >
          🏅
        </div>
      </div>
      <p className="font-heading text-sm tracking-[0.25em] text-pool-chalk-dim">LOADING BADGES…</p>
      <style>{`@keyframes achieveSpin { 0%,100% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.1) rotate(12deg); } }`}</style>
    </div>
  )
}
