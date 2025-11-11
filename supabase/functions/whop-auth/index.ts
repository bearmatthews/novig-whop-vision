import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-whop-user-token, x-whop-app-id',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const whopToken = req.headers.get('x-whop-user-token');
    if (!whopToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', user: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const whopApiKey = Deno.env.get('WHOP_API_KEY');
    if (!whopApiKey) {
      return new Response(
        JSON.stringify({ error: 'Service configuration error', user: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Verify token and get user data via Whop API
    const response = await fetch('https://api.whop.com/api/v1/me', {
      headers: { 'Authorization': `Bearer ${whopToken}` }
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Invalid token', user: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userData = await response.json();
    
    return new Response(
      JSON.stringify({ user: userData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', user: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});