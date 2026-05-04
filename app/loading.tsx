export default function HomeLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10" style={{ background: '#060d08' }}>
      {/* Triangle rack of balls */}
      <div className="relative" style={{ width: 120, height: 104 }}>
        {/* Row 1 */}
        <Ball n={1} color="#f5c518" x={52} y={0}  delay={0}    />
        {/* Row 2 */}
        <Ball n={2} color="#60a5fa" x={28} y={36} delay={0.12} />
        <Ball n={3} color="#f87171" x={76} y={36} delay={0.24} />
        {/* Row 3 */}
        <Ball n={4} color="#a855f7" x={4}  y={72} delay={0.36} />
        <Ball n={8} color="#e5e5e5" x={52} y={72} delay={0.48} />
        <Ball n={5} color="#f97316" x={100} y={72} delay={0.60} />
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="font-heading text-4xl tracking-[0.3em] text-pool-chalk">THONARA</p>
        <p className="font-heading text-xl tracking-[0.5em] gold-shimmer">LEAGUE</p>
      </div>

      {/* Cue sweeping left to right */}
      <div className="relative w-48 h-1 overflow-hidden rounded-full" style={{ background: '#1f3525' }}>
        <div
          className="absolute inset-y-0 left-0 w-16 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, #c9a227, transparent)',
            animation: 'cueSweep 1.4s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes ballPulse {
          0%, 100% { opacity: 0.5; transform: scale(0.9); }
          50%       { opacity: 1;   transform: scale(1); }
        }
        @keyframes cueSweep {
          0%   { transform: translateX(-64px); }
          100% { transform: translateX(192px); }
        }
      `}</style>
    </div>
  )
}

function Ball({ n, color, x, y, delay }: { n: number; color: string; x: number; y: number; delay: number }) {
  return (
    <div
      className="absolute w-8 h-8 rounded-full flex items-center justify-center"
      style={{
        left: x,
        top: y,
        background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color}77 55%, ${color}22)`,
        border: `1.5px solid ${color}44`,
        animation: `ballPulse 1.4s ease-in-out ${delay}s infinite`,
        boxShadow: `0 0 8px ${color}33`,
      }}
    >
      <span className="font-heading text-xs" style={{ color: '#111', textShadow: '0 1px 1px rgba(255,255,255,0.5)' }}>
        {n}
      </span>
    </div>
  )
}
