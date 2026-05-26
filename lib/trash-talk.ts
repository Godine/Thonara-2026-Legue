import type { Player, Shot } from '@/types/database'
import type { PlayerStats } from '@/lib/stats'

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pickTrashTalk(
  winner: Player,
  loser: Player,
  wStats: PlayerStats,
  lStats: PlayerStats,
  shots: Shot[],
  loserPottedBlack: boolean,
): string {
  const wAcc = wStats.shots > 0 ? Math.round((wStats.ownPotted / wStats.shots) * 100) : 0
  const lAcc = lStats.shots > 0 ? Math.round((lStats.ownPotted / lStats.shots) * 100) : 0
  const w = winner.display_name
  const l = loser.display_name
  const totalShots = shots.length

  // Collect qualifying roasts, most specific first
  const tier1: string[] = []
  const tier2: string[] = []
  const tier3: string[] = []

  // ── Tier 1: peak humiliation ────────────────────────────────────────

  if (loserPottedBlack) {
    tier1.push(
      `${l} potted the black ball and handed ${w} the win gift-wrapped. Genuinely impressive. 🎁`,
      `Didn't even need to finish — ${l} just ended it themselves. ${w} barely had to show up. 💀`,
      `The only pot that mattered and ${l} scored it for the wrong team. 🖤`,
    )
  }

  if (lStats.ownPotted === 0 && lStats.shots >= 3) {
    tier1.push(
      `${lStats.shots} shots. Zero pots. ${l} was basically just chalking the cue for ${w}. 🙃`,
      `${l} went ${lStats.shots}-for-0 from the table. The pockets are literally 6 of them — statistically impressive to miss all of them. 😬`,
      `Not a single pot from ${l} in ${lStats.shots} attempts. Moral support only. 📿`,
    )
  }

  if (lStats.errors >= 4) {
    tier1.push(
      `${lStats.errors} fouls from ${l}. At some point that's just a donation scheme for ${w}. 💸`,
      `${l} committed ${lStats.errors} errors. That's not pool, that's self-sabotage. 🔴`,
      `${lStats.errors} fouls. ${l} gifted ${w} more free turns than they earned shots. 🤦`,
    )
  }

  if (lStats.shots > 0 && wStats.shots > 0 && lStats.shots >= wStats.shots * 2.2) {
    tier1.push(
      `${l} needed ${lStats.shots} shots. ${w} needed ${wStats.shots}. ${l} was out here writing an essay when a sentence would do. 📝`,
      `${wStats.shots} vs ${lStats.shots} shots. ${l} played twice the game and won half as much. 📉`,
    )
  }

  // ── Tier 2: solid burns ─────────────────────────────────────────────

  if (lAcc <= 25 && lStats.shots >= 5) {
    tier2.push(
      `${lAcc}% accuracy from ${l}. The table wasn't the problem. The player was. 👀`,
      `${l} shot ${lAcc}% today. The pockets were there. They were right there. 🕳️`,
      `${lStats.shots} attempts, ${lStats.ownPotted} pots. ${l} managed to miss ${lStats.shots - lStats.ownPotted} times. Impressive commitment to failure. 🎪`,
    )
  }

  if (lStats.errors >= 2 && lStats.errors < 4) {
    tier2.push(
      `${lStats.errors} errors from ${l} — at some point you're just playing for the other team. 🫠`,
      `${l} fouled ${lStats.errors} times and still expected to win. Bold strategy. 😐`,
    )
  }

  if (lStats.lucky >= 2 && lStats.ownPotted <= wStats.ownPotted) {
    tier2.push(
      `${l} got ${lStats.lucky} flukes — the universe tried to help and they still lost. That takes talent. 🍀❌`,
      `${lStats.lucky} lucky pots for ${l} and it still wasn't enough. Luck has limits, apparently. 😶`,
    )
  }

  if (wAcc >= 65 && wStats.shots >= 5) {
    tier2.push(
      `${wAcc}% accuracy from ${w}. Clean, clinical, cold-blooded. No drama needed. 🎯`,
      `${w} potted ${wStats.ownPotted} from ${wStats.shots} shots at ${wAcc}%. ${l} just watched. 🧊`,
    )
  }

  if (wStats.lucky >= 2 && wAcc < 45) {
    tier2.push(
      `${w} shot ${wAcc}% and still won. ${l} just handed it to them on a plate. 🍽️`,
      `${w} needed ${wStats.lucky} flukes and ${wAcc}% accuracy to beat ${l}. Let that marinate. 🤌`,
    )
  }

  if (lStats.shots > 0 && wStats.shots > 0 && lStats.shots >= wStats.shots * 1.6) {
    tier2.push(
      `${w} used ${wStats.shots} shots to ${l}'s ${lStats.shots}. One of them was efficient. 🏎️`,
      `${l} took ${lStats.shots} shots. ${w} took ${wStats.shots}. Efficiency gap is real. ⚡`,
    )
  }

  if (totalShots <= 8 && wStats.ownPotted >= 4) {
    tier2.push(
      `Game over in ${totalShots} shots. ${l} barely got a turn. 💨`,
      `${w} ran the table in ${totalShots} shots. ${l} was basically a spectator. 👁️`,
    )
  }

  // ── Tier 3: always-valid fallbacks ─────────────────────────────────

  tier3.push(
    `${w} wins. ${l} played well… for someone who lost. 🙂`,
    `Another L for ${l}. ${w} didn't even break a sweat. 💅`,
    `${w} takes it. ${l} will spend the next hour figuring out what went wrong. 🔮`,
    `${l} had their chances. They just didn't take them. ${w} did. Simple as that. 🏆`,
    `${w} wins ${wStats.ownPotted}-${lStats.ownPotted}. ${l}: plenty of time to practice. 📅`,
  )

  // Pick from the highest available tier
  if (tier1.length > 0) return pick(tier1)
  if (tier2.length > 0) return pick(tier2)
  return pick(tier3)
}
