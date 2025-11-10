import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Team ID mapping for common college teams (from ESPN team IDs)
const COLLEGE_TEAM_IDS: Record<string, Record<string, string>> = {
  NCAAF: {
    'Alabama': '333',
    'Georgia': '61',
    'Ohio State': '194',
    'Michigan': '130',
    'Notre Dame': '87',
    'Oklahoma': '201',
    'Texas': '251',
    'LSU': '99',
    'Florida': '57',
    'Penn State': '213',
    'Oregon': '2483',
    'USC': '30',
    'Clemson': '228',
    'Auburn': '2',
    'Miami': '2390',
    'Miami Florida': '2390',
    'Florida State': '52',
    'Wisconsin': '275',
    'Iowa': '2294',
    'Michigan State': '127',
    'Nebraska': '158',
    'Tennessee': '2633',
    'Ole Miss': '145',
    'Arkansas': '8',
    'Mississippi State': '344',
    'Kentucky': '96',
    'South Carolina': '2579',
    'Missouri': '142',
    'Vanderbilt': '238',
    'UCLA': '26',
    'Washington': '264',
    'Stanford': '24',
    'Utah': '254',
    'Colorado': '38',
    'Arizona': '12',
    'Arizona State': '9',
    'Oregon State': '204',
    'California': '25',
    'Washington State': '265',
    'Oklahoma State': '197',
    'TCU': '2628',
    'Baylor': '239',
    'Kansas': '2305',
    'Kansas State': '2306',
    'Iowa State': '66',
    'West Virginia': '277',
    'Texas Tech': '2641',
    'North Carolina': '153',
    'North Carolina State': '152',
    'Duke': '150',
    'Virginia': '258',
    'Virginia Tech': '259',
    'Pittsburgh': '221',
    'Louisville': '97',
    'Syracuse': '183',
    'Boston College': '103',
    'Wake Forest': '154',
    'Georgia Tech': '59',
    'Northwestern': '77',
    'Purdue': '2509',
    'Illinois': '356',
    'Minnesota': '135',
    'Indiana': '84',
    'Maryland': '120',
    'Rutgers': '164',
    'North Texas': '249',
    'SMU': '2567',
    'Houston': '248',
    'BYU': '252',
    'Cincinnati': '2132',
    'UCF': '2116',
  },
  NCAAB: {
    'Duke': '150',
    'North Carolina': '153',
    'Kentucky': '96',
    'Kansas': '2305',
    'UCLA': '26',
    'Gonzaga': '2250',
    'Villanova': '222',
    'Michigan': '130',
    'Arizona': '12',
    'UConn': '41',
    'Syracuse': '183',
    'Louisville': '97',
    'Indiana': '84',
    'Michigan State': '127',
    'Ohio State': '194',
    'Florida': '57',
    'Texas': '251',
    'Purdue': '2509',
    'Wisconsin': '275',
    'Illinois': '356',
    'Virginia': '258',
    'Pittsburgh': '221',
  }
};

// Alternative logo sources for college teams
const LOGO_SOURCES = [
  // ESPN Team API (most reliable for college sports)
  (team: string, league: string) => {
    const teamId = COLLEGE_TEAM_IDS[league]?.[team];
    if (teamId) {
      const sport = league === 'NCAAB' ? 'mens-college-basketball' : 'college-football';
      return `https://a.espncdn.com/i/teamlogos/${sport}/500/${teamId}.png`;
    }
    return null;
  },
  // ESPN Direct abbreviation path
  (team: string, league: string) => {
    const abbr = team.toLowerCase()
      .replace(/state$/i, 'st')
      .replace(/university|college/gi, '')
      .trim()
      .replace(/\s+/g, '')
      .substring(0, 6);
    
    if (league === 'NCAAB') {
      return `https://a.espncdn.com/i/teamlogos/ncaa/500/${abbr}.png`;
    } else if (league === 'NCAAF') {
      return `https://a.espncdn.com/i/teamlogos/ncaa/500/${abbr}.png`;
    }
    return null;
  },
  // ESPN Combiner API
  (team: string, league: string) => {
    const teamId = COLLEGE_TEAM_IDS[league]?.[team];
    if (teamId) {
      const sport = league === 'NCAAB' ? 'mens-college-basketball' : 'college-football';
      return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/${sport}/500/${teamId}.png&w=500&h=500`;
    }
    return null;
  },
  // Try with team name slugified
  (team: string, league: string) => {
    const slug = team.toLowerCase().replace(/\s+/g, '-');
    const sport = league === 'NCAAB' ? 'mens-college-basketball' : 'college-football';
    return `https://a.espncdn.com/i/teamlogos/${sport}/500/${slug}.png`;
  },
];

async function fetchLogoFromSources(teamName: string, league: string): Promise<Uint8Array | null> {
  for (const sourceGenerator of LOGO_SOURCES) {
    const url = sourceGenerator(teamName, league);
    if (!url) continue;

    try {
      console.log(`Trying to fetch logo from: ${url}`);
      const response = await fetch(url);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        // Make sure it's actually an image
        if (contentType?.startsWith('image/')) {
          const arrayBuffer = await response.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          
          // Check if it's not a placeholder/error image (usually very small)
          if (bytes.length > 1000) {
            console.log(`Successfully fetched logo from ${url}, size: ${bytes.length}`);
            return bytes;
          }
        }
      }
    } catch (error) {
      console.log(`Failed to fetch from ${url}:`, error);
    }
  }
  
  return null;
}

async function cacheLogoToStorage(teamName: string, league: string, logoData: Uint8Array): Promise<string | null> {
  try {
    const fileName = `${league}/${teamName.toLowerCase().replace(/\s+/g, '-')}.png`;
    
    const { data, error } = await supabase.storage
      .from('team-logos')
      .upload(fileName, logoData, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading to storage:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('team-logos')
      .getPublicUrl(fileName);

    console.log(`Logo cached for ${teamName} (${league}) at ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Error in cacheLogoToStorage:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teamName, league } = await req.json();

    if (!teamName || !league) {
      return new Response(
        JSON.stringify({ error: 'teamName and league are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Fetching logo for ${teamName} in ${league}`);

    // Check if already cached in storage
    const fileName = `${league}/${teamName.toLowerCase().replace(/\s+/g, '-')}.png`;
    const { data: existingFile } = await supabase.storage
      .from('team-logos')
      .list(league, {
        search: teamName.toLowerCase().replace(/\s+/g, '-'),
      });

    if (existingFile && existingFile.length > 0) {
      const { data: { publicUrl } } = supabase.storage
        .from('team-logos')
        .getPublicUrl(fileName);
      
      console.log(`Logo found in cache: ${publicUrl}`);
      return new Response(
        JSON.stringify({ url: publicUrl, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch from sources
    const logoData = await fetchLogoFromSources(teamName, league);
    
    if (!logoData) {
      return new Response(
        JSON.stringify({ error: 'Logo not found in any source' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Cache to storage
    const cachedUrl = await cacheLogoToStorage(teamName, league, logoData);

    if (!cachedUrl) {
      return new Response(
        JSON.stringify({ error: 'Failed to cache logo' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ url: cachedUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-team-logo:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
