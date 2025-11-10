import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// TheSportsDB free API key (use "3" for testing, or get a free key)
const SPORTSDB_API_KEY = '3';

async function searchTeamOnSportsDB(teamName: string): Promise<any> {
  try {
    const searchUrl = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/searchteams.php?t=${encodeURIComponent(teamName)}`;
    console.log(`Searching TheSportsDB: ${searchUrl}`);
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error(`TheSportsDB API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.teams && data.teams.length > 0) {
      // Return first matching team
      const team = data.teams[0];
      console.log(`Found team on TheSportsDB: ${team.strTeam}`);
      return team;
    }
    
    return null;
  } catch (error) {
    console.error('Error searching TheSportsDB:', error);
    return null;
  }
}

async function downloadImage(url: string): Promise<Uint8Array | null> {
  try {
    console.log(`Downloading image from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to download image: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      console.error(`Invalid content type: ${contentType}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Check if it's not a placeholder/error image (usually very small)
    if (bytes.length > 1000) {
      console.log(`Successfully downloaded image, size: ${bytes.length} bytes`);
      return bytes;
    }
    
    console.error(`Image too small: ${bytes.length} bytes`);
    return null;
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
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

    // Search for team on TheSportsDB
    const teamData = await searchTeamOnSportsDB(teamName);
    
    if (!teamData) {
      console.log(`Team not found on TheSportsDB: ${teamName}`);
      return new Response(
        JSON.stringify({ error: 'Team not found on TheSportsDB' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get team badge/logo URL from TheSportsDB
    // Priority: strTeamBadge (primary logo) > strTeamLogo (alternative)
    const logoUrl = teamData.strTeamBadge || teamData.strTeamLogo;
    
    if (!logoUrl) {
      console.log(`No logo URL found for team: ${teamName}`);
      return new Response(
        JSON.stringify({ error: 'No logo available for this team' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Download the image
    const logoData = await downloadImage(logoUrl);
    
    if (!logoData) {
      return new Response(
        JSON.stringify({ error: 'Failed to download logo' }),
        { 
          status: 500,
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
      JSON.stringify({ 
        url: cachedUrl, 
        cached: false,
        source: 'TheSportsDB',
        teamInfo: {
          name: teamData.strTeam,
          sport: teamData.strSport,
          league: teamData.strLeague,
        }
      }),
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

