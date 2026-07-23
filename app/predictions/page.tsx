import { createClient } from '@/lib/supabase/server'
import { fetchCompletedGames } from '@/lib/queries/games'
import { fetchAllShots } from '@/lib/queries/shots'
import PredictionsClient from './PredictionsClient'

export const revalidate = 60

export default async function PredictionsPage() {
  const db = createClient()
  const [games, shots] = await Promise.all([
    fetchCompletedGames(db),
    fetchAllShots(db),
  ])
  return <PredictionsClient games={games} shots={shots} />
}
