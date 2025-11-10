-- Create table to cache Novig events data
CREATE TABLE IF NOT EXISTS public.cached_novig_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_data JSONB NOT NULL,
  league TEXT NOT NULL,
  event_id TEXT NOT NULL,
  status TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cached_events_league ON public.cached_novig_events(league);
CREATE INDEX IF NOT EXISTS idx_cached_events_status ON public.cached_novig_events(status);
CREATE INDEX IF NOT EXISTS idx_cached_events_last_updated ON public.cached_novig_events(last_updated);

-- Enable RLS (this is public data so we allow all reads)
ALTER TABLE public.cached_novig_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached events
CREATE POLICY "Allow public read access to cached events"
  ON public.cached_novig_events
  FOR SELECT
  USING (true);

-- Create function to clean up old cached data (older than 1 hour)
CREATE OR REPLACE FUNCTION clean_old_cached_events()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.cached_novig_events
  WHERE last_updated < NOW() - INTERVAL '1 hour';
END;
$$;