'use client'

import Link from 'next/link'
import PlayerAvatar from '@/components/PlayerAvatar'
import { PLAYERS, PLAYER_STYLES } from '@/lib/game-config'
import { TIP_ARTICLES, TIP_CATEGORIES, getTipsByCategory, type TipCategory } from '@/lib/tips-content'
import { useTipsProgress } from './TipsProgressContext'

export default function ArticleCompletion({ slug, category }: { slug: string; category: TipCategory }) {
  const { loading, currentUser, completedBy, isCompletedByMe, toggleCompletion } = useTipsProgress()

  if (loading) return null

  const completed = completedBy(slug)
  const iCompleted = isCompletedByMe(slug)
  const cat = TIP_CATEGORIES[category]

  const categoryArticles = getTipsByCategory(category)
  const categoryDone = !!currentUser && categoryArticles.every(a => completedBy(a.slug).includes(currentUser))
  const allDone = !!currentUser && TIP_ARTICLES.every(a => completedBy(a.slug).includes(currentUser))

  return (
    <div className="mb-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 bg-pool-surface rounded-2xl border border-pool-border px-4 py-3">
        <div className="flex items-center gap-2">
          {PLAYERS.map(username => {
            const has = completed.includes(username)
            const style = PLAYER_STYLES[username]
            return (
              <div key={username} className="relative" style={{ opacity: has ? 1 : 0.25 }} title={`${style.label}${has ? ' has read this' : ''}`}>
                <PlayerAvatar username={username} size={28} />
                {has && (
                  <span
                    className="absolute -bottom-1 -right-1 flex items-center justify-center w-3.5 h-3.5 rounded-full text-[8px] leading-none"
                    style={{ background: '#22c55e', color: '#06150a' }}
                  >
                    ✓
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <button
          onClick={() => toggleCompletion(slug)}
          disabled={!currentUser}
          className="font-body text-xs tracking-wide px-3 py-1.5 rounded-full border transition-all active:scale-95 shrink-0"
          style={{
            borderColor: iCompleted ? '#22c55e' : 'rgb(var(--pool-border))',
            background: iCompleted ? '#22c55e22' : 'transparent',
            color: iCompleted ? '#22c55e' : 'rgb(var(--pool-chalk-dim))',
          }}
        >
          {iCompleted ? '✓ Read' : 'Mark as read'}
        </button>
      </div>

      {categoryDone && (
        <Link
          href={`/tips/quiz/${category}`}
          className="card-hover flex items-center justify-between gap-3 rounded-2xl border p-4 active:scale-[0.99]"
          style={{ borderColor: `${cat.color}40`, background: `${cat.color}10` }}
        >
          <div>
            <p className="font-heading text-sm tracking-widest" style={{ color: cat.color }}>CATEGORY COMPLETE</p>
            <p className="font-body text-xs text-pool-chalk-dim mt-1">Take the {cat.label} quiz</p>
          </div>
          <span className="text-2xl">{cat.icon}</span>
        </Link>
      )}

      {allDone && (
        <Link
          href="/tips/quiz/final"
          className="card-hover flex items-center justify-between gap-3 rounded-2xl border p-4 active:scale-[0.99]"
          style={{ borderColor: '#c9a22740', background: '#c9a22710' }}
        >
          <div>
            <p className="font-heading text-sm tracking-widest text-pool-gold">ALL 51 ARTICLES COMPLETE</p>
            <p className="font-body text-xs text-pool-chalk-dim mt-1">Take the Final Exam</p>
          </div>
          <span className="text-2xl">🏆</span>
        </Link>
      )}
    </div>
  )
}
