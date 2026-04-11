
CREATE TABLE IF NOT EXISTS games (
  id            BIGSERIAL PRIMARY KEY,
  game_id       TEXT NOT NULL UNIQUE,       -- ID Riot de la game
  player_slug   TEXT NOT NULL,              -- ex: "Alderiate-euw"
  game_name     TEXT NOT NULL,              -- ex: "ALDERIATE#EUW"
  queue_id      INTEGER,
  queue_label   TEXT,                       -- ex: "Ranked Solo/Duo"
  started_at    TIMESTAMPTZ NOT NULL,
  ended_at      TIMESTAMPTZ,
  duration_min  INTEGER,
  date_str      TEXT,                       -- ex: "Thu Apr 10 2025"
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_games_player_slug ON games(player_slug);
CREATE INDEX IF NOT EXISTS idx_games_started_at  ON games(started_at);

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
