import { supabase } from "@/integrations/supabase/client";

export interface ESPNScore {
  game_id: string;
  league: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  game_status: string;
  period: string | null;
  clock: string | null;
}

/**
 * Get cached ESPN scores for events
 */
export async function getCachedScores(league?: string): Promise<ESPNScore[]> {
  try {
    let query = supabase
      .from('cached_espn_scores')
      .select('*');

    if (league) {
      query = query.eq('league', league.toUpperCase());
    }

    // Only get scores updated in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    query = query.gte('last_updated', oneHourAgo);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cached scores:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCachedScores:', error);
    return [];
  }
}

/**
 * Find score for a specific event by matching team names
 */
export function findScoreForEvent(
  scores: ESPNScore[],
  eventDescription: string,
  league: string
): ESPNScore | null {
  if (!scores || scores.length === 0) return null;

  // Normalize the event description for matching
  const normalizedEvent = eventDescription.toLowerCase();

  return scores.find(score => {
    if (score.league !== league.toUpperCase()) return false;

    const homeMatch = normalizedEvent.includes(score.home_team.toLowerCase());
    const awayMatch = normalizedEvent.includes(score.away_team.toLowerCase());

    return homeMatch && awayMatch;
  }) || null;
}

/**
 * Trigger a background refresh of ESPN scores
 */
export async function refreshESPNScores(): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('fetch-espn-scores');
    
    if (error) {
      console.error('Error refreshing ESPN scores:', error);
    }
  } catch (error) {
    console.error('Error triggering ESPN scores refresh:', error);
  }
}

/**
 * Check if a game is live based on its status
 */
export function isGameLive(status: string): boolean {
  return status === 'STATUS_IN_PROGRESS' || 
         status === 'STATUS_HALFTIME' || 
         status === 'STATUS_END_PERIOD';
}

/**
 * Format the game status for display
 */
export function formatGameStatus(score: ESPNScore): string {
  if (!score) return '';

  if (score.game_status === 'STATUS_FINAL') {
    return 'Final';
  }

  if (isGameLive(score.game_status)) {
    if (score.period && score.clock) {
      return `${score.period} - ${score.clock}`;
    }
    if (score.period) {
      return `Period ${score.period}`;
    }
    return 'Live';
  }

  return '';
}
