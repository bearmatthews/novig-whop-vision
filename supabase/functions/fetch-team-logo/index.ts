import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Alternative logo sources for college teams
const LOGO_SOURCES = [
  // ESPN College Basketball
  (team: string, league: string) => {
    if (league === 'NCAAB') {
      const abbr = team.toLowerCase().replace(/\s+/g, '-').substring(0, 10);
      return `https://a.espncdn.com/i/teamlogos/ncaa/500/${abbr}.png`;
    }
    return null;
  },
  // ESPN College Football
  (team: string, league: string) => {
    if (league === 'NCAAF') {
      const abbr = team.toLowerCase().replace(/\s+/g, '-').substring(0, 10);
      return `https://a.espncdn.com/i/teamlogos/ncaa/500/${abbr}.png`;
    }
    return null;
  },
  // Sports Logos alternative path
  (team: string, league: string) => {
    if (league === 'NCAAB' || league === 'NCAAF') {
      const abbr = team.toLowerCase().replace(/\s+/g, '');
      return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/${abbr}.png&h=200&w=200`;
    }
    return null;
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
