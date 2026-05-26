'use client'

import { useState } from 'react'
import type { Rarity } from '@/lib/achievements'
import { RARITY_STYLES } from '@/lib/achievements'

interface FlipBadgeCardProps {
  icon: string
  name: string
  description: string
  rarity: Rarity
  barPct: number
  label: string | null
  current: number
  target: number
}

export default function FlipBadgeCard({
  icon, name, description, rarity, barPct, label, current, target,
}: FlipBadgeCardProps) {
  const [flipped, setFlipped] = useState(false)
  const rs = RARITY_STYLES[rarity]

  return (
    <div
      onClick={() => setFlipped(f => !f)}
      className="cursor-pointer select-none"
      style={{ perspective: '700px' }}
    >
      <div
        style={{
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.42s cubic-bezier(0.4,0,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* ── Front ── */}
        <div
          className="rounded-xl border p-2.5 flex flex-col gap-1.5"
          style={{
            borderColor: rs.border,
            background: rs.bg,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <div className="text-lg leading-none">{icon}</div>
          <p className="font-heading text-[10px] tracking-wide text-pool-chalk leading-snug">{name}</p>
          <div className="h-1 bg-pool-border rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: rs.color }} />
          </div>
          <p className="font-body text-[9px] text-pool-chalk-dim tabular-nums">
            {label ?? `${current}/${target}`}
          </p>
          <p className="font-body text-[8px] text-pool-chalk-dim/40 leading-none mt-0.5">tap to flip</p>
        </div>

        {/* ── Back ── */}
        <div
          className="rounded-xl border p-2.5 flex flex-col gap-1.5 justify-between"
          style={{
            borderColor: rs.border,
            background: rs.bg,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            position: 'absolute',
            inset: 0,
          }}
        >
          <div>
            <p
              className="font-heading text-[9px] tracking-widest mb-1.5 leading-none"
              style={{ color: rs.color }}
            >
              {rs.label.toUpperCase()}
            </p>
            <p className="font-body text-[9px] text-pool-chalk leading-snug">{description}</p>
          </div>
          <div className="flex items-center justify-between mt-auto pt-1">
            <div className="h-1 flex-1 bg-pool-border rounded-full overflow-hidden mr-2">
              <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: rs.color }} />
            </div>
            <p className="font-body text-[8px] text-pool-chalk-dim/60 shrink-0 tabular-nums">
              {label ?? `${current}/${target}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
