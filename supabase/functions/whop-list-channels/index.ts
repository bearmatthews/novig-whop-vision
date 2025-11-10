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

    // Optional input body
    let experienceId: string | null = null;
    try {
      const json = await req.json().catch(() => null);
      experienceId = json?.experience_id ?? json?.experienceId ?? null;
    } catch (_) {}

    // Get user token from header (for logging / auth context)
    const userToken = req.headers.get('x-whop-user-token');
    if (!userToken) {
      return new Response(
        JSON.stringify({ error: 'User token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode user ID from token (not strictly required to list channels)
    const parts = userToken.split('.');
    if (parts.length !== 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.parse(atob(parts[1]));
    const userId = payload.sub;
    console.log('Fetching channels for user:', userId, 'experienceId:', experienceId);

    // Resolve company_id using the experienceId
    let companyId: string | null = null;
    if (experienceId) {
      const expResp = await fetch(`https://api.whop.com/api/v1/experiences/${experienceId}`, {
        headers: {
          'Authorization': `Bearer ${whopApiKey}`,
          'Content-Type': 'application/json',
        }
      });
      if (expResp.ok) {
        const exp = await expResp.json();
        companyId = exp?.company?.id ?? null;
        console.log('Resolved companyId from experience:', companyId);
      } else {
        const t = await expResp.text();
        console.warn('Failed to fetch experience', experienceId, expResp.status, t);
      }
    }

    if (!companyId) {
      // As a fallback, do not attempt memberships (requires company_id). Return empty.
      console.warn('No companyId resolved; returning empty channel list');
      return new Response(JSON.stringify({ channels: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // List chat channels for the resolved company
    const channelsResp = await fetch(`https://api.whop.com/api/v1/chat_channels?company_id=${companyId}&first=100`, {
      headers: {
        'Authorization': `Bearer ${whopApiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!channelsResp.ok) {
      const errTxt = await channelsResp.text();
      console.error('Failed to list chat channels:', channelsResp.status, errTxt);
      return new Response(
        JSON.stringify({ error: 'Failed to list chat channels' }),
        { status: channelsResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const channelsJson = await channelsResp.json();
    const list = channelsJson.data || [];

    const channels = list.map((ch: any) => ({
      id: ch.id,
      name: ch.experience?.name ? `${ch.experience.name}` : ch.id,
      type: 'chat_channel',
      who_can_post: ch.who_can_post ?? null,
    }));

    console.log(`Returning ${channels.length} channels for company ${companyId}`);

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
