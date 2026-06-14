export default function PlayerLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: 'rgb(var(--pool-bg))' }}>
      <div
        className="w-20 h-20 rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #c9a22799, #c9a22744 55%, #c9a22711)',
          border: '2px solid #c9a22744',
          animation: 'profileSpin 1s linear infinite',
          boxShadow: '0 0 24px #c9a22733',
        }}
      />
      <p className="font-heading text-sm tracking-[0.25em] text-pool-chalk-dim">LOADING PROFILE…</p>
      <style>{`@keyframes profileSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
