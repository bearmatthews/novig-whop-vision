import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-whop-user-token',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const whopApiKey = Deno.env.get('WHOP_API_KEY');
    const whopAppId = Deno.env.get('WHOP_APP_ID');
    
    if (!whopApiKey || !whopAppId) {
      console.error('WHOP_API_KEY or WHOP_APP_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Whop credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user token from header
    const userToken = req.headers.get('x-whop-user-token');
    if (!userToken) {
      return new Response(
        JSON.stringify({ error: 'User token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode user ID from token
    const parts = userToken.split('.');
    if (parts.length !== 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.parse(atob(parts[1]));
    const userId = payload.sub;

    console.log('Fetching channels for user:', userId);

    // Fetch user's memberships to get experiences they have access to
    const membershipsResponse = await fetch(
      `https://api.whop.com/api/v1/memberships?user_id=${userId}&valid=true`,
      {
        headers: {
          'Authorization': `Bearer ${whopApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!membershipsResponse.ok) {
      const errorText = await membershipsResponse.text();
      console.error('Failed to fetch memberships:', membershipsResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user memberships' }),
        { status: membershipsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const membershipsData = await membershipsResponse.json();
    const memberships = membershipsData.data || [];

    console.log(`Found ${memberships.length} memberships`);

    // Extract unique experience IDs from memberships
    const experienceIds = new Set<string>();
    for (const membership of memberships) {
      if (membership.product?.experiences) {
        for (const exp of membership.product.experiences) {
          experienceIds.add(exp);
        }
      }
    }

    // Fetch experience details for each experience ID
    const channels = [];
    for (const expId of experienceIds) {
      try {
        const expResponse = await fetch(
          `https://api.whop.com/api/v1/experiences/${expId}`,
          {
            headers: {
              'Authorization': `Bearer ${whopApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (expResponse.ok) {
          const experience = await expResponse.json();
          channels.push({
            id: experience.id,
            name: experience.name || experience.id,
            type: 'experience',
          });
        }
      } catch (error) {
        console.error(`Failed to fetch experience ${expId}:`, error);
      }
    }

    console.log(`Returning ${channels.length} accessible channels`);

    return new Response(
      JSON.stringify({ channels }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in whop-list-channels:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
