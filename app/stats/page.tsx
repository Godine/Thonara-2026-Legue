export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { fetchCompletedGames, fetchAllShots } from '@/lib/queries'
import StatsClient from './StatsClient'
import Link from 'next/link'

export default async function StatsPage() {
  const db = createClient()
  const [games, shots] = await Promise.all([
    fetchCompletedGames(db),
    fetchAllShots(db),
  ])

  if (!games.length) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">📊</div>
        <p className="font-heading text-2xl text-pool-chalk tracking-wider mb-2">NO DATA YET</p>
        <p className="font-body text-pool-chalk-dim text-sm mb-6">Play some games and come back here to see the stats.</p>
        <Link href="/" className="text-pool-gold font-body text-sm hover:underline">← Start playing</Link>
      </div>
    )
  }

  return <StatsClient games={games as any} shots={shots as any} />
}
