'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getStoredPlayer } from '@/components/PlayerGate'
import { PLAYERS, type PlayerUsername } from '@/lib/game-config'
import {
  fetchTipCompletions,
  fetchQuizScores,
  markTipComplete,
  unmarkTipComplete,
  submitQuizScore,
} from '@/lib/queries/tips-progress'
import type { TipCompletion, QuizScore } from '@/types/database'

interface QuizResult {
  score: number
  total: number
}

interface TipsProgressContextValue {
  loading: boolean
  currentUser: PlayerUsername | null
  completedBy: (slug: string) => PlayerUsername[]
  isCompletedByMe: (slug: string) => boolean
  toggleCompletion: (slug: string) => Promise<void>
  quizResults: (quizKey: string) => Partial<Record<PlayerUsername, QuizResult>>
  recordQuizScore: (quizKey: string, score: number, total: number) => Promise<void>
}

const TipsProgressContext = createContext<TipsProgressContextValue | null>(null)

export function useTipsProgress(): TipsProgressContextValue {
  const ctx = useContext(TipsProgressContext)
  if (!ctx) throw new Error('useTipsProgress must be used within TipsProgressProvider')
  return ctx
}

function isPlayerUsername(u: string): u is PlayerUsername {
  return (PLAYERS as string[]).includes(u)
}

export default function TipsProgressProvider({ children }: { children: React.ReactNode }) {
  const [completions, setCompletions] = useState<TipCompletion[]>([])
  const [scores, setScores] = useState<QuizScore[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<PlayerUsername | null>(null)

  useEffect(() => {
    setCurrentUser(getStoredPlayer())
  }, [])

  useEffect(() => {
    const db = createClient()
    let cancelled = false

    const load = async () => {
      const [c, s] = await Promise.all([fetchTipCompletions(db), fetchQuizScores(db)])
      if (cancelled) return
      setCompletions(c)
      setScores(s)
      setLoading(false)
    }
    load()

    const channel = db
      .channel('tips-progress')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tip_completions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_scores' }, load)
      .subscribe()

    return () => {
      cancelled = true
      db.removeChannel(channel)
    }
  }, [])

  const completedBy = useCallback((slug: string): PlayerUsername[] => {
    return completions
      .filter(c => c.slug === slug)
      .map(c => c.username)
      .filter(isPlayerUsername)
  }, [completions])

  const isCompletedByMe = useCallback((slug: string): boolean => {
    return !!currentUser && completedBy(slug).includes(currentUser)
  }, [completedBy, currentUser])

  const toggleCompletion = useCallback(async (slug: string) => {
    if (!currentUser) return
    const db = createClient()
    const already = completedBy(slug).includes(currentUser)
    if (already) {
      setCompletions(prev => prev.filter(c => !(c.username === currentUser && c.slug === slug)))
      await unmarkTipComplete(db, currentUser, slug)
    } else {
      setCompletions(prev => [
        ...prev,
        { id: `${currentUser}-${slug}`, username: currentUser, slug, completed_at: new Date().toISOString() },
      ])
      await markTipComplete(db, currentUser, slug)
    }
  }, [completedBy, currentUser])

  const quizResults = useCallback((quizKey: string): Partial<Record<PlayerUsername, QuizResult>> => {
    const result: Partial<Record<PlayerUsername, QuizResult>> = {}
    for (const s of scores) {
      if (s.quiz_key === quizKey && isPlayerUsername(s.username)) {
        result[s.username] = { score: s.score, total: s.total }
      }
    }
    return result
  }, [scores])

  const recordQuizScore = useCallback(async (quizKey: string, score: number, total: number) => {
    if (!currentUser) return
    const db = createClient()
    setScores(prev => [
      ...prev.filter(s => !(s.username === currentUser && s.quiz_key === quizKey)),
      { id: `${currentUser}-${quizKey}`, username: currentUser, quiz_key: quizKey, score, total, completed_at: new Date().toISOString() },
    ])
    await submitQuizScore(db, currentUser, quizKey, score, total)
  }, [currentUser])

  return (
    <TipsProgressContext.Provider
      value={{ loading, currentUser, completedBy, isCompletedByMe, toggleCompletion, quizResults, recordQuizScore }}
    >
      {children}
    </TipsProgressContext.Provider>
  )
}
