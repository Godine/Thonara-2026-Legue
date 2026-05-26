import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { findSessionByDate, createSession } from '@/lib/queries'

export default async function NewSessionPage() {
  const db = createClient()
  const date = format(new Date(), 'yyyy-MM-dd')

  const existing = await findSessionByDate(db, date)
  if (existing) {
    redirect(`/session/${existing.id}`)
  }

  const result = await createSession(db, date)
  if (!result.ok) {
    redirect('/')
  }

  redirect(`/session/${result.id}`)
}
