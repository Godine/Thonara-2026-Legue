'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  TIP_CATEGORIES,
  TIP_CATEGORY_ORDER,
  getTipsByCategory,
  type TipCategory,
} from '@/lib/tips-content'
import { CATEGORY_QUIZZES } from '@/lib/quiz-content'
import { useTipsProgress } from '@/components/tips/TipsProgressContext'
import QuizRunner from '@/components/tips/QuizRunner'
import QuizLeaderboard from '@/components/tips/QuizLeaderboard'

export default function CategoryQuizPage({ params }: { params: { category: string } }) {
  const category = params.category as TipCategory
  const { loading, currentUser, isCompletedByMe, quizResults, recordQuizScore } = useTipsProgress()
  const [freshResult, setFreshResult] = useState<{ score: number; total: number } | null>(null)
  const [retaking, setRetaking] = useState(false)

  if (!TIP_CATEGORY_ORDER.includes(category)) {
    return (
      <div className="max-w-lg mx-auto pb-16 px-4 pt-10 text-center">
        <p className="font-body text-sm text-pool-chalk-dim mb-4">Quiz not found.</p>
        <Link href="/tips" className="font-body text-sm text-pool-gold">‹ Back to Top Tips</Link>
      </div>
    )
  }

  const cat = TIP_CATEGORIES[category]
  const articles = getTipsByCategory(category)
  const questions = CATEGORY_QUIZZES[category]

  if (loading) {
    return (
      <div className="max-w-lg mx-auto pb-16 px-4 pt-10 text-center">
        <p className="font-body text-sm text-pool-chalk-dim">Loading…</p>
      </div>
    )
  }

  const doneCount = currentUser ? articles.filter(a => isCompletedByMe(a.slug)).length : 0
  const unlocked = doneCount === articles.length

  const myResult = currentUser ? quizResults(category)[currentUser] ?? null : null

  const handleComplete = (score: number, total: number) => {
    setFreshResult({ score, total })
    recordQuizScore(category, score, total)
    setRetaking(false)
  }

  const showRunner = unlocked && (retaking || (!myResult && !freshResult))

  return (
    <div className="max-w-lg mx-auto pb-16 animate-fade-in px-4">
      <div className="pt-4 pb-2">
        <Link href="/tips" className="font-body text-sm text-pool-chalk-dim hover:text-pool-gold transition-colors">
          ‹ Top Tips
        </Link>
      </div>

      <div className="pt-2 pb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{cat.icon}</span>
          <span className="font-body text-xs tracking-widest uppercase" style={{ color: cat.color }}>
            {cat.label}
          </span>
        </div>
        <h1 className="font-heading text-3xl tracking-wide text-pool-chalk leading-tight">Category Quiz</h1>
      </div>

      {!unlocked && (
        <div className="bg-pool-surface rounded-2xl border border-pool-border p-5 text-center">
          <p className="text-3xl mb-2">🔒</p>
          <p className="font-heading text-lg tracking-wide text-pool-chalk mb-1">Quiz Locked</p>
          <p className="font-body text-sm text-pool-chalk-dim mb-4">
            Read all {articles.length} {cat.label} articles to unlock this quiz.
          </p>
          <div className="flex-1 h-1.5 rounded-full bg-pool-border overflow-hidden mb-2">
            <div className="h-full rounded-full" style={{ width: `${(doneCount / articles.length) * 100}%`, background: cat.color }} />
          </div>
          <p className="font-body text-xs text-pool-chalk-dim mb-4">{doneCount} / {articles.length} read</p>
          <Link
            href="/tips"
            className="inline-block font-heading text-sm tracking-widest uppercase rounded-xl px-5 py-2.5"
            style={{ background: cat.color, color: '#06150a' }}
          >
            Read Articles
          </Link>
        </div>
      )}

      {unlocked && showRunner && (
        <QuizRunner questions={questions} accentColor={cat.color} onComplete={handleComplete} />
      )}

      {unlocked && !showRunner && (
        <div className="flex flex-col gap-4">
          <div className="bg-pool-surface rounded-2xl border border-pool-border p-5 text-center">
            <p className="text-3xl mb-2">{cat.icon}</p>
            <p className="font-heading text-2xl tracking-wide text-pool-chalk mb-1">
              {(freshResult ?? myResult)?.score} / {(freshResult ?? myResult)?.total}
            </p>
            <p className="font-body text-sm text-pool-chalk-dim mb-4">Your {cat.label} quiz score</p>
            <button
              onClick={() => { setRetaking(true); setFreshResult(null) }}
              className="font-body text-xs tracking-wide px-4 py-2 rounded-full border border-pool-border text-pool-chalk-dim active:scale-95 transition-all"
            >
              Retake Quiz
            </button>
          </div>
          <QuizLeaderboard quizKey={category} />
        </div>
      )}
    </div>
  )
}
