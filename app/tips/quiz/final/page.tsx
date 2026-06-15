'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TIP_ARTICLES } from '@/lib/tips-content'
import { FINAL_QUIZ } from '@/lib/quiz-content'
import { useTipsProgress } from '@/components/tips/TipsProgressContext'
import QuizRunner from '@/components/tips/QuizRunner'
import QuizLeaderboard from '@/components/tips/QuizLeaderboard'

const GOLD = '#c9a227'
const QUIZ_KEY = 'final'

export default function FinalExamPage() {
  const { loading, currentUser, isCompletedByMe, quizResults, recordQuizScore } = useTipsProgress()
  const [freshResult, setFreshResult] = useState<{ score: number; total: number } | null>(null)
  const [retaking, setRetaking] = useState(false)

  if (loading) {
    return (
      <div className="max-w-lg mx-auto pb-16 px-4 pt-10 text-center">
        <p className="font-body text-sm text-pool-chalk-dim">Loading…</p>
      </div>
    )
  }

  const doneCount = currentUser ? TIP_ARTICLES.filter(a => isCompletedByMe(a.slug)).length : 0
  const unlocked = doneCount === TIP_ARTICLES.length

  const myResult = currentUser ? quizResults(QUIZ_KEY)[currentUser] ?? null : null

  const handleComplete = (score: number, total: number) => {
    setFreshResult({ score, total })
    recordQuizScore(QUIZ_KEY, score, total)
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

      <div className="pt-2 pb-5 text-center">
        <p className="text-3xl mb-1">🏆</p>
        <h1 className="font-heading text-3xl tracking-wide gold-shimmer leading-tight">The Final Exam</h1>
        <p className="font-body text-sm text-pool-chalk-dim mt-2">
          {TIP_ARTICLES.length} articles of coaching, distilled into {FINAL_QUIZ.length} questions.
        </p>
      </div>

      {!unlocked && (
        <div className="bg-pool-surface rounded-2xl border border-pool-border p-5 text-center">
          <p className="text-3xl mb-2">🔒</p>
          <p className="font-heading text-lg tracking-wide text-pool-chalk mb-1">Locked</p>
          <p className="font-body text-sm text-pool-chalk-dim mb-4">
            Read all {TIP_ARTICLES.length} Top Tips articles to unlock the Final Exam.
          </p>
          <div className="flex-1 h-1.5 rounded-full bg-pool-border overflow-hidden mb-2">
            <div className="h-full rounded-full" style={{ width: `${(doneCount / TIP_ARTICLES.length) * 100}%`, background: GOLD }} />
          </div>
          <p className="font-body text-xs text-pool-chalk-dim mb-4">{doneCount} / {TIP_ARTICLES.length} read</p>
          <Link
            href="/tips"
            className="inline-block font-heading text-sm tracking-widest uppercase rounded-xl px-5 py-2.5"
            style={{ background: GOLD, color: '#06150a' }}
          >
            Read Articles
          </Link>
        </div>
      )}

      {unlocked && showRunner && (
        <QuizRunner questions={FINAL_QUIZ} accentColor={GOLD} onComplete={handleComplete} />
      )}

      {unlocked && !showRunner && (
        <div className="flex flex-col gap-4">
          <div className="bg-pool-surface rounded-2xl border border-pool-border p-5 text-center">
            <p className="text-3xl mb-2">🏆</p>
            <p className="font-heading text-2xl tracking-wide text-pool-chalk mb-1">
              {(freshResult ?? myResult)?.score} / {(freshResult ?? myResult)?.total}
            </p>
            <p className="font-body text-sm text-pool-chalk-dim mb-4">Your Final Exam score</p>
            <button
              onClick={() => { setRetaking(true); setFreshResult(null) }}
              className="font-body text-xs tracking-wide px-4 py-2 rounded-full border border-pool-border text-pool-chalk-dim active:scale-95 transition-all"
            >
              Retake Exam
            </button>
          </div>
          <QuizLeaderboard quizKey={QUIZ_KEY} />
        </div>
      )}
    </div>
  )
}
