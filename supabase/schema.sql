-- ============================================================
-- Thonara 2026 Pool League — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- ── PLAYERS ──────────────────────────────────────────────────
-- Linked to Supabase auth.users. Pre-create accounts via Auth dashboard:
--   adib@thonara.app  /  shin@thonara.app  /  godine@thonara.app
-- Then run the INSERT below to seed the players table.

CREATE TABLE IF NOT EXISTS public.players (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT        UNIQUE NOT NULL,
  display_name TEXT        NOT NULL,
  ball_number  INTEGER     NOT NULL DEFAULT 1,
  color        TEXT        NOT NULL DEFAULT '#c9a227',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "players_select" ON public.players
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "players_insert" ON public.players
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "players_update" ON public.players
  FOR UPDATE TO authenticated USING (auth.uid() = id);


-- ── SESSIONS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  created_by   UUID        REFERENCES auth.users(id),
  is_complete  BOOLEAN     NOT NULL DEFAULT FALSE,
  notes        TEXT
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select" ON public.sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sessions_insert" ON public.sessions
  FOR INSERT TO authenticated WITH CHECK (true);

-- Edit allowed only within 7 days of creation
CREATE POLICY "sessions_update" ON public.sessions
  FOR UPDATE TO authenticated
  USING (created_at > NOW() - INTERVAL '7 days')
  WITH CHECK (created_at > NOW() - INTERVAL '7 days');


-- ── GAMES ────────────────────────────────────────────────────
-- 6 games per session in a fixed rotation. Created automatically
-- when a new session is started.

CREATE TABLE IF NOT EXISTS public.games (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID        NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  game_number       INTEGER     NOT NULL CHECK (game_number BETWEEN 1 AND 6),
  player1_id        UUID        NOT NULL REFERENCES public.players(id),
  player2_id        UUID        NOT NULL REFERENCES public.players(id),
  winner_id         UUID        REFERENCES public.players(id),
  is_complete       BOOLEAN     NOT NULL DEFAULT FALSE,
  loser_potted_black BOOLEAN    NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (session_id, game_number),
  CHECK  (player1_id <> player2_id)
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "games_select" ON public.games
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "games_insert" ON public.games
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "games_update" ON public.games
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = games.session_id
        AND s.created_at > NOW() - INTERVAL '7 days'
    )
  );


-- ── SHOTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shots (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id     UUID        NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id   UUID        NOT NULL REFERENCES public.players(id),
  potted      BOOLEAN     NOT NULL DEFAULT FALSE,
  is_lucky    BOOLEAN     NOT NULL DEFAULT FALSE,
  is_error    BOOLEAN     NOT NULL DEFAULT FALSE,
  shot_number INTEGER     NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  -- Lucky implies potted
  CHECK (NOT is_lucky OR potted)
);

ALTER TABLE public.shots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shots_select" ON public.shots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "shots_insert" ON public.shots
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow delete (undo) only when the session is < 7 days old
CREATE POLICY "shots_delete" ON public.shots
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games g
      JOIN public.sessions s ON s.id = g.session_id
      WHERE g.id = shots.game_id
        AND s.created_at > NOW() - INTERVAL '7 days'
    )
  );


-- ── LEAGUE STANDINGS VIEW ────────────────────────────────────
CREATE OR REPLACE VIEW public.league_standings AS
SELECT
  p.id,
  p.username,
  p.display_name,
  p.ball_number,
  p.color,
  COUNT(CASE WHEN g.winner_id = p.id                                                        THEN 1 END)::INT AS wins,
  COUNT(CASE WHEN g.is_complete AND (g.player1_id = p.id OR g.player2_id = p.id)
                  AND g.winner_id IS NOT NULL AND g.winner_id <> p.id                       THEN 1 END)::INT AS losses,
  COUNT(CASE WHEN g.is_complete AND (g.player1_id = p.id OR g.player2_id = p.id)           THEN 1 END)::INT AS games_played
FROM public.players p
LEFT JOIN public.games g
  ON g.player1_id = p.id OR g.player2_id = p.id
GROUP BY p.id, p.username, p.display_name, p.ball_number, p.color;


-- ── ENABLE REALTIME ──────────────────────────────────────────
-- Run in Supabase Dashboard → Database → Replication, or via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE public.shots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;


-- ── SEED: Create the 3 player accounts ───────────────────────
-- STEP 1: In Supabase Dashboard → Auth → Users, manually create:
--   Email: adib@thonara.app    Password: [choose one]
--   Email: shin@thonara.app    Password: [choose one]
--   Email: godine@thonara.app  Password: [choose one]
--
-- STEP 2: Copy their user IDs from the Auth dashboard, then run:

-- INSERT INTO public.players (id, username, display_name, ball_number, color) VALUES
--   ('<adib-uuid>',   'adib',   'Adib',   1, '#f5c518'),
--   ('<shin-uuid>',   'shin',   'Shin',   2, '#60a5fa'),
--   ('<godine-uuid>', 'godine', 'Godine', 3, '#f87171');


-- ── OPTIONAL: Seed historical wins (scores only, no shot data) ──
-- If you want to add past session results without full shot tracking:
--
-- INSERT INTO public.sessions (date, is_complete) VALUES ('2026-01-09', true);
-- -- Then get the session id and create games with winner_id set, is_complete=true.
