import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Major college teams to pre-populate
const TEAMS_TO_CACHE = {
  NCAAF: [
    'Alabama', 'Georgia', 'Ohio State', 'Michigan', 'Notre Dame', 'Oklahoma', 
    'Texas', 'LSU', 'Florida', 'Penn State', 'Oregon', 'USC', 'Clemson', 
    'Auburn', 'Miami Florida', 'Florida State', 'Wisconsin', 'Iowa', 
    'Michigan State', 'Nebraska', 'Tennessee', 'Ole Miss', 'Arkansas', 
    'Mississippi State', 'Kentucky', 'South Carolina', 'Missouri', 'Vanderbilt',
    'UCLA', 'Washington', 'Stanford', 'Utah', 'Colorado', 'Arizona', 
    'Arizona State', 'Oregon State', 'California', 'Washington State',
    'Oklahoma State', 'TCU', 'Baylor', 'Kansas', 'Kansas State', 
    'Iowa State', 'West Virginia', 'Texas Tech', 'North Carolina', 
    'North Carolina State', 'Duke', 'Virginia', 'Virginia Tech', 
    'Pittsburgh', 'Louisville', 'Syracuse', 'Boston College', 'Wake Forest',
    'Georgia Tech', 'Northwestern', 'Purdue', 'Illinois', 'Minnesota',
    'Indiana', 'Maryland', 'Rutgers', 'North Texas', 'SMU', 'Houston',
    'BYU', 'Cincinnati', 'UCF',
  ],
  NCAAB: [
    'Duke', 'North Carolina', 'Kentucky', 'Kansas', 'UCLA', 'Gonzaga',
    'Villanova', 'Michigan', 'Arizona', 'UConn', 'Syracuse', 'Louisville',
    'Indiana', 'Michigan State', 'Ohio State', 'Florida', 'Texas',
    'Purdue', 'Wisconsin', 'Illinois', 'Virginia', 'Pittsburgh',
  ]
};

async function fetchLogoForTeam(teamName: string, league: string): Promise<boolean> {
  try {
    console.log(`Fetching logo for ${teamName} (${league})...`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/fetch-team-logo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ teamName, league }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ ${teamName}: ${data.cached ? 'already cached' : 'newly cached'}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`✗ ${teamName}: Failed - ${error}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ ${teamName}: Error - ${error}`);
    return false;
  }
}

async function populateLogos(league: string, batchSize = 5) {
  const teams = TEAMS_TO_CACHE[league as keyof typeof TEAMS_TO_CACHE] || [];
  let successful = 0;
  let failed = 0;

  console.log(`\n📸 Starting to populate ${league} logos (${teams.length} teams)...\n`);

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < teams.length; i += batchSize) {
    const batch = teams.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(team => fetchLogoForTeam(team, league))
    );
    
    successful += results.filter(r => r).length;
    failed += results.filter(r => !r).length;

    // Small delay between batches
    if (i + batchSize < teams.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n✅ Completed: ${successful} successful, ${failed} failed\n`);
  return { successful, failed, total: teams.length };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { league, all } = await req.json().catch(() => ({ all: true }));

    const results: any = {};

    if (all || !league) {
      // Populate both leagues
      results.NCAAF = await populateLogos('NCAAF');
      results.NCAAB = await populateLogos('NCAAB');
    } else {
      // Populate specific league
      results[league] = await populateLogos(league);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Logo population completed',
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in populate-college-logos:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
