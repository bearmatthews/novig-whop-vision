import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GRAPHQL_ENDPOINT = 'https://gql.novig.us/v1/graphql';
const LEAGUES = ['MLB', 'NBA', 'NFL', 'NHL', 'MLS', 'WNBA', 'NCAAB', 'NCAAF', 'UFC'];

const GET_EVENTS_QUERY = `
  query GetAllEvents($leagues: [String!]!) {
    event(
      where: {
        _and: [
          { _or: [{ status: { _eq: "OPEN_PREGAME" } }, { status: { _eq: "OPEN_INGAME" } }] }
          { game: { league: { _in: $leagues } } }
        ]
      }
      limit: 200
    ) {
      description
      id
      status
      game {
        scheduled_start
        league
      }
      markets(limit: 12) {
        description
        id
        outcomes(
          where: { _or: [{ last: { _is_null: false } }, { available: { _is_null: false } }] }
          limit: 4
        ) {
          description
          last
          available
          id
        }
      }
    }
  }
`;

async function fetchNovigData(leagues: string[]) {
  console.log(`Fetching Novig data for leagues: ${leagues.join(', ')}`);
  
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GET_EVENTS_QUERY,
      variables: { leagues },
    }),
  });

  if (!response.ok) {
    throw new Error(`Novig API error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL error: ${data.errors[0].message}`);
  }

  return data.data.event || [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Starting Novig data fetch...');

    // Fetch data for all leagues in batches to avoid rate limits
    const batchSize = 3;
    const allEvents = [];

    for (let i = 0; i < LEAGUES.length; i += batchSize) {
      const leagueBatch = LEAGUES.slice(i, i + batchSize);
      console.log(`Fetching batch ${i / batchSize + 1}: ${leagueBatch.join(', ')}`);
      
      const events = await fetchNovigData(leagueBatch);
      allEvents.push(...events);
      
      // Small delay between batches to avoid rate limits
      if (i + batchSize < LEAGUES.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Fetched ${allEvents.length} total events`);

    // Clean up old data
    await supabase.rpc('clean_old_cached_events');

    // Upsert new data
    const cacheData = allEvents.map((event: any) => ({
      event_id: event.id,
      event_data: event,
      league: event.game.league,
      status: event.status,
      last_updated: new Date().toISOString(),
    }));

    if (cacheData.length > 0) {
      const { error: insertError } = await supabase
        .from('cached_novig_events')
        .upsert(cacheData, { onConflict: 'event_id' });

      if (insertError) {
        console.error('Error caching events:', insertError);
        throw insertError;
      }
    }

    console.log(`Successfully cached ${cacheData.length} events`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        events_cached: cacheData.length,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in fetch-novig-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
