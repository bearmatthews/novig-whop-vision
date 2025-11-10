import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchESPNGameDetails(gameId: string, league: string) {
  const sportMap: Record<string, string> = {
    nfl: 'football/nfl',
    nba: 'basketball/nba',
    mlb: 'baseball/mlb',
    nhl: 'hockey/nhl',
    wnba: 'basketball/wnba',
    mls: 'soccer/usa.1'
  };

  const sport = sportMap[league.toLowerCase()];
  if (!sport) {
    return null;
  }

  try {
    // Fetch game summary with team stats and players
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/summary?event=${gameId}`;
    console.log(`Fetching game details: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`ESPN API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Extract relevant information
    const boxscore = data.boxscore;
    const teams = boxscore?.teams || [];
    const header = data.header;
    const gameInfo = data.gameInfo;
    
    const homeTeam = teams.find((t: any) => t.homeAway === 'home');
    const awayTeam = teams.find((t: any) => t.homeAway === 'away');

    return {
      game_id: gameId,
      league: league.toUpperCase(),
      venue: gameInfo?.venue,
      attendance: gameInfo?.attendance,
      home_team: {
        id: homeTeam?.team?.id,
        name: homeTeam?.team?.displayName,
        abbreviation: homeTeam?.team?.abbreviation,
        logo: homeTeam?.team?.logo,
        record: homeTeam?.team?.record,
        statistics: homeTeam?.statistics || [],
        leaders: homeTeam?.leaders || [],
      },
      away_team: {
        id: awayTeam?.team?.id,
        name: awayTeam?.team?.displayName,
        abbreviation: awayTeam?.team?.abbreviation,
        logo: awayTeam?.team?.logo,
        record: awayTeam?.team?.record,
        statistics: awayTeam?.statistics || [],
        leaders: awayTeam?.leaders || [],
      },
      odds: data.pickcenter?.[0] || null,
      weather: gameInfo?.weather,
      headlines: data.headlines || [],
      last_updated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching game details:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gameId, league } = await req.json();

    if (!gameId || !league) {
      return new Response(
        JSON.stringify({ error: 'gameId and league are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Fetching details for game ${gameId} in ${league}`);
    
    const gameDetails = await fetchESPNGameDetails(gameId, league);

    if (!gameDetails) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch game details' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify(gameDetails),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-game-details:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
