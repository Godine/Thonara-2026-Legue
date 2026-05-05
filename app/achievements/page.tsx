export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { fetchCompletedGames, fetchAllShots } from '@/lib/queries'
import AchievementsClient from './AchievementsClient'

export default async function AchievementsPage() {
  const db = createClient()
  const [games, shots] = await Promise.all([
    fetchCompletedGames(db),
    fetchAllShots(db),
  ])

  return <AchievementsClient games={games as any} shots={shots as any} />
}
