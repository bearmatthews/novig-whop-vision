import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-whop-user-token',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const whopToken = req.headers.get('x-whop-user-token');
    
    if (!whopToken) {
      return new Response(
        JSON.stringify({ error: 'No Whop token provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Call Whop API to verify token and get user info
    const whopApiKey = Deno.env.get('WHOP_API_KEY');
    const response = await fetch('https://api.whop.com/api/v2/me', {
      headers: {
        'Authorization': `Bearer ${whopToken}`,
        'X-Whop-Api-Key': whopApiKey || '',
      },
    });

    if (!response.ok) {
      console.error('Whop API error:', await response.text());
      return new Response(
        JSON.stringify({ error: 'Invalid Whop token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userData = await response.json();
    
    return new Response(
      JSON.stringify({ user: userData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in whop-auth function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});