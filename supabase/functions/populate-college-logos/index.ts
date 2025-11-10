import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Major college teams to pre-populate (will be searched on TheSportsDB)
const TEAMS_TO_CACHE = {
  NCAAF: [
    'Alabama Crimson Tide', 'Georgia Bulldogs', 'Ohio State Buckeyes', 'Michigan Wolverines', 
    'Notre Dame Fighting Irish', 'Oklahoma Sooners', 'Texas Longhorns', 'LSU Tigers', 
    'Florida Gators', 'Penn State Nittany Lions', 'Oregon Ducks', 'USC Trojans', 
    'Clemson Tigers', 'Auburn Tigers', 'Miami Hurricanes', 'Florida State Seminoles', 
    'Wisconsin Badgers', 'Iowa Hawkeyes', 'Michigan State Spartans', 'Nebraska Cornhuskers', 
    'Tennessee Volunteers', 'Ole Miss Rebels', 'Arkansas Razorbacks', 'Mississippi State Bulldogs',
    'Kentucky Wildcats', 'South Carolina Gamecocks', 'Missouri Tigers', 'Vanderbilt Commodores',
    'UCLA Bruins', 'Washington Huskies', 'Stanford Cardinal', 'Utah Utes', 'Colorado Buffaloes',
    'Arizona Wildcats', 'Arizona State Sun Devils', 'Oregon State Beavers', 'California Golden Bears',
    'Washington State Cougars', 'Oklahoma State Cowboys', 'TCU Horned Frogs', 'Baylor Bears',
    'Kansas Jayhawks', 'Kansas State Wildcats', 'Iowa State Cyclones', 'West Virginia Mountaineers',
    'Texas Tech Red Raiders', 'North Carolina Tar Heels', 'NC State Wolfpack', 'Duke Blue Devils',
    'Virginia Cavaliers', 'Virginia Tech Hokies', 'Pittsburgh Panthers', 'Louisville Cardinals',
    'Syracuse Orange', 'Boston College Eagles', 'Wake Forest Demon Deacons', 'Georgia Tech Yellow Jackets',
    'Northwestern Wildcats', 'Purdue Boilermakers', 'Illinois Fighting Illini', 'Minnesota Golden Gophers',
    'Indiana Hoosiers', 'Maryland Terrapins', 'Rutgers Scarlet Knights', 'North Texas Mean Green',
    'SMU Mustangs', 'Houston Cougars', 'BYU Cougars', 'Cincinnati Bearcats', 'UCF Knights',
  ],
  NCAAB: [
    'Duke Blue Devils', 'North Carolina Tar Heels', 'Kentucky Wildcats', 'Kansas Jayhawks',
    'UCLA Bruins', 'Gonzaga Bulldogs', 'Villanova Wildcats', 'Michigan Wolverines',
    'Arizona Wildcats', 'UConn Huskies', 'Syracuse Orange', 'Louisville Cardinals',
    'Indiana Hoosiers', 'Michigan State Spartans', 'Ohio State Buckeyes', 'Florida Gators',
    'Texas Longhorns', 'Purdue Boilermakers', 'Wisconsin Badgers', 'Illinois Fighting Illini',
    'Virginia Cavaliers', 'Pittsburgh Panthers', 'Marquette Golden Eagles', 'Creighton Bluejays',
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
