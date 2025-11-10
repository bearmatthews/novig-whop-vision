import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client for caching
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sportMap: Record<string, string> = {
  nfl: 'football/nfl',
  nba: 'basketball/nba',
  mlb: 'baseball/mlb',
  nhl: 'hockey/nhl',
  wnba: 'basketball/wnba',
  mls: 'soccer/usa.1'
};

async function checkCache(gameId: string, league: string) {
  try {
    const { data, error } = await supabase
      .from('game_details_cache')
      .select('data, expires_at')
      .eq('game_id', gameId)
      .eq('league', league.toUpperCase())
      .single();

    if (error || !data) {
      console.log('Cache miss for game:', gameId);
      return null;
    }

    // Check if cache is still valid
    if (new Date(data.expires_at) > new Date()) {
      console.log('Cache hit for game:', gameId);
      return data.data;
    }

    console.log('Cache expired for game:', gameId);
    return null;
  } catch (error) {
    console.error('Error checking cache:', error);
    return null;
  }
}

async function updateCache(gameId: string, league: string, gameData: any) {
  try {
    // Set TTL based on game status
    // Live games: 2 minutes, Upcoming: 1 hour, Final: 24 hours
    let ttlHours = 1;
    const status = gameData.home_team?.statistics?.length > 0 ? 'live' : 'scheduled';
    
    if (status === 'live') {
      ttlHours = 2 / 60; // 2 minutes for live games
    } else if (gameData.win_probability?.some((p: any) => p.play !== undefined)) {
      ttlHours = 24; // 24 hours for completed games
    }

    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    const { error } = await supabase
      .from('game_details_cache')
      .upsert({
        game_id: gameId,
        league: league.toUpperCase(),
        data: gameData,
        cached_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'game_id,league'
      });

    if (error) {
      console.error('Error updating cache:', error);
    } else {
      console.log(`Cache updated for game ${gameId}, expires at ${expiresAt.toISOString()}`);
    }
  } catch (error) {
    console.error('Error in updateCache:', error);
  }
}

async function fetchESPNGameDetails(gameId: string, league: string) {
  const sport = sportMap[league.toLowerCase()];
  if (!sport) {
    return null;
  }

  try {
    // Fetch game summary with comprehensive details
    const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/summary?event=${gameId}`;
    console.log(`Fetching game summary from ESPN: ${summaryUrl}`);
    
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
    const homeTeamName = homeTeam?.team?.displayName;
    const awayTeamName = awayTeam?.team?.displayName;

    // Determine season from game date
    const gameDate = new Date(header?.competitions?.[0]?.date || new Date());
    const gameYear = gameDate.getFullYear();
    const gameMonth = gameDate.getMonth();
    
    // Calculate season year based on sport
    let season = gameYear.toString();
    
    // For sports with seasons spanning two years (NBA, NHL, WNBA)
    // games before July belong to the previous season
    if (['basketball/nba', 'basketball/wnba', 'hockey/nhl'].includes(sport) && gameMonth < 7) {
      season = (gameYear - 1).toString();
    }
    
    // For college football, season starts in August
    if (sport === 'football/college-football') {
      season = gameMonth >= 8 ? gameYear.toString() : (gameYear - 1).toString();
    }

    console.log(`Game date: ${gameDate.toISOString()}, using season: ${season}`);

    // Try to get cached rosters first for immediate response
    const [cachedHomeRoster, cachedAwayRoster] = await Promise.all([
      getCachedRoster(homeTeamId, league, season),
      getCachedRoster(awayTeamId, league, season),
    ]);

    // Fetch fresh data and cache in background (don't block response)
    const backgroundUpdate = async () => {
      try {
        const [homeRoster, awayRoster] = await Promise.all([
          fetchTeamRoster(homeTeamId, sport, season),
          fetchTeamRoster(awayTeamId, sport, season),
        ]);

        // Cache the rosters if we got new data
        if (homeRoster && homeRoster.length > 0) {
          await cacheRoster(homeTeamId, homeTeamName, league, homeRoster, season);
        }
        if (awayRoster && awayRoster.length > 0) {
          await cacheRoster(awayTeamId, awayTeamName, league, awayRoster, season);
        }
      } catch (error) {
        console.error('Background roster update failed:', error);
      }
    };

    // Start background update (fire and forget)
    backgroundUpdate().catch(err => console.error('Background update error:', err));

    // Fetch only injuries and h2h for immediate response (rosters from cache)
    const [homeInjuries, awayInjuries, headToHead] = await Promise.all([
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
        name: homeTeamName,
        abbreviation: homeTeam?.team?.abbreviation,
        logo: homeTeam?.team?.logo,
        record: homeTeam?.team?.record,
        statistics: homeTeam?.statistics || [],
        leaders: homeTeam?.leaders || [],
        roster: cachedHomeRoster || [], // Use cached roster
        injuries: homeInjuries,
      },
      away_team: {
        id: awayTeamId,
        name: awayTeamName,
        abbreviation: awayTeam?.team?.abbreviation,
        logo: awayTeam?.team?.logo,
        record: awayTeam?.team?.record,
        statistics: awayTeam?.statistics || [],
        leaders: awayTeam?.leaders || [],
        roster: cachedAwayRoster || [], // Use cached roster
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

async function getCachedRoster(teamId: string, league: string, season?: string): Promise<any[] | null> {
  try {
    const targetSeason = season || new Date().getFullYear().toString();
    
    const { data, error } = await supabase
      .from('team_rosters_cache')
      .select('roster_data')
      .eq('team_id', teamId)
      .eq('league', league.toUpperCase())
      .eq('season', targetSeason)
      .maybeSingle();

    if (error || !data) {
      console.log(`No cached roster found for team: ${teamId}, season: ${targetSeason}`);
      return null;
    }

    console.log(`Cached roster found for team: ${teamId}, season: ${targetSeason}`);
    return data.roster_data as any[];
  } catch (error) {
    console.error('Error getting cached roster:', error);
    return null;
  }
}

async function cacheRoster(teamId: string, teamName: string, league: string, rosterData: any[], season?: string) {
  if (!rosterData || rosterData.length === 0) return;

  try {
    const targetSeason = season || new Date().getFullYear().toString();
    
    const { error } = await supabase
      .from('team_rosters_cache')
      .upsert({
        team_id: teamId,
        league: league.toUpperCase(),
        team_name: teamName,
        roster_data: rosterData,
        season: targetSeason,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'team_id,league,season'
      });

    if (error) {
      console.error('Error caching roster:', error);
    } else {
      console.log(`Roster cached for ${teamName} season ${targetSeason} (${rosterData.length} players)`);
    }
  } catch (error) {
    console.error('Error in cacheRoster:', error);
  }
}

async function fetchTeamRoster(teamId: string, sport: string, season?: string) {
  if (!teamId) return null;
  
  try {
    const seasonParam = season ? `?season=${season}` : '';
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/teams/${teamId}/roster${seasonParam}`;
    console.log(`Fetching roster: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`Failed to fetch roster for team ${teamId} season ${season || 'current'}: ${response.status}`);
      return null;
    }
    
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
    
    // Check cache first
    const cachedData = await checkCache(gameId, league);
    if (cachedData) {
      console.log('Returning cached data');
      return new Response(
        JSON.stringify(cachedData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cache miss - fetch from ESPN
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

    // Update cache with new data
    await updateCache(gameId, league, gameDetails);

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
