export default function StatsLoading() {
  const balls = [
    { n: 1, color: '#f5c518' },
    { n: 2, color: '#60a5fa' },
    { n: 3, color: '#f87171' },
    { n: 8, color: '#e5e5e5' },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8" style={{ background: 'rgb(var(--pool-bg))' }}>
      {/* Rolling balls */}
      <div className="flex gap-4">
        {balls.map(({ n, color }, i) => (
          <div
            key={n}
            className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}66 60%, ${color}22)`,
              border: `2px solid ${color}44`,
              animation: `ballBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
            }}
          >
            <span className="font-heading text-sm select-none" style={{ color: n === 8 ? '#111' : '#111', textShadow: '0 1px 2px rgba(255,255,255,0.4)' }}>
              {n}
            </span>
          </div>
        ))}
      </div>

      <p className="font-heading text-pool-chalk-dim tracking-[0.2em] text-sm">
        RACKING UP THE STATS…
      </p>

      <style>{`
        @keyframes ballBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  )
}
