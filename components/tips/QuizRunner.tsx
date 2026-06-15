'use client'

import { useState } from 'react'
import type { QuizQuestion } from '@/lib/quiz-content'

interface Props {
  questions: QuizQuestion[]
  accentColor: string
  onComplete: (score: number, total: number) => void
}

export default function QuizRunner({ questions, accentColor, onComplete }: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)

  const q = questions[index]
  const isLast = index === questions.length - 1

  const choose = (i: number) => {
    if (selected !== null) return
    setSelected(i)
    if (i === q.correctIndex) setScore(s => s + 1)
  }

  const next = () => {
    if (isLast) {
      onComplete(score, questions.length)
      return
    }
    setIndex(i => i + 1)
    setSelected(null)
  }

  return (
    <div className="bg-pool-surface rounded-2xl border border-pool-border p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="font-body text-[10px] tracking-widest uppercase text-pool-chalk-dim">
          Question {index + 1} / {questions.length}
        </p>
        <div className="flex-1 mx-3 h-1.5 rounded-full bg-pool-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${((index + (selected !== null ? 1 : 0)) / questions.length) * 100}%`, background: accentColor }}
          />
        </div>
        <p className="font-body text-[10px] tracking-widest uppercase text-pool-chalk-dim">{score} pts</p>
      </div>

      <p className="font-heading text-lg tracking-wide text-pool-chalk leading-tight mb-4">{q.question}</p>

      <div className="flex flex-col gap-2">
        {q.options.map((option, i) => {
          const isSelected = selected === i
          const isCorrect = i === q.correctIndex
          let borderColor = 'rgb(var(--pool-border))'
          let background = 'transparent'
          let color = 'rgb(var(--pool-chalk))'
          if (selected !== null) {
            if (isCorrect) {
              borderColor = '#22c55e'
              background = '#22c55e1a'
              color = '#22c55e'
            } else if (isSelected) {
              borderColor = '#ef4444'
              background = '#ef44441a'
              color = '#ef4444'
            } else {
              color = 'rgb(var(--pool-chalk-dim))'
            }
          }
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={selected !== null}
              className="text-left font-body text-sm rounded-xl border px-4 py-3 transition-all active:scale-[0.99]"
              style={{ borderColor, background, color }}
            >
              {option}
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <button
          onClick={next}
          className="mt-4 w-full font-heading text-sm tracking-widest uppercase rounded-xl px-4 py-3 transition-all active:scale-[0.99]"
          style={{ background: accentColor, color: '#06150a' }}
        >
          {isLast ? 'See Results' : 'Next Question ›'}
        </button>
      )}
    </div>
  )
}
