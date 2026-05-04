import type { StandingBasic } from '@/lib/queries'

export function generateNarrative(standings: StandingBasic[]): string {
  if (!standings.length || standings.every(s => s.games_played === 0))
    return 'No games played yet this season — tonight everything starts.'
  const sorted = [...standings].sort((a, b) => b.wins - a.wins)
  const [first, second, third] = sorted
  const gap12 = first.wins - second.wins
  const gap23 = second.wins - third.wins
  if (gap12 === 0)
    return `${first.display_name} and ${second.display_name} are level at the top. Tonight could split them.`
  if (gap12 >= 4)
    return `${first.display_name} is pulling away with ${first.wins} wins. The others need a big night.`
  if (gap12 === 1 && gap23 === 0)
    return `${first.display_name} leads by one win. ${second.display_name} and ${third.display_name} are right behind.`
  if (gap12 === 1)
    return `${first.display_name} leads by a single win. One bad session and it's level again.`
  if (gap12 === 2)
    return `${first.display_name} is two wins clear. ${second.display_name} needs a perfect night to catch up.`
  return `${first.display_name} leads the table — but ${second.display_name} is right there.`
}
