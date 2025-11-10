import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// TheSportsDB API key (use env if set, otherwise free key '123')
const SPORTSDB_API_KEY = Deno.env.get('THESPORTSDB_API_KEY') || '123';

// NCAAB logo scraping from 1000logos.net
async function getNCABBLogoFrom1000Logos(teamName: string): Promise<string | null> {
  try {
    console.log(`Searching 1000logos.net for NCAAB team: ${teamName}`);
    const response = await fetch('https://1000logos.net/american-colleges-ncaa/');
    const html = await response.text();
    
    // Normalize search term with special cases
    let searchTerm = teamName.toLowerCase()
      .replace(/university of /gi, '')
      .replace(/state university/gi, 'state')
      .replace(/ university$/gi, '')
      .replace(/st\./gi, 'saint')
      .replace(/^st /gi, 'saint ')
      .trim();
    
    // Handle specific variations
    const specialCases: Record<string, string[]> = {
      'santa clara': ['santa clara'],
      'saint thomas': ['thomas aquinas', 'st thomas', 'saint thomas'],
      'cal state': ['california state', 'cal state'],
      'little rock': ['arkansas little rock', 'ualr', 'little rock'],
      'milwaukee': ['wisconsin milwaukee', 'uwm', 'milwaukee'],
      'uc': ['california'],
      'umass': ['massachusetts'],
    };
    
    const searchTerms: string[] = [searchTerm];
    
    // Check for special cases and add variations
    for (const [key, variations] of Object.entries(specialCases)) {
      if (searchTerm.includes(key)) {
        searchTerms.push(...variations);
      }
    }
    
    console.log(`Search terms: ${searchTerms.join(', ')}`);
    
    // Try to find logo URL in the HTML
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]+alt="([^"]+)"/gi;
    let match;
    
    while ((match = imgRegex.exec(html)) !== null) {
      const [, url, alt] = match;
      const altLower = alt.toLowerCase();
      
      // Check if alt text matches any search term
      for (const term of searchTerms) {
        const words = term.split(' ');
        if (altLower.includes(term) || words.every(word => word.length > 2 && altLower.includes(word))) {
          console.log(`Found logo on 1000logos.net: ${url} (matched: ${term})`);
          return url;
        }
      }
    }
    
    console.log(`No logo found on 1000logos.net for: ${teamName}`);
    return null;
  } catch (error) {
    console.error('Error fetching from 1000logos.net:', error);
    return null;
  }
}

function normalizeName(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .replace(/University of /i, '')
    .trim();
}

function getCandidateNames(teamName: string, league: string): string[] {
  const base = normalizeName(teamName);
  const variants = new Set<string>([base]);

  const replacements: Record<string, string> = {
    'UConn': 'Connecticut',
    'UNC': 'North Carolina',
    'NC State': 'North Carolina State',
    'Ole Miss': 'Mississippi',
    'BYU': 'Brigham Young',
    'USC': 'Southern California',
    'UCF': 'Central Florida',
    'UTEP': 'Texas El Paso',
    'TCU': 'Texas Christian',
    'SMU': 'Southern Methodist',
  };

  for (const [k, v] of Object.entries(replacements)) {
    if (base.startsWith(k + ' ')) variants.add(base.replace(k, v));
    if (base.includes(' ' + k + ' ')) variants.add(base.replace(' ' + k + ' ', ' ' + v + ' '));
  }

  // Strip nicknames if needed (e.g., "Cardinal" vs "Stanford Cardinal")
  if (base.includes(' ')) {
    const school = base.split(' ').slice(0, -1).join(' ');
    variants.add(school);
  }

  return Array.from(variants);
}

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

    // Helper to pick the best available logo field
    const pickLogoUrl = (t: any): string | null => {
      const candidates = [
        t?.strTeamBadge,
        t?.strLogo,
        t?.strTeamLogo,
        t?.strTeamBadge1,
        t?.strTeamBadge2,
        t?.strTeamWideBadge,
        t?.strTeamJersey,
        t?.strFanart1,
        t?.strTeamFanart1,
      ].filter(Boolean);
      return candidates.length ? candidates[0] : null;
    };

    // Try multiple name variants to improve hit-rate for colleges
    const variants = getCandidateNames(teamName, league);
    let teamData: any = null;
    
    // For NCAAB, try 1000logos.net first
    let logoUrl: string | null = null;
    
    if (league === 'NCAAB') {
      logoUrl = await getNCABBLogoFrom1000Logos(teamName);
    }
    
    // If not found on 1000logos or not NCAAB, try TheSportsDB
    if (!logoUrl) {
      for (const v of variants) {
        teamData = await searchTeamOnSportsDB(v);
        if (teamData) {
          logoUrl = pickLogoUrl(teamData);
          if (logoUrl) {
            console.log(`Using logo from TheSportsDB for variant: ${v}`);
            break;
          }
        }
      }
    }

    if (!logoUrl) {
      console.log(`No logo URL found for team: ${teamName}`);
      // Return 200 with a notFound flag so clients don't treat this as an error
      return new Response(
        JSON.stringify({ url: null, cached: false, notFound: true, team: teamName, league }),
        { 
          status: 200,
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
        source: league === 'NCAAB' && !teamData ? '1000logos.net' : 'TheSportsDB',
        teamInfo: teamData ? {
          name: teamData.strTeam,
          sport: teamData.strSport,
          league: teamData.strLeague,
        } : { name: teamName }
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

