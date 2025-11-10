-- Fix search_path for security
CREATE OR REPLACE FUNCTION clean_old_cached_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.cached_novig_events
  WHERE last_updated < NOW() - INTERVAL '1 hour';
END;
$$;