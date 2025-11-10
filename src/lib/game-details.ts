import { supabase } from "@/integrations/supabase/client";
import { ESPNScore } from "./espn-scores";

export interface PlayerLeader {
  displayName: string;
  shortDisplayName: string;
  name: string;
  displayValue: string;
  value: number;
  athlete?: {
    id: string;
    displayName: string;
    shortName: string;
    headshot?: string;
    position?: string;
    jersey?: string;
  };
}

export interface Player {
  id: string;
  name: string;
  position: string;
  jersey: string;
  headshot?: string;
  age?: number;
  experience?: number;
  college?: string;
  height?: string;
  weight?: string;
}

export interface InjuryReport {
  athlete: {
    id: string;
    name: string;
    position: string;
    headshot?: string;
  };
  status: string;
  date: string;
  details: {
    type: string;
    detail: string;
    side?: string;
    returnDate?: string;
  };
}

export interface HeadToHeadGame {
  id: string;
  date: string;
  name: string;
  shortName: string;
  completed: boolean;
  home_team: {
    id: string;
    name: string;
    abbreviation: string;
    score: string;
    winner: boolean;
  };
  away_team: {
    id: string;
    name: string;
    abbreviation: string;
    score: string;
    winner: boolean;
  };
}

export interface TeamGameDetails {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  record?: string;
  statistics: any[];
  leaders: {
    name: string;
    displayName: string;
    leaders: PlayerLeader[];
  }[];
  roster?: Player[] | null;
  injuries?: InjuryReport[] | null;
}

export interface GameDetails {
  game_id: string;
  league: string;
  venue?: {
    fullName: string;
    address?: {
      city: string;
      state: string;
    };
  };
  attendance?: string;
  home_team: TeamGameDetails;
  away_team: TeamGameDetails;
  odds?: any;
  weather?: {
    displayValue: string;
    temperature: number;
    highTemperature?: number;
  };
  headlines: any[];
  predictor?: {
    homeTeam: {
      gameProjection: string;
      teamChanceLoss: string;
    };
    awayTeam: {
      gameProjection: string;
      teamChanceLoss: string;
    };
  };
  win_probability?: any[];
  head_to_head?: HeadToHeadGame[] | null;
  last_updated: string;
}

/**
 * Fetch detailed game information from ESPN
 */
export async function fetchGameDetails(gameId: string, league: string): Promise<GameDetails | null> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-game-details', {
      body: { gameId, league }
    });

    if (error) {
      console.error('Error fetching game details:', error);
      return null;
    }

    return data as GameDetails;
  } catch (error) {
    console.error('Error in fetchGameDetails:', error);
    return null;
  }
}

/**
 * Extract game ID from ESPN score or event description
 */
export function extractGameId(espnScore?: ESPNScore | null): string | null {
  if (!espnScore) return null;
  return espnScore.game_id;
}
