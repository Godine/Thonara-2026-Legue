# Thonara 2026 League — CLAUDE.md

## Project overview
Pool league tracker for 3 friends: **Adib**, **Ahmed** (also called Shin), **Godine**.
6-game round-robin per session. Next.js 14 App Router, Supabase (PostgreSQL + Realtime), Recharts, Tailwind CSS. Deployed on Vercel — auto-deploys on every push to any branch.

**Dev branch:** `claude/pool-league-tracker-design-MZa8A`
Always develop on this branch, push when done.

---

## Tech stack
- **Framework:** Next.js 14.2.35, App Router, TypeScript
- **Database:** Supabase (no auth / RLS disabled), Realtime subscriptions via `postgres_changes`
- **Charts:** Recharts (`LineChart`, `BarChart` layout=vertical, `Cell`, `ResponsiveContainer`)
- **Fonts:** Bebas Neue (`font-heading`), DM Sans (`font-body`)
- **CSS:** Tailwind with custom `pool-*` colour tokens (see `tailwind.config.ts`)
- **PWA:** `app/manifest.ts`, `app/icon.tsx` (512px), `app/apple-icon.tsx` (180px)

---

## Players & config — `lib/game-config.ts`
```ts
export type PlayerUsername = 'adib' | 'ahmed' | 'godine'

export const PLAYER_STYLES = {
  adib:   { color: '#f5c518', dimColor: '#7a6209', number: 1, label: 'Adib',   photo: '/photos/adib.jpg'   },
  ahmed:  { color: '#60a5fa', dimColor: '#1e3a5f', number: 2, label: 'Ahmed',  photo: '/photos/ahmed.jpg'  },
  godine: { color: '#f87171', dimColor: '#7a2020', number: 3, label: 'Godine', photo: '/photos/godine.jpg' },
}

export const GAME_SCHEDULE = [
  { gameNumber: 1, player1: 'godine', player2: 'ahmed',  scorer: 'adib'   },
  { gameNumber: 2, player1: 'adib',   player2: 'ahmed',  scorer: 'godine' },
  { gameNumber: 3, player1: 'adib',   player2: 'godine', scorer: 'ahmed'  },
  { gameNumber: 4, player1: 'ahmed',  player2: 'godine', scorer: 'adib'   },
  { gameNumber: 5, player1: 'ahmed',  player2: 'adib',   scorer: 'godine' },
  { gameNumber: 6, player1: 'godine', player2: 'adib',   scorer: 'ahmed'  },
]
```

Player photos live in `public/photos/adib.jpg`, `ahmed.jpg`, `godine.jpg`.

---

## Key components

### `components/PlayerAvatar.tsx`
Client component. Shows player photo in circular frame with coloured border + glow. Falls back silently to `PlayerBall` SVG on 404.

### `components/PlayerBall.tsx`
Full 3D SVG pool ball. 5 radial gradients (sphere, specular highlight, fill-light, ambient occlusion, number oval shadow). Ball `cy="22"`, contact shadow at `cy="46.5"`.

### `components/PlayerGate.tsx`
Full-screen overlay on first visit. Player picks who they are; saved to `localStorage` key `thonara_player`. Exports `getStoredPlayer()`, `setStoredPlayer()`, `clearStoredPlayer()`.

### `components/Navbar.tsx`
Fixed top navbar. Desktop: inline links. Mobile: hamburger → animated X with slide-down dropdown. Shows player chip (PlayerAvatar) with chevron. Closes on outside click and navigation. Uses `usePathname` for active route highlight.

---

## App pages

### `app/page.tsx` (Dashboard)
Server component. Fetches `league_standings` view + most recent session with games. Shows:
- Hero header (THONARA / LEAGUE)
- Standings sorted by wins (with rank badges 🥇🥈🥉)
- START SESSION CTA button → `/session/new`
- Last session game results

### `app/session/new/page.tsx`
Creates a new session + 6 games per `GAME_SCHEDULE`, redirects to `/session/[id]`.

### `app/session/[id]/page.tsx`
Session overview. Lists all 6 games with status and links to each game page.

### `app/session/[id]/game/[gameId]/page.tsx` ← MAIN GAME PAGE
Client component. Key state:
```ts
const [game, setGame]         = useState<GameFull | null>(null)
const [shots, setShots]       = useState<Shot[]>([])
const [histStats, setHistStats] = useState<Record<string, { shots: number; potted: number }>>({})
const [flash, setFlash]       = useState<{ playerId: string; type: ShotType } | null>(null)
```

**Shot recording:**
- `recordShot(playerId, type)` — optimistic update: adds shot to `shots` state immediately, then inserts to DB
- `undoLastShot()` — optimistic update: filters last shot from state immediately, then deletes from DB
- Realtime subscription on `shots` table and `games` table (both fire `fetchGame` to reconcile)

