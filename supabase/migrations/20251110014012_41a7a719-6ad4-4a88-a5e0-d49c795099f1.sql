-- Create table to cache ESPN live scores
CREATE TABLE IF NOT EXISTS public.cached_espn_scores (
  game_id TEXT PRIMARY KEY,
  league TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  game_status TEXT,
  period TEXT,
  clock TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on league for faster filtering
CREATE INDEX IF NOT EXISTS idx_cached_espn_scores_league ON public.cached_espn_scores(league);

-- Create index on last_updated for cleaning old data
CREATE INDEX IF NOT EXISTS idx_cached_espn_scores_updated ON public.cached_espn_scores(last_updated);

-- Enable RLS
ALTER TABLE public.cached_espn_scores ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read scores (public data)
CREATE POLICY "Allow public read access to ESPN scores"
  ON public.cached_espn_scores
  FOR SELECT
  USING (true);

-- Function to clean old cached scores (older than 1 hour)
CREATE OR REPLACE FUNCTION clean_old_cached_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.cached_espn_scores
  WHERE last_updated < NOW() - INTERVAL '1 hour';
END;
$$;