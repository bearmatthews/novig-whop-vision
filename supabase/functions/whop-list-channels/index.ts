import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RequestSchema = z.object({
  experienceId: z.string().regex(/^exp_[a-zA-Z0-9_]+$/, 'Invalid experience ID format').optional()
});

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

    // List all experiences for the company
    const experiencesResp = await fetch(`https://api.whop.com/api/v1/experiences?company_id=${companyId}&first=100`, {
      headers: {
        'Authorization': `Bearer ${whopApiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!experiencesResp.ok) {
      const errTxt = await experiencesResp.text();
      console.error('Failed to list experiences:', experiencesResp.status, errTxt);
      return new Response(
        JSON.stringify({ error: 'Failed to list experiences' }),
        { status: experiencesResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const experiencesJson = await experiencesResp.json();
    const experiences = experiencesJson.data || [];
    console.log(`Found ${experiences.length} experiences for company ${companyId}`);

    // For each experience, check if it has forum posts available
    const channelsWithForums = await Promise.all(
      experiences.map(async (exp: any) => {
        try {
          // Try to fetch forum posts for this experience
          const forumResp = await fetch(`https://api.whop.com/api/v1/forum_posts?experience_id=${exp.id}&first=1`, {
            headers: {
              'Authorization': `Bearer ${whopApiKey}`,
              'Content-Type': 'application/json',
            }
          });

          const hasForums = forumResp.ok;
          
          return {
            id: exp.id,
            name: exp.name || exp.id,
            type: 'experience',
            has_forums: hasForums,
          };
        } catch (err) {
          console.error('Error checking forums for experience', exp.id, err);
          return {
            id: exp.id,
            name: exp.name || exp.id,
            type: 'experience',
            has_forums: false,
          };
        }
      })
    );

    // Also list chat channels for backward compatibility
    const channelsResp = await fetch(`https://api.whop.com/api/v1/chat_channels?company_id=${companyId}&first=100`, {
      headers: {
        'Authorization': `Bearer ${whopApiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!channelsResp.ok) {
      const errTxt = await channelsResp.text();
      console.error('Failed to list chat channels:', channelsResp.status, errTxt);
      // Continue even if chat channels fail
    }

    const chatChannels: any[] = [];
    if (channelsResp.ok) {
      const channelsJson = await channelsResp.json();
      const list = channelsJson.data || [];
      chatChannels.push(...list.map((ch: any) => ({
        id: ch.id,
        name: ch.experience?.name ? `${ch.experience.name} (Chat)` : ch.id,
        type: 'chat_channel',
        who_can_post: ch.who_can_post ?? null,
      })));
    }

    // Combine experiences with forums and chat channels
    const allChannels = [...channelsWithForums, ...chatChannels];

    console.log(`Returning ${allChannels.length} total channels (${channelsWithForums.length} experiences, ${chatChannels.length} chat channels) for company ${companyId}`);

    return new Response(
      JSON.stringify({ channels: allChannels }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
