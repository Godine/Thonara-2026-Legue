export default function SessionLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: '#060d08' }}>
      <div
        className="w-12 h-12 rounded-full border-2"
        style={{
          borderColor: '#1f3525',
          borderTopColor: '#c9a227',
          animation: 'sessionSpin 0.9s linear infinite',
        }}
      />
      <p className="font-heading text-sm tracking-[0.25em] text-pool-chalk-dim">LOADING SESSION…</p>
      <style>{`@keyframes sessionSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
