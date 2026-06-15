'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  TIP_ARTICLES,
  TIP_CATEGORIES,
  TIP_CATEGORY_ORDER,
  TIP_LEVEL_STYLES,
  type TipCategory,
} from '@/lib/tips-content'

export default function TipsPage() {
  const [active, setActive] = useState<TipCategory | 'all'>('all')

  const articles = active === 'all'
    ? TIP_ARTICLES
    : TIP_ARTICLES.filter(t => t.category === active)

  return (
    <div className="max-w-lg mx-auto pb-16 animate-fade-in">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="relative px-4 pt-10 pb-8 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #1a4731 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, #c9a227 1.5px, transparent 1.5px)', backgroundSize: '36px 36px' }} />

        <p className="font-body text-xs tracking-[0.35em] uppercase text-pool-chalk-dim relative">Thonara League</p>
        <h1 className="font-heading text-[3.5rem] leading-none tracking-widest text-pool-chalk relative mt-1">TOP TIPS</h1>
        <p className="font-body text-sm text-pool-chalk-dim mt-2 relative">
          {TIP_ARTICLES.length} coaching articles — technique, strategy & the mental game
        </p>

        <div className="relative my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-pool-gold/30" />
          <span className="text-xl">🎓</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-pool-gold/30" />
        </div>
      </div>

      {/* ── CATEGORY FILTER ──────────────────────────────────────────── */}
      <section className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActive('all')}
            className="shrink-0 px-3 py-1.5 rounded-full font-body text-xs tracking-wide border transition-all active:scale-95"
            style={{
              borderColor: active === 'all' ? '#c9a227' : 'rgb(var(--pool-border))',
              background:  active === 'all' ? '#c9a22722' : 'transparent',
              color:       active === 'all' ? '#c9a227' : 'rgb(var(--pool-chalk-dim))',
            }}
          >
            All ({TIP_ARTICLES.length})
          </button>
          {TIP_CATEGORY_ORDER.map(cat => {
            const info = TIP_CATEGORIES[cat]
            const count = TIP_ARTICLES.filter(t => t.category === cat).length
            const isActive = active === cat
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs tracking-wide border transition-all active:scale-95"
                style={{
                  borderColor: isActive ? info.color : 'rgb(var(--pool-border))',
                  background:  isActive ? `${info.color}22` : 'transparent',
                  color:       isActive ? info.color : 'rgb(var(--pool-chalk-dim))',
                }}
              >
                <span>{info.icon}</span> {info.label} ({count})
              </button>
            )
          })}
        </div>
      </section>

      {/* ── ARTICLE LIST ─────────────────────────────────────────────── */}
      <section className="px-4 space-y-2">
        {articles.map(tip => {
          const cat = TIP_CATEGORIES[tip.category]
          const level = TIP_LEVEL_STYLES[tip.level]
          return (
            <Link
              key={tip.slug}
              href={`/tips/${tip.slug}`}
              className="card-hover flex items-start gap-3 bg-pool-surface rounded-2xl border border-pool-border p-4 hover:border-pool-gold/30 transition-colors active:scale-[0.99]"
            >
              <span className="text-2xl shrink-0 mt-0.5">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-body text-[10px] tracking-widest uppercase" style={{ color: cat.color }}>
                    {cat.label}
                  </span>
                  <span className="text-pool-chalk-dim text-[10px]">·</span>
                  <span className="font-body text-[10px] tracking-wide" style={{ color: level.color }}>
                    {level.label}
                  </span>
                </div>
                <p className="font-heading text-lg tracking-wide text-pool-chalk leading-tight">
                  {tip.title}
                </p>
                <p className="font-body text-xs text-pool-chalk-dim mt-1 leading-relaxed">
                  {tip.summary}
                </p>
                <p className="font-body text-[10px] text-pool-chalk-dim mt-2">
                  {tip.readMin} min read
                </p>
              </div>
              <span className="text-pool-chalk-dim text-lg shrink-0 mt-1">›</span>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
