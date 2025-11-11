import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-whop-user-token',
};

const ShareSchema = z.object({
  channel_id: z.string()
    .regex(/^(exp_|channel_)[a-zA-Z0-9_]+$/, 'Invalid channel ID format')
    .max(100),
  content: z.string()
    .min(1, 'Content required')
    .max(5000, 'Content too long (max 5000 characters)')
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const { channel_id, content } = ShareSchema.parse(rawBody);

    // Extract and verify user token
    const userToken = req.headers.get('x-whop-user-token');
    if (!userToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - user token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const whopApiKey = Deno.env.get('WHOP_API_KEY');
    if (!whopApiKey) {
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user ID from token (will be verified by Whop API)
    let userId: string | null = null;
    try {
      const tokenParts = userToken.split('.');
      if (tokenParts.length === 3) {
        const payloadJson = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(tokenParts[1]), c => c.charCodeAt(0))));
        userId = payloadJson.sub || payloadJson.user_id || null;
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has access to the channel/experience
    const resourceId = channel_id;
    const accessCheck = await fetch(
      `https://api.whop.com/api/v1/users/${userId}/access/${resourceId}`,
      { headers: { 'Authorization': `Bearer ${whopApiKey}` } }
    );

    if (!accessCheck.ok) {
      return new Response(
        JSON.stringify({ error: 'Access denied - you do not have permission to post here' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isExperience = channel_id.startsWith('exp_');

    if (isExperience) {
      // Post to experience forum
      const whopResponse = await fetch('https://api.whop.com/api/v1/forum_posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whopApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experience_id: channel_id,
          content,
          title: 'Betting Recommendation', // Required for forum posts
        }),
      });

      if (!whopResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to post to forum' }),
          { status: whopResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const post = await whopResponse.json();

      return new Response(
        JSON.stringify({ success: true, post }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Post to chat channel
      const whopResponse = await fetch('https://api.whop.com/api/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whopApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel_id,
          content,
        }),
      });

      if (!whopResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to send message' }),
          { status: whopResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const message = await whopResponse.json();

      return new Response(
        JSON.stringify({ success: true, message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
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
