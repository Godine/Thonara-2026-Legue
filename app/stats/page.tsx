import { createClient } from '@/lib/supabase/server'
import StatsClient from './StatsClient'
import Link from 'next/link'

export default async function StatsPage() {
  const supabase = createClient()

  const [{ data: gamesData }, { data: shotsData }] = await Promise.all([
    supabase
      .from('games')
      .select(`
        id, game_number, session_id, player1_id, player2_id, winner_id, loser_potted_black,
        player1:players!games_player1_id_fkey (id, username, display_name),
        player2:players!games_player2_id_fkey (id, username, display_name),
        winner:players!games_winner_id_fkey  (id, username, display_name),
        session:sessions (id, date)
      `)
      .eq('is_complete', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('shots')
      .select('id, game_id, player_id, potted, is_lucky, is_error, shot_number, created_at'),
  ])

  if (!gamesData?.length) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">📊</div>
        <p className="font-heading text-2xl text-pool-chalk tracking-wider mb-2">NO DATA YET</p>
        <p className="font-body text-pool-chalk-dim text-sm mb-6">Play some games and come back here to see the stats.</p>
        <Link href="/" className="text-pool-gold font-body text-sm hover:underline">← Start playing</Link>
      </div>
    )
  }

  return <StatsClient games={gamesData as any} shots={(shotsData ?? []) as any} />
}
