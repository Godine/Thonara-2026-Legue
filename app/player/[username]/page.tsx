export const revalidate = 60

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchCompletedGames, fetchAllShots } from '@/lib/queries'
import { PLAYERS, type PlayerUsername } from '@/lib/game-config'
import PlayerProfileClient from './PlayerProfileClient'

export default async function PlayerProfilePage({ params }: { params: { username: string } }) {
  const { username } = params
  if (!PLAYERS.includes(username as PlayerUsername)) notFound()

  const db = createClient()
  const [games, shots] = await Promise.all([
    fetchCompletedGames(db),
    fetchAllShots(db),
  ])

  return (
    <PlayerProfileClient
      username={username as PlayerUsername}
      games={games as any}
      shots={shots as any}
    />
  )
}
