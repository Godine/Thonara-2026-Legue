# Thonara 2026 League — CLAUDE.md

## Project overview
Pool-league tracker for 3 friends: **Adib**, **Ahmed** (aka Shin), and **Amine**.
Sessions are a 6-game round-robin; every shot can be recorded live and stats,
odds, achievements and records are derived from that shot history. Built with
Next.js 14 App Router + Supabase (PostgreSQL + Realtime), charted with Recharts,
styled with Tailwind. Deployed on Vercel — **auto-deploys on every push to any
branch**, so a broken push ships. Development happens on feature branches; open
a PR only when asked.

> ⚠️ **Naming.** Each friend has up to three names. In `players.username`:
> `adib` = Adib, `ahmed` = "Shin" in some places, and **`godine` = Amine**. The
> schema seed uses `shin@thonara.app` for Ahmed. When mapping ids ↔ people, go
> through `username`, and remember `godine`/Amine are the same person.

---

## Tech stack
- **Framework:** Next.js 14.2.35, App Router, TypeScript, React 18
- **Database:** Supabase (`@supabase/ssr` + `@supabase/supabase-js`), Realtime via `postgres_changes`
- **Charts:** Recharts (line, bar, stacked/vertical, `Cell`, `ResponsiveContainer`)
- **Dates:** `date-fns`
- **Fonts:** Bebas Neue (`font-heading`), DM Sans (`font-body`) via `next/font/google`
- **CSS:** Tailwind with custom `pool-*` colour tokens (`tailwind.config.ts`)
- **PWA:** `app/manifest.ts`, `app/icon.png`, `app/apple-icon.png`, `public/sw.js` + `ServiceWorkerRegistration`
- **Tests:** Vitest (`npm test`) — see [Testing](#testing)

---

## Auth — read this before touching login/RLS
The app has **two half-wired identity systems**; know which is real:

- **What actually gates the app: `localStorage`.** `components/PlayerGate.tsx`
  shows a first-visit overlay to pick who you are and stores it under the key
  `thonara_player`. Everything else reads it via `getStoredPlayer()`. There is
  **no login wall** — `app/login/page.tsx` just `redirect('/')` and
  `middleware.ts` is a pass-through.
- **Supabase auth scaffolding exists but is largely vestigial:**
  `app/auth/callback/route.ts`, `app/auth/reset-password/page.tsx`,
  `lib/supabase/server.ts` cookie handling. `supabase/schema.sql` enables RLS
  with `authenticated`-role policies on the game tables, yet the client uses the
  anon key and never signs in — and `tip_completions` / `quiz_scores` explicitly
  **`DISABLE ROW LEVEL SECURITY`**. In practice the deployed DB is permissive.

If you add features, follow the localStorage pattern for "who am I"; don't assume
an authenticated Supabase session exists.

---

## Data model — `supabase/schema.sql` & `types/database.ts`
- **players** — `id, username, display_name, ball_number, color`
- **sessions** — `id, date, is_complete, notes`. RLS allows edits only within 7 days.
- **games** — `id, session_id, game_number (1–12), player1_id, player2_id,
  winner_id, is_complete, loser_potted_black, breaker_id, loser_balls_remaining,
  player1_color ('yellow'|'red')`
- **shots** — `id, game_id, player_id, shot_number,
  potted, balls_potted, opponent_balls_potted (foul credit), ball_color,
  is_lucky, is_error, cue_ball_potted, created_at`. Deletes (undo) allowed < 7 days.
- **tip_completions** / **quiz_scores** — Top-Tips progress + quiz results (RLS off)
- **league_standings** (view) — wins/losses/games_played per player

Shots carry richer data than the old boolean model: prefer
`balls_potted ?? (potted ? 1 : 0)` when reading pot counts (there's a
`ballsPotted()` helper in `lib/game-logic.ts`).

---

## Players & schedule — `lib/game-config.ts`
`PLAYER_STYLES` maps each username → `{ color, dimColor, number, label, photo }`
(Adib gold, Ahmed blue, Amine/godine red). `GAME_SCHEDULE` is the fixed 6-game
rotation (player1 / player2 / scorer). Photos live in `public/photos/`
(`adib.jpg`, `ahmed.jpg`, `amine.jpg`, `godine.jpg`).

---

## Win-odds engine — `lib/odds.ts`
More than Bayesian smoothing — it's a **Markov chain** over remaining balls:
- `weightedAccuracy(shots, playerId, decay=0.8)` — exponentially-decayed pot rate (recent shots weigh more; half-life ≈ 4 shots).
- `solveMarkov(r1, r2, a1, a2, p1Turn)` — exact P(P1 wins) from ball counts, per-player accuracies, and whose turn it is, solved as a small DP.
- `computeOdds(...)` — blends this game's weighted accuracy with each player's
  **career prior** (Laplace-smoothed) to get per-player accuracies, runs the
  Markov solve, then applies a **head-to-head nudge** (≤25%, tapering as the game
  progresses). Returns integer `{ p1, p2 }` summing to 100; 50/50 when there's no data.

Covered by `tests/odds.test.ts`.

---

## Game logic — `lib/game-logic.ts` (pure, unit-tested)
Extracted from the game page so the tricky rules are isolated and testable:
- `ballsPotted(shot)` — tolerant pot count (see above)
- `isPlayer1Turn(shots, p1Id, p2Id)` — turn tracking: a pot keeps the table, a
  miss switches, a **foul switches AND grants one free turn** (the incoming
  player's first miss doesn't switch back)
- `computeBreakInfo(shots)` — summarises the opening break run (`pots`,
  `yellows`, `reds`, `black`, `breakerId`)
- `currentStreak(shots, playerId)` — trailing consecutive-pot run
- `loserBallsRemaining(shots, loserId)` — 7 minus legally-potted balls, clamped

Covered by `tests/game-logic.test.ts`.

---

## App pages (`app/`)
- **`page.tsx`** (Dashboard, server) — hero, standings with rank badges, START
  SESSION CTA, last-session results, ELO rating chart, season countdown.
- **`session/new`** — creates a session + 6 games from `GAME_SCHEDULE`, redirects.
- **`session/[id]`** — session overview; per-game status, stakes, cue race.
- **`session/[id]/game/[gameId]`** — ⭐ main live game page (see below).
- **`stats`** (`StatsClient`) — standings & form, points race, accuracy over
  time, shot accuracy, efficiency, head-to-head, wins by game number, fun facts.
- **`achievements`**, **`records`**, **`player/[username]`**, **`predictions`**,
  **`challenges`**, **`history`**, **`practice`**, **`coin`** (coin-flip breaker
  picker), **`rules`**.
- **`tips`** — "Top Tips" learning hub: bilingual articles, custom SVG
  illustrations, per-category quizzes (`tips/quiz/[category]`, `tips/quiz/final`)
  and a leaderboard.

### The main game page — `app/session/[id]/game/[gameId]/page.tsx`
Client component. **State/effects live in hooks** (`hooks/`); the page composes
them and holds only view-local UI state (popups, break form, admin panel).

- Data & realtime: `useGameData(db, gameId)` → `{ game, shots, loading,
  histStats, h2hStats, showCelebration, loadGame, setGame, setShots }`.
  Subscribes to `shots` + `games` changes; also fetches historical + H2H data
  for odds and raises the one-shot win-celebration flag.
- `useGameTimer(shots, isComplete)` → live elapsed timer from the first shot.
- `usePendingShots(db)` → `{ pendingCount, enqueue, enqueueMany, dropLast }`,
  an offline queue that flushes on the `online` event.
- `useLongPress<string>({ onLongPress, onClick })` → POT/ERR buttons: tap
  records a shot, hold opens the multi-ball / foul popup for the active player.

**Shot recording** is optimistic (`setShots` immediately, then insert; failed
inserts go to the pending queue). Turn/break/streak/odds are derived each render
from `lib/game-logic.ts` + `lib/odds.ts`. Views: break entry (first shot) →
shot entry → recap (complete) → watching (no stored player). Modals: multi-pot,
foul/in-off, end-game, odds-info, and an **Amine-only admin panel** (edit
winner, delete shots, re-open, reset).

---

## Hooks — `hooks/`
`useGameData`, `useGameTimer`, `usePendingShots`, `useLongPress`. These were
extracted from the game page; keep new game-page logic here rather than growing
the component.

---

## Key components (`components/`)
- **PlayerAvatar** — photo in coloured circular frame; falls back to PlayerBall on 404.
- **PlayerBall** — full 3D SVG pool ball (radial gradients + contact shadow).
- **PlayerGate** — first-visit identity picker (`localStorage`; see Auth).
- **Navbar** — fixed nav, mobile hamburger, active-route highlight, player chip.
- **WinCelebration** — fullscreen winner overlay + CSS confetti.
- **PoolTableAnimation** — top-down table with stick-figure players reacting to
  shots (built; pure CSS, no animation library).
- **EloRatingChart**, **SeasonCountdown**, **FlipBadgeCard**, **OfflineBanner**,
  **PullToRefresh**, **ThemeToggle**, **ServiceWorkerRegistration**.
- **components/tips/** — article content, quiz runner/leaderboard, language
  context, progress context, and the `illustrations/` SVG scenes.

---

## Domain libraries (`lib/`)
- **stats.ts** — `getPlayerStats`, `pct`, `longestStreak`, `formatTime`, play-order sorting.
- **odds.ts**, **game-logic.ts** — see above.
- **achievements.ts** — `ACHIEVEMENTS` catalogue (rarity tiers) + `computePlayerAchievements(username, games, shots)`.
- **records.ts** — `computeRecords(games, shots)` → career / single-game record sections.
- **challenges.ts** — session stakes (dirhams) + cue-race standings.
- **season.ts** — `SEASON_GAME_LIMIT = 100`; season progress for the 100-game challenge.
- **session-prediction.ts** — deterministic pre-session "who's winning tonight" pick + flavour reason.
- **narrative.ts**, **trash-talk.ts** — generated standings narrative & post-game verdict lines.
- **quiz-content.ts**, **tips-content.ts** — Top-Tips articles + quiz banks.
- **queries/** — typed Supabase helpers (`games`, `sessions`, `shots`, `standings`, `tips-progress`) re-exported from `queries/index.ts`.
- **supabase/** — `client.ts` (browser) and `server.ts` (RSC cookies); both have `?? 'placeholder'` fallbacks so static prerender survives without env vars.

---

## Testing
Vitest, config in `vitest.config.ts` (node env, `@/` alias, `tests/**/*.test.ts`).
```
npm test        # run once
npm run test:watch
```
`tests/helpers.ts` builds `Shot` fixtures. Suites cover `game-logic`, `odds`,
`stats`, `achievements`, and `records`. **When you change the odds model, turn
rules, streak/break logic, or records, update or add a test.** The pure modules
are the right place to add coverage — keep new logic pure and testable.

Also run before pushing (Vercel deploys every branch):
```
npx tsc --noEmit
npx next build
```

---

## Tailwind colour tokens
```
pool-bg #060d08 · pool-surface #0e1e12 · pool-felt #1a4731 · pool-felt-light #246340
pool-border #1f3525 · pool-gold #c9a227 · pool-gold-light #e8c547
pool-chalk #f0ede6 · pool-chalk-dim #7a786f
pool-red #ef4444 · pool-green-bright #22c55e
```
CSS utilities in `globals.css`: `.gold-shimmer`, `.felt-bg`, `.pool-rail`,
`.shot-btn`, `.glow-gold/green/red`, `.card-hover`, `.nav-glass`, plus the
`animate-slide-up/down`, `animate-fade-in` keyframes the game page relies on.

---

## Conventions
- Server components: `import { createClient } from '@/lib/supabase/server'`.
  Client components: `from '@/lib/supabase/client'`.
- Prefer the typed helpers in `lib/queries` over ad-hoc `db.from(...)` calls.
- Keep derived game math in `lib/game-logic.ts` (pure) and stateful concerns in
  `hooks/` — the game page should stay a composition layer.
