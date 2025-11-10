-- Create table to cache game details from ESPN API
CREATE TABLE IF NOT EXISTS public.game_details_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  league TEXT NOT NULL,
  data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '6 hours'),
  UNIQUE(game_id, league)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_details_cache_lookup 
ON public.game_details_cache(game_id, league, expires_at);

-- Enable RLS (public read access since this is public game data)
ALTER TABLE public.game_details_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached game details
CREATE POLICY "Anyone can read cached game details"
ON public.game_details_cache
FOR SELECT
USING (true);

-- Only service role can insert/update cache
CREATE POLICY "Service role can manage cache"
ON public.game_details_cache
FOR ALL
USING (auth.role() = 'service_role');