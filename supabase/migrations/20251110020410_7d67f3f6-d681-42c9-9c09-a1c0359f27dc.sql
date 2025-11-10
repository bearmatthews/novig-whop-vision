-- Create table to cache team rosters
CREATE TABLE IF NOT EXISTS public.team_rosters_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL,
  league TEXT NOT NULL,
  team_name TEXT NOT NULL,
  roster_data JSONB NOT NULL,
  season TEXT,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, league, season)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_rosters_cache_lookup 
ON public.team_rosters_cache(team_id, league, last_updated);

-- Enable RLS
ALTER TABLE public.team_rosters_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached rosters
CREATE POLICY "Anyone can read cached rosters"
ON public.team_rosters_cache
FOR SELECT
USING (true);

-- Only service role can manage cache
CREATE POLICY "Service role can manage rosters cache"
ON public.team_rosters_cache
FOR ALL
USING (auth.role() = 'service_role');