**Win odds (`computeOdds`):**
Blends all-time historical shot data (fetched once when game loads into `histStats`) with current game shots as a Bayesian prior + Laplace smoothing:
```ts
const p1Acc = (p1.potted + p1Prior.potted + 1) / (p1.shots + p1Prior.shots + 2)
```
Odds are shown as soon as `histStats` has data (from game start, not waiting for first shot).

**Shot types:** `'potted' | 'lucky' | 'miss' | 'error'`

**Layout:**
1. Header (back link, game title, scorer info)
2. Two stat cards (grid-cols-2): potted, shots, accuracy bar, win odds
3. **← PoolTableAnimation goes here (PENDING — see below)**
4. Shot entry buttons (4 types × 2 players, grid-cols-2)
5. Undo + End Game buttons
6. Shot log (last 5 shots)
7. End Game modal (winner picker + loser potted black checkbox)

### `app/stats/page.tsx`
Client component. Fetches all complete games + all shots. Sections:
1. Standings (with W/L form dots — last 5 games per player)
2. Points Race — cumulative wins line chart over sessions
3. Accuracy Over Time — pot% per session per player (line chart)
4. Shot Accuracy — all-time pot% bar chart + detailed breakdown table
5. Shot Efficiency — average pots per game (horizontal bar chart)
6. Head to Head — split bars for each pair
7. Wins by Game Number — stacked bar chart
8. Fun Facts

### `app/history/page.tsx`
Lists all past sessions.

### `app/rules/page.tsx`
Static rules page.

---

## Tailwind colour tokens
```
pool-bg:          #060d08   (page background)
pool-surface:     #0e1e12   (cards)
pool-felt:        #1a4731   (pool table green)
pool-felt-light:  #246340
pool-border:      #1f3525
pool-gold:        #c9a227
pool-gold-light:  #e8c547
pool-chalk:       #f0ede6   (primary text)
pool-chalk-dim:   #7a786f   (secondary text)
pool-red:         #ef4444
pool-green-bright:#22c55e
```

CSS utilities in `globals.css`: `.gold-shimmer`, `.felt-bg`, `.pool-rail`, `.shot-btn`, `.glow-gold/green/red`, `.card-hover`, `.nav-glass`

---

## Supabase client pattern
- Server components: `import { createClient } from '@/lib/supabase/server'`
- Client components: `import { createClient } from '@/lib/supabase/client'`
- Both have `?? 'placeholder'` fallbacks to survive static prerender without env vars

---

## Types — `types/database.ts`
```ts
interface Shot {
  id: string; game_id: string; player_id: string
  potted: boolean; is_lucky: boolean; is_error: boolean
  shot_number: number; created_at: string
}
interface Game {
  id: string; session_id: string; game_number: number
  player1_id: string; player2_id: string
  winner_id: string | null; is_complete: boolean
  loser_potted_black: boolean; created_at: string
}
interface LeagueStanding {
  id: string; username: string; display_name: string
  ball_number: number; color: string
  wins: number; losses: number; games_played: number
}
```

---

## PENDING FEATURE: PoolTableAnimation

**Status:** Fully designed, not yet built.

**Placement:** In `app/session/[id]/game/[gameId]/page.tsx`, between the stat cards and the shot entry buttons. Always visible during an active game.

**Spec:**
- Small fixed-height rectangle (no taller than ~160px on mobile)
- Top-down SVG pool table (green felt, 6 pockets: 4 corners + 2 midpoints of long sides)
- Two stick figures with profile photo circular heads (small, ~24px, load from `/photos/[username].jpg`, fall back to `PlayerBall`)
- Player 1 on the LEFT side, Player 2 on the RIGHT side
- One ball stays at **centre table** at all times
- Between shots: both figures idle/wander on their side of the table
- On each shot event (detected by watching `shots.length` change):
  - The shooting player's figure animates toward the ball (walks to centre)
  - Figure pauses and "strikes" (cue motion)
  - Emoji reaction floats above the figure's head and fades out (~1.5s):
    - Pot:   😎 or 🤩
    - Lucky: 🍀 or 😏
    - Miss:  😤 or 😠
    - Error: 🤦 or 😡
  - On a pot: ball animates (rolls) to a random pocket, then reappears at centre
  - On miss/error: ball stays at centre
  - Figure walks back to their side

**Part 2 — Win celebration (fullscreen overlay):**
- Triggered when `game.is_complete` becomes true (or on `confirmEndGame`)
- Fixed z-50 overlay over entire screen
- Winner's profile photo large + glow in their colour
- 🏆 trophy emoji large
- Loser figure with 😭 emoji
- Pure CSS confetti burst (no library)
- Auto-dismiss after ~4s or tap to close

**Implementation notes:**
- Use CSS `transform: translate()` for all movement (GPU-accelerated)
- All animations < 0.8s except idle wander (continuous subtle loop)
- New component file: `components/PoolTableAnimation.tsx`
- Props: `{ p1: Player, p2: Player, lastShot: Shot | null, isComplete: boolean, winnerId: string | null }`
- Detect new shot by comparing `lastShot.id` in a `useEffect`
- Do NOT use any animation library — pure CSS keyframes + React state
