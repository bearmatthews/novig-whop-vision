import { supabase } from "@/integrations/supabase/client";

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * Fetch events from cached Supabase data instead of hitting Novig directly
 * This avoids rate limits and provides faster response times
 */
export async function getCachedEvents(leagues?: string[]): Promise<GraphQLResponse> {
  try {
    let query = supabase
      .from('cached_novig_events')
      .select('event_data, league, status, last_updated');

    // Filter by leagues if provided
    if (leagues && leagues.length > 0) {
      query = query.in('league', leagues);
    }

    // Only get events updated in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    query = query.gte('last_updated', oneHourAgo);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cached events:', error);
      throw error;
    }

    // Transform the cached data to match the GraphQL response format
    const events = data?.map(item => item.event_data) || [];

    return {
      data: {
        event: events
      }
    };
  } catch (error) {
    console.error('Error in getCachedEvents:', error);
    return {
      errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }]
    };
  }
}

/**
 * Trigger a background refresh of Novig data
 */
export async function refreshNovigCache(): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('fetch-novig-data');
    
    if (error) {
      console.error('Error refreshing cache:', error);
    }
  } catch (error) {
    console.error('Error triggering cache refresh:', error);
  }
}
