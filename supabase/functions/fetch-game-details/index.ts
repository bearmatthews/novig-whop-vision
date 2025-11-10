import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sportMap: Record<string, string> = {
  nfl: 'football/nfl',
  nba: 'basketball/nba',
  mlb: 'baseball/mlb',
  nhl: 'hockey/nhl',
  wnba: 'basketball/wnba',
  mls: 'soccer/usa.1'
};

async function fetchESPNGameDetails(gameId: string, league: string) {
  const sport = sportMap[league.toLowerCase()];
  if (!sport) {
    return null;
  }

  try {
    // Fetch game summary with comprehensive details
    const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/summary?event=${gameId}`;
    console.log(`Fetching game summary: ${summaryUrl}`);
    
    const summaryResponse = await fetch(summaryUrl);
    if (!summaryResponse.ok) {
      console.error(`ESPN API error: ${summaryResponse.status}`);
      return null;
    }

    const data = await summaryResponse.json();
    
    // Extract all the data
    const boxscore = data.boxscore;
    const teams = boxscore?.teams || [];
    const header = data.header;
    const gameInfo = data.gameInfo;
    const predictor = data.predictor;
    const winprobability = data.winprobability;
    
    const homeTeam = teams.find((t: any) => t.homeAway === 'home');
    const awayTeam = teams.find((t: any) => t.homeAway === 'away');

    // Get team IDs for additional data
    const homeTeamId = homeTeam?.team?.id;
    const awayTeamId = awayTeam?.team?.id;

    // Fetch rosters, injuries, and head-to-head in parallel
    const [homeRoster, awayRoster, homeInjuries, awayInjuries, headToHead] = await Promise.all([
      fetchTeamRoster(homeTeamId, sport),
      fetchTeamRoster(awayTeamId, sport),
      fetchTeamInjuries(homeTeamId, sport),
      fetchTeamInjuries(awayTeamId, sport),
      fetchHeadToHead(homeTeamId, awayTeamId, sport)
    ]);

    return {
      game_id: gameId,
      league: league.toUpperCase(),
      venue: gameInfo?.venue,
      attendance: gameInfo?.attendance,
      home_team: {
        id: homeTeamId,
        name: homeTeam?.team?.displayName,
        abbreviation: homeTeam?.team?.abbreviation,
        logo: homeTeam?.team?.logo,
        record: homeTeam?.team?.record,
        statistics: homeTeam?.statistics || [],
        leaders: homeTeam?.leaders || [],
        roster: homeRoster,
        injuries: homeInjuries,
      },
      away_team: {
        id: awayTeamId,
        name: awayTeam?.team?.displayName,
        abbreviation: awayTeam?.team?.abbreviation,
        logo: awayTeam?.team?.logo,
        record: awayTeam?.team?.record,
        statistics: awayTeam?.statistics || [],
        leaders: awayTeam?.leaders || [],
        roster: awayRoster,
        injuries: awayInjuries,
      },
      odds: data.pickcenter?.[0] || null,
      weather: gameInfo?.weather,
      headlines: data.headlines || [],
      predictor: predictor,
      win_probability: winprobability,
      head_to_head: headToHead,
      last_updated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching game details:`, error);
    return null;
  }
}

async function fetchTeamRoster(teamId: string, sport: string) {
  if (!teamId) return null;
  
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/teams/${teamId}/roster`;
    console.log(`Fetching roster: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Extract players from both offense and defense groups if they exist
    const athletes = data.athletes || [];
    const allPlayers = athletes.flatMap((group: any) => 
      (group.items || []).map((player: any) => ({
        id: player.id,
        name: player.displayName,
        position: player.position?.abbreviation,
        jersey: player.jersey,
        headshot: player.headshot?.href,
        age: player.age,
        experience: player.experience?.years,
        college: player.college?.name,
        height: player.height,
        weight: player.weight,
      }))
    );
    
    return allPlayers.slice(0, 25); // Limit to 25 players
  } catch (error) {
    console.error('Error fetching roster:', error);
    return null;
  }
}

async function fetchTeamInjuries(teamId: string, sport: string) {
  if (!teamId) return null;
  
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/teams/${teamId}`;
    console.log(`Fetching team info for injuries: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    const injuries = data.team?.injuries || [];
    
    return injuries.map((injury: any) => ({
      athlete: {
        id: injury.athlete?.id,
        name: injury.athlete?.displayName,
        position: injury.athlete?.position?.abbreviation,
        headshot: injury.athlete?.headshot?.href,
      },
      status: injury.status,
      date: injury.date,
      details: {
        type: injury.details?.type,
        detail: injury.details?.detail,
        side: injury.details?.side,
        returnDate: injury.details?.returnDate,
      }
    }));
  } catch (error) {
    console.error('Error fetching injuries:', error);
    return null;
  }
}

async function fetchHeadToHead(homeTeamId: string, awayTeamId: string, sport: string) {
  if (!homeTeamId || !awayTeamId) return null;
  
  try {
    // Fetch recent games for home team
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/teams/${homeTeamId}/schedule`;
    console.log(`Fetching schedule for H2H: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    const events = data.events || [];
    
    // Find games between these two teams (limit to last 5)
    const matchups = events
      .filter((event: any) => {
        const competitors = event.competitions?.[0]?.competitors || [];
        const teamIds = competitors.map((c: any) => c.team?.id);
        return teamIds.includes(homeTeamId) && teamIds.includes(awayTeamId);
      })
      .slice(0, 5)
      .map((event: any) => {
        const competition = event.competitions?.[0];
        const competitors = competition?.competitors || [];
        const homeComp = competitors.find((c: any) => c.homeAway === 'home');
        const awayComp = competitors.find((c: any) => c.homeAway === 'away');
        
        return {
          id: event.id,
          date: event.date,
          name: event.name,
          shortName: event.shortName,
          completed: competition?.status?.type?.completed,
          home_team: {
            id: homeComp?.team?.id,
            name: homeComp?.team?.displayName,
            abbreviation: homeComp?.team?.abbreviation,
            score: homeComp?.score,
            winner: homeComp?.winner,
          },
          away_team: {
            id: awayComp?.team?.id,
            name: awayComp?.team?.displayName,
            abbreviation: awayComp?.team?.abbreviation,
            score: awayComp?.score,
            winner: awayComp?.winner,
          }
        };
      });
    
    return matchups;
  } catch (error) {
    console.error('Error fetching head to head:', error);
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
