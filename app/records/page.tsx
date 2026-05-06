export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { fetchCompletedGames } from '@/lib/queries/games'
import { fetchAllShots } from '@/lib/queries/shots'
import RecordsClient from './RecordsClient'

export default async function RecordsPage() {
  const db = createClient()
  const [games, shots] = await Promise.all([
    fetchCompletedGames(db),
    fetchAllShots(db),
  ])

  return <RecordsClient games={games as any} shots={shots as any} />
}
