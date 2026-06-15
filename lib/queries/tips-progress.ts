import type { SupabaseClient } from '@supabase/supabase-js'
import type { TipCompletion, QuizScore } from '@/types/database'

export async function fetchTipCompletions(db: SupabaseClient): Promise<TipCompletion[]> {
  const { data } = await db.from('tip_completions').select('*')
  return (data as TipCompletion[]) ?? []
}

export async function markTipComplete(db: SupabaseClient, username: string, slug: string) {
  await db.from('tip_completions').upsert({ username, slug }, { onConflict: 'username,slug' })
}

export async function unmarkTipComplete(db: SupabaseClient, username: string, slug: string) {
  await db.from('tip_completions').delete().eq('username', username).eq('slug', slug)
}

export async function fetchQuizScores(db: SupabaseClient): Promise<QuizScore[]> {
  const { data } = await db.from('quiz_scores').select('*')
  return (data as QuizScore[]) ?? []
}

export async function submitQuizScore(
  db: SupabaseClient,
  username: string,
  quizKey: string,
  score: number,
  total: number,
) {
  await db
    .from('quiz_scores')
    .upsert(
      { username, quiz_key: quizKey, score, total, completed_at: new Date().toISOString() },
      { onConflict: 'username,quiz_key' },
    )
}
