-- CoachScan — Supabase Schema
-- Colle ce SQL dans : Supabase Dashboard > SQL Editor > New query

-- Table principale des games
CREATE TABLE IF NOT EXISTS games (
  id            BIGSERIAL PRIMARY KEY,
  game_id       TEXT NOT NULL UNIQUE,       -- ID Riot de la game
  player_slug   TEXT NOT NULL,              -- ex: "faugnar-euw"
  game_name     TEXT NOT NULL,              -- ex: "FAUGNAR#EUW"
  queue_id      INTEGER,
  queue_label   TEXT,                       -- ex: "Ranked Solo/Duo"
  started_at    TIMESTAMPTZ NOT NULL,
  ended_at      TIMESTAMPTZ,
  duration_min  INTEGER,
  date_str      TEXT,                       -- ex: "Thu Apr 10 2025"
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_games_player_slug ON games(player_slug);
CREATE INDEX IF NOT EXISTS idx_games_started_at  ON games(started_at);

-- Politique Row Level Security : lecture publique (lecture seule pour les clients web)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read"
  ON games FOR SELECT
  USING (true);

CREATE POLICY "Public insert"
  ON games FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update"
  ON games FOR UPDATE
  USING (true);
