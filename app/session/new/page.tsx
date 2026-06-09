'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { findSessionByDate, createSession } from '@/lib/queries'

const OPTIONS = [
  { count: 3,  label: '3',  sub: 'Quick set',  time: '~45 min'  },
  { count: 6,  label: '6',  sub: 'Standard',   time: '~1.5 hrs' },
  { count: 9,  label: '9',  sub: 'Extended',   time: '~2 hrs'   },
  { count: 12, label: '12', sub: 'Marathon',   time: '~3 hrs'   },
]

export default function NewSessionPage() {
  const [loading, setLoading] = useState<number | null>(null)
  const router = useRouter()
  const db = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const start = async (gameCount: number) => {
    if (loading !== null) return
    setLoading(gameCount)
    const existing = await findSessionByDate(db, today)
    if (existing) {
      router.push(`/session/${existing.id}`)
      return
    }
    const result = await createSession(db, today, gameCount)
    if (result.ok) {
      router.push(`/session/${result.id}`)
    } else {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 animate-fade-in flex flex-col min-h-dvh">

      {/* Header */}
      <div className="relative pt-10 pb-8 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #1a4731 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, #c9a227 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }} />
        <p className="font-body text-[10px] tracking-[0.4em] uppercase text-pool-gold/60 relative mb-2">
          {format(new Date(today + 'T12:00:00'), 'EEEE, MMMM d')}
        </p>
        <h1 className="font-heading text-5xl tracking-widest text-pool-chalk relative leading-none">
          HOW LONG?
        </h1>
        <p className="font-body text-sm text-pool-chalk-dim relative mt-3">
          Pick how many games you&apos;re playing tonight
        </p>
      </div>

      {/* Game count tiles */}
      <div className="grid grid-cols-2 gap-3 pb-10">
        {OPTIONS.map(({ count, label, sub, time }) => {
          const isLoading = loading === count
          return (
            <button
              key={count}
              onClick={() => start(count)}
              disabled={loading !== null}
              className="relative overflow-hidden rounded-2xl border-2 transition-all duration-150 active:scale-[0.96] disabled:opacity-60 text-left"
              style={{
                borderColor: loading !== null && !isLoading ? '#1f3525' : '#c9a22740',
                background: isLoading
                  ? 'linear-gradient(155deg, #1f5c38 0%, #0e2a1a 100%)'
                  : 'linear-gradient(155deg, #1a3a22 0%, #0e1e12 100%)',
                boxShadow: isLoading ? '0 0 30px #c9a22730' : undefined,
              }}
            >
              {/* dot texture */}
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #f0ede6 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
              {/* inner border glow when active */}
              {isLoading && (
                <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: 'inset 0 0 0 1px #c9a22750' }} />
              )}

              <div className="relative px-5 py-6">
                <p
                  className="font-heading leading-none mb-2"
                  style={{
                    fontSize: '3.5rem',
                    color: isLoading ? '#e8c547' : '#f0ede6',
                    textShadow: isLoading ? '0 0 24px #c9a22770' : undefined,
                  }}
                >
                  {isLoading ? '…' : label}
                </p>
                <p className="font-heading text-sm tracking-wider text-pool-chalk-dim leading-none">{sub}</p>
                <p className="font-body text-xs text-pool-chalk-dim/50 mt-1">{time}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
