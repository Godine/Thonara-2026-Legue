'use client'

import Link from 'next/link'
import { PLAYER_STYLES } from '@/lib/game-config'
import PlayerAvatar from '@/components/PlayerAvatar'
import PullToRefresh from '@/components/PullToRefresh'
import { computeRecords } from '@/lib/records'

interface Props {
  games: any[]
  shots: any[]
}

export default function RecordsClient({ games, shots }: Props) {
  const sections = computeRecords(games, shots)

  return (
    <div className="max-w-lg mx-auto pb-16 animate-fade-in">
      <PullToRefresh />

      {/* ── HERO ── */}
      <div className="relative px-4 pt-10 pb-8 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #1a4731 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, #c9a227 1.5px, transparent 1.5px)', backgroundSize: '36px 36px' }} />

        <Link href="/achievements"
          className="relative inline-block text-pool-chalk-dim text-sm font-body hover:text-pool-gold transition-colors mb-4">
          ← Badges
        </Link>

        <p className="font-body text-xs tracking-[0.35em] uppercase text-pool-chalk-dim relative">Thonara 2026</p>
        <h1 className="font-heading text-[3.5rem] leading-none tracking-widest text-pool-chalk relative mt-1">RECORDS</h1>
        <p className="font-body text-sm text-pool-chalk-dim mt-2 relative">All-time hall of fame</p>

        <div className="relative my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-pool-gold/30" />
          <span className="text-xl">🏅</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-pool-gold/30" />
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="px-4 text-center py-12">
          <p className="text-pool-chalk-dim font-body text-sm">No games played yet. Come back after your first session.</p>
        </div>
      ) : (
        sections.map(section => (
          <section key={section.id} className="px-4 pb-6">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="font-heading text-xs tracking-widest text-pool-chalk-dim shrink-0">
                {section.title.toUpperCase()}
              </span>
              <div className="flex-1 h-px bg-pool-border" />
            </div>

            <div className="space-y-2">
              {section.records.map(record => {
                const isTied = record.holders.length > 1
                const holderStyle = record.holders.length === 1
                  ? PLAYER_STYLES[record.holders[0].username]
                  : null

                return (
                  <div
                    key={record.id}
                    className="bg-pool-surface rounded-2xl border border-pool-border p-4"
                    style={holderStyle ? {
                      borderColor: `${holderStyle.color}33`,
                      background: `${holderStyle.color}08`,
                    } : undefined}
                  >
                    {/* Top row: icon + title + value */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="text-xl shrink-0 mt-0.5">{record.icon}</span>
                        <div className="min-w-0">
                          <p className="font-heading text-base tracking-wide text-pool-chalk leading-none">
                            {record.title.toUpperCase()}
                          </p>
                          <p className="font-body text-xs text-pool-chalk-dim mt-0.5 leading-relaxed">
                            {record.description}
                          </p>
                        </div>
                      </div>

                      {/* Value */}
                      <p
                        className="font-heading text-3xl tracking-wide shrink-0 leading-none"
                        style={{ color: holderStyle?.color ?? '#c9a227' }}
                      >
                        {record.value}
                      </p>
                    </div>

                    {/* Holder rows */}
                    <div className={`mt-3 pt-3 border-t border-pool-border/40 ${isTied ? 'space-y-2' : ''}`}>
                      {record.holders.map(holder => {
                        const style = PLAYER_STYLES[holder.username]
                        return (
                          <div key={holder.username} className="flex items-center gap-2">
                            <div style={{ filter: `drop-shadow(0 0 5px ${style.color}55)` }}>
                              <PlayerAvatar username={holder.username} size={28} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-heading text-sm tracking-wide" style={{ color: style.color }}>
                                {style.label.toUpperCase()}
                              </span>
                              {holder.context && (
                                <p className="font-body text-[10px] text-pool-chalk-dim leading-none mt-0.5 truncate">
                                  {holder.context}
                                </p>
                              )}
                            </div>
                            {isTied && (
                              <span className="font-heading text-base shrink-0" style={{ color: style.color }}>
                                {record.value}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
