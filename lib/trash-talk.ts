import type { Player, Shot } from '@/types/database'
import type { PlayerStats } from '@/lib/stats'

export function pickTrashTalk(
  winner: Player,
  loser: Player,
  wStats: PlayerStats,
  lStats: PlayerStats,
  shots: Shot[],
  loserPottedBlack: boolean,
): string {
  const lines: string[] = []
  const wAcc = wStats.shots > 0 ? Math.round((wStats.ownPotted / wStats.shots) * 100) : 0
  const lAcc = lStats.shots > 0 ? Math.round((lStats.ownPotted / lStats.shots) * 100) : 0
  const wName = winner.display_name
  const lName = loser.display_name

  if (loserPottedBlack)
    lines.push(`${lName} literally handed ${wName} the win. Gifted. Wrapped. With a bow. 🎁`)
  if (lStats.errors >= 3)
    lines.push(`${lStats.errors} errors from ${lName}. The table wasn't the problem. 🫠`)
  if (lStats.lucky >= 2)
    lines.push(`${lStats.lucky} flukes from ${lName} and still lost? That's impressive in the wrong way. 🍀😬`)
  if (wStats.lucky >= 2 && wAcc < 50)
    lines.push(`${wName} shot ${wAcc}% but won. Pure luck wrapped in a victory dance. 💃`)
  if (wAcc >= 70 && wStats.shots >= 5)
    lines.push(`${wAcc}% accuracy from ${wName}. Clinical. Cold-blooded. No mercy. 🎯`)
  if (lAcc < 30 && lStats.shots >= 5)
    lines.push(`${lAcc}% accuracy, ${lName}? The pockets were right there. Just saying. 👀`)
  if (wStats.shots > 0 && lStats.shots > 0 && wStats.shots < lStats.shots * 0.6)
    lines.push(`${wName} needed ${wStats.shots} shots. ${lName} needed ${lStats.shots}. Let that sink in. ⏱️`)
  if (lStats.ownPotted === 0 && lStats.shots >= 3)
    lines.push(`${lStats.shots} shots. Zero pots. ${lName}, the table called — it wants a break. 😭`)

  if (lines.length === 0) {
    const fallbacks = [
      `${wName} wins again. ${lName} will have their revenge… eventually. 🔮`,
      `Another day, another L for ${lName}. At least they showed up. 🫡`,
      `${wName} took it home tonight. Clean, easy, inevitable. 👑`,
    ]
    return fallbacks[Math.floor(Math.random() * fallbacks.length)]
  }
  return lines[Math.floor(Math.random() * lines.length)]
}
