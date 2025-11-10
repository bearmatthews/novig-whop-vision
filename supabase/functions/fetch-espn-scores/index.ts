import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LEAGUES = ['nfl', 'nba', 'mlb', 'nhl', 'wnba', 'mls'];

async function fetchESPNScores(league: string) {
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
    console.log(`Unknown league: ${league}`);
    return [];
  }

  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/scoreboard`;
    console.log(`Fetching ESPN scores for ${league}: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`ESPN API error for ${league}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const events = data.events || [];
    
    console.log(`Found ${events.length} games for ${league}`);
    
    return events.map((event: any) => {
      const competition = event.competitions?.[0];
      const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
      const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');
      
      return {
        game_id: event.id,
        league: league.toUpperCase(),
        home_team: homeTeam?.team?.displayName || '',
        away_team: awayTeam?.team?.displayName || '',
        home_score: parseInt(homeTeam?.score) || null,
        away_score: parseInt(awayTeam?.score) || null,
        game_status: competition?.status?.type?.name || 'STATUS_SCHEDULED',
        period: competition?.status?.period ? `${competition.status.period}` : null,
        clock: competition?.status?.displayClock || null,
      };
    });
  } catch (error) {
    console.error(`Error fetching ${league} scores:`, error);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting ESPN scores fetch...');
    
    // Fetch scores for all leagues in parallel
    const allScoresPromises = LEAGUES.map(league => fetchESPNScores(league));
    const allScoresArrays = await Promise.all(allScoresPromises);
    const allScores = allScoresArrays.flat();
    
    console.log(`Total scores fetched: ${allScores.length}`);

    if (allScores.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No scores data fetched',
          timestamp: new Date().toISOString() 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean old scores
    const { error: cleanError } = await supabase.rpc('clean_old_cached_scores');
    if (cleanError) {
      console.error('Error cleaning old scores:', cleanError);
    }

    // Upsert all scores
    const { error: upsertError } = await supabase
      .from('cached_espn_scores')
      .upsert(allScores, { onConflict: 'game_id' });

    if (upsertError) {
      console.error('Error upserting scores:', upsertError);
      throw upsertError;
    }

    console.log(`Successfully cached ${allScores.length} scores`);

    return new Response(
      JSON.stringify({
        success: true,
        scores_cached: allScores.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-espn-scores:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
